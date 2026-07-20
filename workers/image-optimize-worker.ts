/**
 * Process dédié : consomme la file BullMQ `image-optimize` et exécute Sharp.
 *
 * Conçu pour un VPS ~3 vCPU / 4 Go RAM : concurrency=1, effort WebP conservateur.
 * Démarrage :
 *   npm run worker:images
 *   NODE_ENV=production node dist/image-optimize-worker.js
 */
import "dotenv/config";
import { Worker, type Job } from "bullmq";
import {
  IMAGE_OPTIMIZE_QUEUE_NAME,
  IMAGE_WORKER_HEARTBEAT_KEY,
  type ImageOptimizeJobData,
  type ImageOptimizeJobResult,
} from "../app/lib/image-optimize-queue";
import { optimizeUploadImage } from "../app/lib/image-optimize";
import { getStorageBackend } from "../app/lib/storage/backend";
import { disconnectRedis, getRedisClient } from "../app/lib/redis";

const HEARTBEAT_TTL_SEC = 30;
const HEARTBEAT_INTERVAL_MS = 10_000;

function concurrency(): number {
  const raw = process.env.IMAGE_WORKER_CONCURRENCY;
  const n = raw ? Number(raw) : 1;
  // Plafond bas : Sharp + buffers sur 4 Go RAM.
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(2, Math.floor(n));
}

function redisUrl(): string {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.error("[image-worker] REDIS_URL est obligatoire");
    process.exit(1);
  }
  return url;
}

async function processJob(
  job: Job<ImageOptimizeJobData, ImageOptimizeJobResult>
): Promise<ImageOptimizeJobResult> {
  const { inputKey, outputKey, preset } = job.data;
  const backend = getStorageBackend();

  const input = await backend.get(inputKey);
  if (!input) {
    throw new Error(`Input staging manquant: ${inputKey}`);
  }

  const optimized = await optimizeUploadImage(input, preset);
  await backend.put(outputKey, optimized.buffer, optimized.mime);

  return {
    mime: optimized.mime,
    extension: optimized.extension,
    width: optimized.width,
    height: optimized.height,
    sizeBytes: optimized.sizeBytes,
    outputKey,
  };
}

async function writeHeartbeat(): Promise<void> {
  const client = getRedisClient();
  if (!client) return;
  if (client.status !== "ready") {
    await client.connect();
  }
  await client.set(
    IMAGE_WORKER_HEARTBEAT_KEY,
    String(Date.now()),
    "EX",
    HEARTBEAT_TTL_SEC
  );
}

async function clearHeartbeat(): Promise<void> {
  try {
    const client = getRedisClient();
    if (!client) return;
    if (client.status !== "ready") return;
    await client.del(IMAGE_WORKER_HEARTBEAT_KEY);
  } catch {
    // ignore
  }
}

const worker = new Worker<ImageOptimizeJobData, ImageOptimizeJobResult>(
  IMAGE_OPTIMIZE_QUEUE_NAME,
  processJob,
  {
    connection: {
      url: redisUrl(),
      maxRetriesPerRequest: null,
    },
    concurrency: concurrency(),
    lockDuration: 60_000,
  }
);

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let shuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.error(`[image-worker] Arrêt (${signal})…`);

  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  try {
    await worker.close();
    await clearHeartbeat();
    await disconnectRedis();
    process.exit(0);
  } catch (error) {
    console.error("[image-worker] Erreur pendant l'arrêt:", error);
    process.exit(1);
  }
}

worker.on("ready", () => {
  console.log(
    `[image-worker] Prêt (queue=${IMAGE_OPTIMIZE_QUEUE_NAME}, concurrency=${concurrency()})`
  );
});

worker.on("completed", (job) => {
  console.log(
    `[image-worker] OK job=${job.id} preset=${job.data.preset} bytes=${job.returnvalue?.sizeBytes ?? "?"}`
  );
});

worker.on("failed", (job, err) => {
  console.error(
    `[image-worker] Échec job=${job?.id ?? "?"} preset=${job?.data.preset ?? "?"}:`,
    err.message
  );
});

worker.on("error", (err) => {
  console.error("[image-worker] Erreur worker:", err);
});

void writeHeartbeat().catch((err) => {
  console.error("[image-worker] Heartbeat initial échoué:", err);
});

heartbeatTimer = setInterval(() => {
  void writeHeartbeat().catch((err) => {
    console.error("[image-worker] Heartbeat échoué:", err);
  });
}, HEARTBEAT_INTERVAL_MS);
heartbeatTimer.unref?.();

process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});
process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

process.on("uncaughtException", (error) => {
  console.error("[image-worker] uncaughtException:", error);
  void gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  console.error("[image-worker] unhandledRejection:", reason);
  void gracefulShutdown("unhandledRejection");
});
