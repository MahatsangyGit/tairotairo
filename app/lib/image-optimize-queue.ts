import { Queue, QueueEvents, type ConnectionOptions } from "bullmq";
import type { ImageOptimizePreset, OptimizedImage } from "@/lib/image-optimize";
import { getStorageBackend } from "@/lib/storage/backend";
import { randomUUID } from "crypto";

export const IMAGE_OPTIMIZE_QUEUE_NAME = "image-optimize";
export const IMAGE_WORKER_HEARTBEAT_KEY = "tairo:image-worker:heartbeat";

export type ImageOptimizeJobData = {
  jobId: string;
  inputKey: string;
  outputKey: string;
  preset: ImageOptimizePreset;
};

export type ImageOptimizeJobResult = {
  mime: OptimizedImage["mime"];
  extension: OptimizedImage["extension"];
  width: number;
  height: number;
  sizeBytes: number;
  outputKey: string;
};

function redisConnection(): ConnectionOptions {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL est requis pour la file d'optimisation d'images");
  }
  return {
    url,
    maxRetriesPerRequest: null,
  };
}

let queue: Queue<ImageOptimizeJobData, ImageOptimizeJobResult> | null = null;
let queueEvents: QueueEvents | null = null;

function getQueue(): Queue<ImageOptimizeJobData, ImageOptimizeJobResult> {
  if (!queue) {
    queue = new Queue(IMAGE_OPTIMIZE_QUEUE_NAME, {
      connection: redisConnection(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 750 },
        removeOnComplete: { age: 3600, count: 200 },
        removeOnFail: { age: 86_400, count: 500 },
      },
    });
  }
  return queue;
}

function getQueueEvents(): QueueEvents {
  if (!queueEvents) {
    queueEvents = new QueueEvents(IMAGE_OPTIMIZE_QUEUE_NAME, {
      connection: redisConnection(),
    });
  }
  return queueEvents;
}

export function getImageOptimizeTimeoutMs(): number {
  const raw = process.env.IMAGE_OPTIMIZE_TIMEOUT_MS;
  const n = raw ? Number(raw) : 30_000;
  return Number.isFinite(n) && n >= 5_000 ? n : 30_000;
}

export function resolveImageOptimizeMode(): "queue" | "inline" {
  const explicit = process.env.IMAGE_OPTIMIZE_MODE?.trim().toLowerCase();
  if (explicit === "queue" || explicit === "inline") return explicit;

  // Vercel serverless : pas de worker Sharp long-lived → Sharp inline dans l'API.
  // (Sinon REDIS_URL en prod bascule en "queue" et les uploads timeout → « Erreur serveur ».)
  if (process.env.VERCEL === "1") {
    return "inline";
  }

  // auto: file dédiée en production self-hosted (Redis + `npm run worker:images`) ;
  // inline en local pour ne pas exiger le worker pendant `npm run dev`.
  if (process.env.NODE_ENV === "production" && process.env.REDIS_URL) {
    return "queue";
  }
  return "inline";
}

function stagingKeys(jobId: string): { inputKey: string; outputKey: string } {
  const prefix = `_tmp/image-optimize/${jobId}`;
  return {
    inputKey: `${prefix}/input.bin`,
    outputKey: `${prefix}/output.webp`,
  };
}

async function deleteStaging(keys: string[]): Promise<void> {
  const backend = getStorageBackend();
  await Promise.all(
    keys.map(async (key) => {
      try {
        await backend.delete(key);
      } catch {
        // best-effort cleanup
      }
    })
  );
}

/**
 * Envoie le buffer brut au worker Sharp via BullMQ, attend le WebP optimisé.
 * Les octets transitent par le storage (`_tmp/…`), pas par Redis.
 */
export async function optimizeUploadImageViaQueue(
  input: Buffer,
  preset: ImageOptimizePreset
): Promise<OptimizedImage> {
  const jobId = randomUUID();
  const { inputKey, outputKey } = stagingKeys(jobId);
  const backend = getStorageBackend();
  const timeoutMs = getImageOptimizeTimeoutMs();

  await backend.put(inputKey, input, "application/octet-stream");

  try {
    const q = getQueue();
    const events = getQueueEvents();
    await events.waitUntilReady();

    const job = await q.add(
      "optimize",
      { jobId, inputKey, outputKey, preset },
      { jobId }
    );

    const result = (await job.waitUntilFinished(
      events,
      timeoutMs
    )) as ImageOptimizeJobResult;

    const optimized = await backend.get(result.outputKey);
    if (!optimized) {
      throw new Error("Résultat d'optimisation introuvable dans le storage");
    }

    return {
      buffer: optimized,
      mime: result.mime,
      extension: result.extension,
      width: result.width,
      height: result.height,
      sizeBytes: result.sizeBytes,
    };
  } finally {
    await deleteStaging([inputKey, outputKey]);
  }
}

export async function disconnectImageOptimizeQueue(): Promise<void> {
  const closing: Promise<unknown>[] = [];
  if (queue) {
    closing.push(queue.close());
    queue = null;
  }
  if (queueEvents) {
    closing.push(queueEvents.close());
    queueEvents = null;
  }
  await Promise.all(closing);
}

export async function isImageWorkerHealthy(): Promise<boolean | null> {
  if (resolveImageOptimizeMode() !== "queue") return null;
  if (!process.env.REDIS_URL) return false;

  try {
    const { getRedisClient } = await import("@/lib/redis");
    const client = getRedisClient();
    if (!client) return false;
    if (client.status !== "ready") {
      await client.connect();
    }
    const beat = await client.get(IMAGE_WORKER_HEARTBEAT_KEY);
    return beat != null;
  } catch {
    return false;
  }
}
