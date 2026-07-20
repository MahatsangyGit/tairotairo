"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// app/lib/redis.ts
function getRedisClient() {
  if (client) return client;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  client = new import_ioredis.default(url, {
    maxRetriesPerRequest: 2,
    lazyConnect: true
  });
  return client;
}
async function disconnectRedis() {
  if (!client) return;
  await client.quit();
  client = null;
}
var import_ioredis, client;
var init_redis = __esm({
  "app/lib/redis.ts"() {
    "use strict";
    import_ioredis = __toESM(require("ioredis"));
    client = null;
  }
});

// workers/image-optimize-worker.ts
var import_config = require("dotenv/config");
var import_bullmq2 = require("bullmq");

// app/lib/image-optimize-queue.ts
var import_bullmq = require("bullmq");

// app/lib/storage/backend.ts
var import_promises = require("fs/promises");
var import_path = __toESM(require("path"));
var import_client_s3 = require("@aws-sdk/client-s3");
function assertSafeStorageKey(key) {
  if (!key || key.includes("\0")) {
    throw new Error("Cl\xE9 de stockage invalide");
  }
  const normalized = key.replace(/\\/g, "/");
  if (normalized.startsWith("/") || normalized.includes("..") || import_path.default.isAbsolute(normalized)) {
    throw new Error("Cl\xE9 de stockage invalide");
  }
}
var LocalFilesystemBackend = class {
  constructor(rootDir) {
    this.rootDir = rootDir;
  }
  resolveKey(key) {
    assertSafeStorageKey(key);
    const resolvedRoot = import_path.default.resolve(this.rootDir);
    const resolved = import_path.default.resolve(resolvedRoot, key);
    const relative = import_path.default.relative(resolvedRoot, resolved);
    if (relative.startsWith("..") || import_path.default.isAbsolute(relative)) {
      throw new Error("Cl\xE9 de stockage invalide");
    }
    return resolved;
  }
  async put(key, buffer, _contentType) {
    const filePath = this.resolveKey(key);
    await (0, import_promises.mkdir)(import_path.default.dirname(filePath), { recursive: true });
    await (0, import_promises.writeFile)(filePath, buffer);
  }
  async get(key) {
    try {
      return await (0, import_promises.readFile)(this.resolveKey(key));
    } catch {
      return null;
    }
  }
  async delete(key) {
    try {
      await (0, import_promises.unlink)(this.resolveKey(key));
    } catch {
    }
  }
  async exists(key) {
    try {
      await (0, import_promises.access)(this.resolveKey(key));
      return true;
    } catch {
      return false;
    }
  }
};
var S3Backend = class {
  constructor(opts) {
    this.bucket = opts.bucket;
    this.client = new import_client_s3.S3Client({
      region: opts.region,
      endpoint: opts.endpoint,
      forcePathStyle: Boolean(opts.endpoint),
      credentials: {
        accessKeyId: opts.accessKeyId,
        secretAccessKey: opts.secretAccessKey
      }
    });
  }
  normalizeKey(key) {
    assertSafeStorageKey(key);
    return key.replace(/\\/g, "/");
  }
  async put(key, buffer, contentType) {
    await this.client.send(
      new import_client_s3.PutObjectCommand({
        Bucket: this.bucket,
        Key: this.normalizeKey(key),
        Body: buffer,
        ContentType: contentType
      })
    );
  }
  async get(key) {
    try {
      const result = await this.client.send(
        new import_client_s3.GetObjectCommand({
          Bucket: this.bucket,
          Key: this.normalizeKey(key)
        })
      );
      if (!result.Body) return null;
      const bytes = await result.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch (error) {
      const name = error && typeof error === "object" && "name" in error ? String(error.name) : "";
      const status = error && typeof error === "object" && "$metadata" in error ? error.$metadata?.httpStatusCode : void 0;
      if (name === "NoSuchKey" || status === 404) return null;
      throw error;
    }
  }
  async delete(key) {
    await this.client.send(
      new import_client_s3.DeleteObjectCommand({
        Bucket: this.bucket,
        Key: this.normalizeKey(key)
      })
    );
  }
  async exists(key) {
    try {
      await this.client.send(
        new import_client_s3.HeadObjectCommand({
          Bucket: this.bucket,
          Key: this.normalizeKey(key)
        })
      );
      return true;
    } catch (error) {
      const status = error && typeof error === "object" && "$metadata" in error ? error.$metadata?.httpStatusCode : void 0;
      if (status === 404) return false;
      throw error;
    }
  }
};
var cachedBackend = null;
function getStorageRoot() {
  return import_path.default.join(process.cwd(), "storage");
}
function getStorageBackend() {
  if (cachedBackend) return cachedBackend;
  const mode = (process.env.STORAGE_BACKEND ?? "local").toLowerCase();
  if (mode === "s3") {
    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "STORAGE_BACKEND=s3 n\xE9cessite S3_BUCKET, S3_REGION, AWS_ACCESS_KEY_ID et AWS_SECRET_ACCESS_KEY"
      );
    }
    cachedBackend = new S3Backend({
      bucket,
      region,
      endpoint: process.env.S3_ENDPOINT || void 0,
      accessKeyId,
      secretAccessKey
    });
    return cachedBackend;
  }
  if (mode !== "local") {
    throw new Error(
      `STORAGE_BACKEND invalide: ${mode} (attendu local|s3)`
    );
  }
  cachedBackend = new LocalFilesystemBackend(getStorageRoot());
  return cachedBackend;
}

