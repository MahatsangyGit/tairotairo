import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import { PORTFOLIO_MAX_FILE_BYTES } from "@/lib/portfolio";
import type { AvatarAllowedMime } from "@/lib/avatar";
import { assertSafeStorageId, resolveStoragePath } from "@/lib/storage-path";
import { optimizeUploadImage } from "@/lib/image-optimize";
import {
  deleteFilesWithBasename,
  mimeFromStoredExtension,
  validateImageUpload,
} from "@/lib/image-storage";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "portfolio");
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

export function portfolioItemDir(itemId: string): string {
  assertSafeStorageId(itemId);
  return resolveStoragePath(STORAGE_ROOT, itemId);
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
  const dir = portfolioItemDir(itemId);
  await mkdir(dir, { recursive: true });
  await deleteFilesWithBasename(dir, IMAGE_BASENAME);

  const optimized = await optimizeUploadImage(buffer, "portfolio");
  const storedName = `${IMAGE_BASENAME}${optimized.extension}`;
  await writeFile(path.join(dir, storedName), optimized.buffer);

  return {
    storedName,
    mime: optimized.mime,
    sizeBytes: optimized.sizeBytes,
  };
}

export async function deletePortfolioItemFiles(itemId: string): Promise<void> {
  await deleteFilesWithBasename(portfolioItemDir(itemId), IMAGE_BASENAME);
}

export async function readPortfolioImage(
  itemId: string,
  storedName: string
): Promise<{ buffer: Buffer; mime: AvatarAllowedMime } | null> {
  try {
    const safeName = path.basename(storedName);
    const buffer = await readFile(path.join(portfolioItemDir(itemId), safeName));
    const mime = mimeFromStoredExtension(path.extname(safeName));
    if (!mime) return null;
    return { buffer, mime };
  } catch {
    return null;
  }
}
