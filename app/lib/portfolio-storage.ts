import path from "path";
import { PORTFOLIO_MAX_FILE_BYTES } from "@/lib/portfolio";
import type { AvatarAllowedMime } from "@/lib/avatar";
import { assertSafeStorageId } from "@/lib/storage-path";
import { optimizeUploadImage } from "@/lib/image-optimize";
import {
  mimeFromStoredExtension,
  validateImageUpload,
} from "@/lib/image-storage";
import {
  deleteKeysWithBasename,
  getStorageBackend,
} from "@/lib/storage/backend";

const IMAGE_BASENAME = "image";

export function validatePortfolioImageFile(
  file: File,
  buffer: Buffer
): { ok: true; mime: AvatarAllowedMime } | { ok: false; error: string } {
  return validateImageUpload(file, buffer, {
    maxBytes: PORTFOLIO_MAX_FILE_BYTES,
    label: "Image",
  });
}

/** Object-key prefix for a portfolio item (`portfolio/{itemId}`). */
export function portfolioItemKeyPrefix(itemId: string): string {
  assertSafeStorageId(itemId);
  return `portfolio/${itemId}`;
}

/** @deprecated Prefer portfolioItemKeyPrefix. */
export function portfolioItemDir(itemId: string): string {
  return portfolioItemKeyPrefix(itemId);
}

export type SavedPortfolioImage = {
  storedName: string;
  mime: AvatarAllowedMime;
  sizeBytes: number;
};

export async function savePortfolioImage(
  itemId: string,
  buffer: Buffer,
  _mime: AvatarAllowedMime
): Promise<SavedPortfolioImage> {
  const backend = getStorageBackend();
  const prefix = portfolioItemKeyPrefix(itemId);
  await deleteKeysWithBasename(backend, prefix, IMAGE_BASENAME);

  const optimized = await optimizeUploadImage(buffer, "portfolio");
  const storedName = `${IMAGE_BASENAME}${optimized.extension}`;
  await backend.put(`${prefix}/${storedName}`, optimized.buffer, optimized.mime);

  return {
    storedName,
    mime: optimized.mime,
    sizeBytes: optimized.sizeBytes,
  };
}

export async function deletePortfolioItemFiles(itemId: string): Promise<void> {
  await deleteKeysWithBasename(
    getStorageBackend(),
    portfolioItemKeyPrefix(itemId),
    IMAGE_BASENAME
  );
}

export async function readPortfolioImage(
  itemId: string,
  storedName: string
): Promise<{ buffer: Buffer; mime: AvatarAllowedMime } | null> {
  try {
    const safeName = path.basename(storedName);
    const key = `${portfolioItemKeyPrefix(itemId)}/${safeName}`;
    const buffer = await getStorageBackend().get(key);
    if (!buffer) return null;
    const mime = mimeFromStoredExtension(path.extname(safeName));
    if (!mime) return null;
    return { buffer, mime };
  } catch {
    return null;
  }
}
