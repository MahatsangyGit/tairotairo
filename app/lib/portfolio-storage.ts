import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";
import {
  AVATAR_ALLOWED_EXTENSIONS,
  AVATAR_ALLOWED_MIME_TYPES,
  type AvatarAllowedMime,
} from "@/lib/avatar";
import { PORTFOLIO_MAX_FILE_BYTES } from "@/lib/portfolio";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "portfolio");
const IMAGE_BASENAME = "image";

function extensionForMime(mime: AvatarAllowedMime): string {
  switch (mime) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
  }
}

function detectMime(buffer: Buffer, fileName: string): AvatarAllowedMime | null {
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50) {
    return "image/png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 12 &&
    buffer.slice(0, 4).toString("utf8") === "RIFF" &&
    buffer.slice(8, 12).toString("utf8") === "WEBP"
  ) {
    return "image/webp";
  }

  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return null;
}

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

  const mime = detectMime(buffer, file.name);
  if (!mime || !AVATAR_ALLOWED_MIME_TYPES.includes(mime)) {
    return {
      ok: false,
      error: "Le fichier doit être une image JPEG, PNG ou WebP valide",
    };
  }

  return { ok: true, mime };
}

export function portfolioItemDir(itemId: string): string {
  return path.join(STORAGE_ROOT, itemId);
}

export async function savePortfolioImage(
  itemId: string,
  buffer: Buffer,
  mime: AvatarAllowedMime
): Promise<string> {
  const dir = portfolioItemDir(itemId);
  await mkdir(dir, { recursive: true });

  const storedName = `${IMAGE_BASENAME}${extensionForMime(mime)}`;
  const filePath = path.join(dir, storedName);

  try {
    await unlink(filePath);
  } catch {
    // pas encore de fichier
  }

  await writeFile(filePath, buffer);
  return storedName;
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
