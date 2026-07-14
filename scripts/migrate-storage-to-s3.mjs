#!/usr/bin/env node
/**
 * Backfill local `storage/` objects into S3 (or S3-compatible endpoint).
 *
 * Usage:
 *   node scripts/migrate-storage-to-s3.mjs --dry-run
 *   node scripts/migrate-storage-to-s3.mjs
 *
 * Requires: S3_BUCKET, S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 * Optional: S3_ENDPOINT (MinIO / R2 / custom)
 */
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const STORAGE_ROOT = path.join(ROOT, "storage");

const dryRun = process.argv.includes("--dry-run");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env: ${name}`);
    process.exit(1);
  }
  return value;
}

function contentTypeForKey(key) {
  const ext = path.extname(key).toLowerCase();
  switch (ext) {
    case ".webp":
      return "image/webp";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}

async function* walkFiles(dir, base = dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === "ENOENT") return;
    throw error;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(full, base);
    } else if (entry.isFile()) {
      const relative = path.relative(base, full).split(path.sep).join("/");
      yield { full, key: relative };
    }
  }
}

async function sha256File(filePath) {
  const hash = createHash("sha256");
  const stream = createReadStream(filePath);
  for await (const chunk of stream) {
    hash.update(chunk);
  }
  return hash.digest("hex");
}

async function main() {
  const bucket = requireEnv("S3_BUCKET");
  const region = requireEnv("S3_REGION");
  const accessKeyId = requireEnv("AWS_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("AWS_SECRET_ACCESS_KEY");
  const endpoint = process.env.S3_ENDPOINT || undefined;

  const client = new S3Client({
    region,
    endpoint,
    forcePathStyle: Boolean(endpoint),
    credentials: { accessKeyId, secretAccessKey },
  });

  console.log(
    dryRun
      ? `[dry-run] Scanning ${STORAGE_ROOT} → s3://${bucket}`
      : `Migrating ${STORAGE_ROOT} → s3://${bucket}`
  );

  let scanned = 0;
  let uploaded = 0;
  let skipped = 0;
  let mismatched = 0;

  for await (const { full, key } of walkFiles(STORAGE_ROOT)) {
    scanned += 1;
    const localHash = await sha256File(full);
    const fileStat = await stat(full);
    const contentType = contentTypeForKey(key);

    let remoteHash = null;
    let remoteSize = null;
    try {
      const head = await client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key })
      );
      remoteSize = head.ContentLength ?? null;
      remoteHash =
        head.Metadata?.sha256 ??
        (head.ETag ? head.ETag.replaceAll('"', "") : null);
    } catch (error) {
      const status = error?.$metadata?.httpStatusCode;
      if (status !== 404 && error?.name !== "NotFound") {
        throw error;
      }
    }

    const sameSize =
      remoteSize !== null && remoteSize === fileStat.size;

    if (remoteSize !== null && remoteHash === localHash) {
      skipped += 1;
      console.log(`skip (checksum match) ${key}`);
      continue;
    }

    if (remoteSize !== null && sameSize && !process.env.FORCE_UPLOAD) {
      // Object exists with same size; re-upload only if FORCE_UPLOAD=1.
      if (dryRun) {
        console.log(`would-skip (exists, size match) ${key} sha256=${localHash}`);
        skipped += 1;
        continue;
      }
      skipped += 1;
      console.log(`skip (exists, size match) ${key}`);
      continue;
    }

    if (remoteSize !== null && !sameSize) {
      mismatched += 1;
      console.warn(
        `checksum/size mismatch ${key}: local=${fileStat.size} remote=${remoteSize}`
      );
    }

    if (dryRun) {
      console.log(
        `would-upload ${key} (${fileStat.size} bytes, sha256=${localHash}, ${contentType})`
      );
      uploaded += 1;
      continue;
    }

    const body = createReadStream(full);
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        Metadata: { sha256: localHash },
      })
    );
    uploaded += 1;
    console.log(`uploaded ${key} sha256=${localHash}`);
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        scanned,
        uploaded,
        skipped,
        mismatched,
        storageRoot: STORAGE_ROOT,
        bucket,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
