import { mkdir, readFile, unlink, writeFile, access } from "fs/promises";
import path from "path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { BlobNotFoundError, del, get, head, put } from "@vercel/blob";
import { toIsolatedBuffer } from "@/lib/isolated-buffer";

export interface StorageBackend {
  put(key: string, buffer: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

function assertSafeStorageKey(key: string): void {
  if (!key || key.includes("\0")) {
    throw new Error("Clé de stockage invalide");
  }
  const normalized = key.replace(/\\/g, "/");
  if (
    normalized.startsWith("/") ||
    normalized.includes("..") ||
    path.isAbsolute(normalized)
  ) {
    throw new Error("Clé de stockage invalide");
  }
}

export class LocalFilesystemBackend implements StorageBackend {
  constructor(private readonly rootDir: string) {}

  private resolveKey(key: string): string {
    assertSafeStorageKey(key);
    const resolvedRoot = path.resolve(this.rootDir);
    const resolved = path.resolve(resolvedRoot, key);
    const relative = path.relative(resolvedRoot, resolved);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error("Clé de stockage invalide");
    }
    return resolved;
  }

  async put(key: string, buffer: Buffer, _contentType: string): Promise<void> {
    const filePath = this.resolveKey(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.resolveKey(key));
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(this.resolveKey(key));
    } catch {
      // already absent
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(this.resolveKey(key));
      return true;
    } catch {
      return false;
    }
  }
}

export class S3Backend implements StorageBackend {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(opts: {
    bucket: string;
    region: string;
    endpoint?: string;
    accessKeyId: string;
    secretAccessKey: string;
  }) {
    this.bucket = opts.bucket;
    this.client = new S3Client({
      region: opts.region,
      endpoint: opts.endpoint,
      forcePathStyle: Boolean(opts.endpoint),
      credentials: {
        accessKeyId: opts.accessKeyId,
        secretAccessKey: opts.secretAccessKey,
      },
    });
  }

  private normalizeKey(key: string): string {
    assertSafeStorageKey(key);
    return key.replace(/\\/g, "/");
  }

  async put(key: string, buffer: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.normalizeKey(key),
        Body: buffer,
        ContentType: contentType,
      })
    );
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const result = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: this.normalizeKey(key),
        })
      );
      if (!result.Body) return null;
      const bytes = await result.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch (error: unknown) {
      const name =
        error && typeof error === "object" && "name" in error
          ? String((error as { name: string }).name)
          : "";
      const status =
        error && typeof error === "object" && "$metadata" in error
          ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata
              ?.httpStatusCode
          : undefined;
      if (name === "NoSuchKey" || status === 404) return null;
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: this.normalizeKey(key),
      })
    );
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: this.normalizeKey(key),
        })
      );
      return true;
    } catch (error: unknown) {
      const status =
        error && typeof error === "object" && "$metadata" in error
          ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata
              ?.httpStatusCode
          : undefined;
      if (status === 404) return false;
      throw error;
    }
  }
}

/** Private Vercel Blob — durable uploads on serverless (KYC, avatars, etc.). */
export class VercelBlobBackend implements StorageBackend {
  private tokenOptions(): { token?: string } {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    return token ? { token } : {};
  }

  private normalizeKey(key: string): string {
    assertSafeStorageKey(key);
    return key.replace(/\\/g, "/");
  }

  async put(key: string, buffer: Buffer, contentType: string): Promise<void> {
    // Copie isolée : undici refuse les Buffer Sharp (SharedArrayBuffer).
    await put(this.normalizeKey(key), toIsolatedBuffer(buffer), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
      ...this.tokenOptions(),
    });
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const result = await get(this.normalizeKey(key), {
        access: "private",
        ...this.tokenOptions(),
      });
      if (!result?.stream) return null;
      return Buffer.from(await new Response(result.stream).arrayBuffer());
    } catch (error: unknown) {
      if (isBlobNotFoundError(error)) return null;
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await del(this.normalizeKey(key), this.tokenOptions());
    } catch (error: unknown) {
      if (isBlobNotFoundError(error)) return;
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await head(this.normalizeKey(key), this.tokenOptions());
      return true;
    } catch (error: unknown) {
      if (isBlobNotFoundError(error)) return false;
      throw error;
    }
  }
}

