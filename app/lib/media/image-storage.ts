import { unlink, readFile, readdir } from "fs/promises";
import path from "path";
import {
  AVATAR_ALLOWED_EXTENSIONS,
  AVATAR_ALLOWED_MIME_TYPES,
} from "@/lib/avatar";
import {
  detectImageMime,
  type ImageAllowedMime,
} from "@/lib/image-upload-validation";

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
        ? `Le fichier doit être une image JPEG, PNG ou WebP valide`
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

export async function deleteFilesWithBasename(
  dir: string,
  basename: string
): Promise<void> {
  try {
    const existing = await readdir(dir);
    for (const name of existing) {
      if (name.startsWith(basename)) {
        await unlink(path.join(dir, name));
      }
    }
  } catch {
    // rien à supprimer
  }
}

export async function readImageByBasename(
  dir: string,
  basename: string
): Promise<{ buffer: Buffer; mime: ImageAllowedMime } | null> {
  try {
    const files = await readdir(dir);
    const match = files.find((f) => f.startsWith(basename));
    if (!match) return null;

    const mime = mimeFromStoredExtension(path.extname(match));
    if (!mime) return null;

    const buffer = await readFile(path.join(dir, match));
    return { buffer, mime };
  } catch {
    return null;
  }
}