// app/lib/image-optimize-queue.ts
var IMAGE_OPTIMIZE_QUEUE_NAME = "image-optimize";
var IMAGE_WORKER_HEARTBEAT_KEY = "tairo:image-worker:heartbeat";

// app/lib/image-optimize.ts
var import_sharp = __toESM(require("sharp"));
var PRESETS = {
  // Carré compact pour avatars (affichage ~32–128px, marge retina).
  avatar: { maxWidth: 512, maxHeight: 512, quality: 80 },
  // Réalisations portfolio : assez nettes sur mobile/desktop.
  portfolio: { maxWidth: 1600, maxHeight: 1600, quality: 82 },
  // Couvertures demandes / services (hero cards).
  cover: { maxWidth: 1920, maxHeight: 1080, quality: 80 }
};
async function optimizeUploadImage(input, preset) {
  const { maxWidth, maxHeight, quality } = PRESETS[preset];
  const pipeline = (0, import_sharp.default)(input, { failOn: "none" }).rotate().resize({
    width: maxWidth,
    height: maxHeight,
    fit: preset === "avatar" ? "cover" : "inside",
    withoutEnlargement: true,
    position: "centre"
  }).webp({
    quality,
    effort: 4,
    smartSubsample: true
  });
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  return {
    buffer: data,
    mime: "image/webp",
    extension: ".webp",
    width: info.width,
    height: info.height,
    sizeBytes: data.length
  };
}

// workers/image-optimize-worker.ts
init_redis();
var HEARTBEAT_TTL_SEC = 30;
var HEARTBEAT_INTERVAL_MS = 1e4;
function concurrency() {
  const raw = process.env.IMAGE_WORKER_CONCURRENCY;
  const n = raw ? Number(raw) : 1;
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(2, Math.floor(n));
}
function redisUrl() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.error("[image-worker] REDIS_URL est obligatoire");
    process.exit(1);
  }
  return url;
}
async function processJob(job) {
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
    outputKey
  };
}
async function writeHeartbeat() {
  const client2 = getRedisClient();
  if (!client2) return;
  if (client2.status !== "ready") {
    await client2.connect();
  }
  await client2.set(
    IMAGE_WORKER_HEARTBEAT_KEY,
    String(Date.now()),
    "EX",
    HEARTBEAT_TTL_SEC
  );
}
async function clearHeartbeat() {
  try {
    const client2 = getRedisClient();
    if (!client2) return;
    if (client2.status !== "ready") return;
    await client2.del(IMAGE_WORKER_HEARTBEAT_KEY);
  } catch {
  }
}
var worker = new import_bullmq2.Worker(
  IMAGE_OPTIMIZE_QUEUE_NAME,
  processJob,
  {
    connection: {
      url: redisUrl(),
      maxRetriesPerRequest: null
    },
    concurrency: concurrency(),
    lockDuration: 6e4
  }
);
var heartbeatTimer = null;
var shuttingDown = false;
async function gracefulShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.error(`[image-worker] Arr\xEAt (${signal})\u2026`);
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
    console.error("[image-worker] Erreur pendant l'arr\xEAt:", error);
    process.exit(1);
  }
}
worker.on("ready", () => {
  console.log(
    `[image-worker] Pr\xEAt (queue=${IMAGE_OPTIMIZE_QUEUE_NAME}, concurrency=${concurrency()})`
  );
});
worker.on("completed", (job) => {
  console.log(
    `[image-worker] OK job=${job.id} preset=${job.data.preset} bytes=${job.returnvalue?.sizeBytes ?? "?"}`
  );
});
worker.on("failed", (job, err) => {
  console.error(
    `[image-worker] \xC9chec job=${job?.id ?? "?"} preset=${job?.data.preset ?? "?"}:`,
    err.message
  );
});
worker.on("error", (err) => {
  console.error("[image-worker] Erreur worker:", err);
});
void writeHeartbeat().catch((err) => {
  console.error("[image-worker] Heartbeat initial \xE9chou\xE9:", err);
});
heartbeatTimer = setInterval(() => {
  void writeHeartbeat().catch((err) => {
    console.error("[image-worker] Heartbeat \xE9chou\xE9:", err);
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