function isBlobNotFoundError(error: unknown): boolean {
  return error instanceof BlobNotFoundError;
}

let cachedBackend: StorageBackend | null = null;

export function getStorageRoot(): string {
  return path.join(process.cwd(), "storage");
}

function hasVercelBlobCredentials(
  env: Readonly<Record<string, string | undefined>> = process.env
): boolean {
  return Boolean(env.BLOB_READ_WRITE_TOKEN || env.BLOB_STORE_ID);
}

/** Resolve storage mode: explicit STORAGE_BACKEND, else blob on Vercel when configured. */
export function resolveStorageBackendMode(
  env: Readonly<Record<string, string | undefined>> = process.env
): "local" | "s3" | "blob" {
  const explicit = env.STORAGE_BACKEND?.trim().toLowerCase();
  if (explicit === "local" || explicit === "s3" || explicit === "blob") {
    return explicit;
  }
  if (explicit) {
    throw new Error(
      `STORAGE_BACKEND invalide: ${explicit} (attendu local|s3|blob)`
    );
  }
  if (env.VERCEL === "1" && hasVercelBlobCredentials(env)) {
    return "blob";
  }
  return "local";
}

export function getStorageBackend(): StorageBackend {
  if (cachedBackend) return cachedBackend;

  const mode = resolveStorageBackendMode();

  if (mode === "s3") {
    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "STORAGE_BACKEND=s3 nécessite S3_BUCKET, S3_REGION, AWS_ACCESS_KEY_ID et AWS_SECRET_ACCESS_KEY"
      );
    }
    cachedBackend = new S3Backend({
      bucket,
      region,
      endpoint: process.env.S3_ENDPOINT || undefined,
      accessKeyId,
      secretAccessKey,
    });
    return cachedBackend;
  }

  if (mode === "blob") {
    if (!hasVercelBlobCredentials() && process.env.VERCEL !== "1") {
      throw new Error(
        "STORAGE_BACKEND=blob nécessite BLOB_READ_WRITE_TOKEN (ou OIDC + BLOB_STORE_ID sur Vercel)"
      );
    }
    cachedBackend = new VercelBlobBackend();
    return cachedBackend;
  }

  if (process.env.VERCEL === "1") {
    throw new Error(
      "STORAGE_BACKEND=local est incompatible avec Vercel (filesystem éphémère). Configurez STORAGE_BACKEND=blob (Vercel Blob privé) ou s3."
    );
  }

  cachedBackend = new LocalFilesystemBackend(getStorageRoot());
  return cachedBackend;
}

/** Test helper — reset singleton between tests. */
export function resetStorageBackendForTests(): void {
  cachedBackend = null;
}

const IMAGE_EXTENSIONS = [".webp", ".jpg", ".jpeg", ".png"] as const;

/** Resolve an object key that starts with a basename (e.g. avatar.webp). */
export async function findKeyWithBasename(
  backend: StorageBackend,
  dirPrefix: string,
  basename: string
): Promise<string | null> {
  const prefix = dirPrefix.replace(/\/+$/, "");
  for (const ext of IMAGE_EXTENSIONS) {
    const key = `${prefix}/${basename}${ext}`;
    if (await backend.exists(key)) return key;
  }
  return null;
}

export async function deleteKeysWithBasename(
  backend: StorageBackend,
  dirPrefix: string,
  basename: string
): Promise<void> {
  const prefix = dirPrefix.replace(/\/+$/, "");
  for (const ext of IMAGE_EXTENSIONS) {
    await backend.delete(`${prefix}/${basename}${ext}`);
  }
}
