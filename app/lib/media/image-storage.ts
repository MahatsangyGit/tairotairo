import path from "path";
import {
  AVATAR_ALLOWED_EXTENSIONS,
  AVATAR_ALLOWED_MIME_TYPES,
} from "@/lib/media/avatar";
import {
  optimizeUploadImageDispatched,
} from "@/lib/media/image-optimize-dispatch";
import type { ImageOptimizePreset } from "@/lib/media/image-optimize";
import {
  detectImageMime,
  type ImageAllowedMime,
} from "@/lib/media/image-upload-validation";
import {
  deleteKeysWithBasename,
  findKeyWithBasename,
  getStorageBackend,
} from "@/lib/storage/backend";

export function validateImageUpload(
  file: File,
  buffer: Buffer,
  opts: { maxBytes: number; label?: string }
): { ok: true; mime: ImageAllowedMime } | { ok: false; error: string } {
  if (!file || file.size === 0) {
    return {
      ok: false,
      error: opts.label ? `${opts.label} requise` : "Fichier vide",
    };
  }

  if (file.size > opts.maxBytes) {
    return {
      ok: false,
      error: `Image trop volumineuse (max ${opts.maxBytes / (1024 * 1024)} Mo)`,
    };
  }

  const ext = path.extname(file.name).toLowerCase();
  if (
    !AVATAR_ALLOWED_EXTENSIONS.includes(
      ext as (typeof AVATAR_ALLOWED_EXTENSIONS)[number]
    )
  ) {
    return {
      ok: false,
      error: "Format non autorisé. Utilisez JPEG, PNG ou WebP",
    };
  }

  const mime = detectImageMime(buffer, file.name);
  if (!mime || !AVATAR_ALLOWED_MIME_TYPES.includes(mime)) {
    return {
      ok: false,
      error: opts.label
        ? "Le fichier doit être une image JPEG, PNG ou WebP valide"
        : "Le contenu du fichier doit être une image JPEG, PNG ou WebP valide",
    };
  }

  if (file.type && file.type !== mime && file.type !== "application/octet-stream") {
    return { ok: false, error: "Type de fichier incohérent" };
  }

  return { ok: true, mime };
}

export function mimeFromStoredExtension(ext: string): ImageAllowedMime | null {
  const lower = ext.toLowerCase();
  if (lower === ".jpg" || lower === ".jpeg") return "image/jpeg";
  if (lower === ".png") return "image/png";
  if (lower === ".webp") return "image/webp";
  return null;
}

export async function saveOptimizedImageAtBasename(
  prefix: string,
  basename: string,
  buffer: Buffer,
  preset: ImageOptimizePreset
) {
  const backend = getStorageBackend();
  await deleteKeysWithBasename(backend, prefix, basename);
  const optimized = await optimizeUploadImageDispatched(buffer, preset);
  const storedName = `${basename}${optimized.extension}`;
  const key = `${prefix}/${storedName}`;
  await backend.put(key, optimized.buffer, optimized.mime);
  return {
    key,
    storedName,
    mime: optimized.mime,
    sizeBytes: optimized.sizeBytes,
  };
}

export async function readStoredImageAtBasename(
  prefix: string,
  basename: string
): Promise<{ buffer: Buffer; mime: ImageAllowedMime } | null> {
  const backend = getStorageBackend();
  const key = await findKeyWithBasename(backend, prefix, basename);
  if (!key) return null;
  const buffer = await backend.get(key);
  if (!buffer) return null;
  const mime = mimeFromStoredExtension(path.extname(key));
  return mime ? { buffer, mime } : null;
}
