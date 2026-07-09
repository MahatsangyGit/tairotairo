import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";
import {
  AVATAR_ALLOWED_EXTENSIONS,
  AVATAR_ALLOWED_MIME_TYPES,
  type AvatarAllowedMime,
} from "@/lib/avatar";
import { PORTFOLIO_MAX_FILE_BYTES } from "@/lib/portfolio";
import { assertSafeStorageId, resolveStoragePath } from "@/lib/storage-path";
import { detectImageMime } from "@/lib/image-upload-validation";
import { optimizeUploadImage } from "@/lib/image-optimize";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "portfolio");
const IMAGE_BASENAME = "image";

export function validatePortfolioImageFile(
  file: File,
  buffer: Buffer
): { ok: true; mime: AvatarAllowedMime } | { ok: false; error: string } {
  if (!file || file.size === 0) {
    return { ok: false, error: "Image requise" };
  }

  if (file.size > PORTFOLIO_MAX_FILE_BYTES) {
    return {
      ok: false,
      error: `Image trop volumineuse (max ${PORTFOLIO_MAX_FILE_BYTES / (1024 * 1024)} Mo)`,
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
      error: "Le fichier doit être une image JPEG, PNG ou WebP valide",
    };
  }

  return { ok: true, mime };
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

  // Nettoie d'éventuels anciens formats (jpg/png) avant d'écrire le WebP.
  for (const ext of [".jpg", ".jpeg", ".png", ".webp"] as const) {
    try {
      await unlink(path.join(dir, `${IMAGE_BASENAME}${ext}`));
    } catch {
      // absent
    }
  }

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
  try {
    const dir = portfolioItemDir(itemId);
    const storedNames = [`${IMAGE_BASENAME}.jpg`, `${IMAGE_BASENAME}.png`, `${IMAGE_BASENAME}.webp`];
    for (const name of storedNames) {
      try {
        await unlink(path.join(dir, name));
      } catch {
        // ignore
      }
    }
  } catch {
    // dossier absent
  }
}

export async function readPortfolioImage(
  itemId: string,
  storedName: string
): Promise<{ buffer: Buffer; mime: AvatarAllowedMime } | null> {
  try {
    const safeName = path.basename(storedName);
    const buffer = await readFile(path.join(portfolioItemDir(itemId), safeName));
    const ext = path.extname(safeName).toLowerCase();
    let mime: AvatarAllowedMime | null = null;
    if (ext === ".jpg" || ext === ".jpeg") mime = "image/jpeg";
    else if (ext === ".png") mime = "image/png";
    else if (ext === ".webp") mime = "image/webp";
    if (!mime) return null;
    return { buffer, mime };
  } catch {
    return null;
  }
}
