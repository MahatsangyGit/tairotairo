import { mkdir, writeFile, unlink, readFile, readdir } from "fs/promises";
import path from "path";
import {
  AVATAR_ALLOWED_EXTENSIONS,
  AVATAR_ALLOWED_MIME_TYPES,
  AVATAR_MAX_FILE_BYTES,
  type AvatarAllowedMime,
} from "@/lib/avatar";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "avatars");
const AVATAR_BASENAME = "avatar";

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

export function validateAvatarUploadFile(
  file: File,
  buffer: Buffer
): { ok: true; mime: AvatarAllowedMime } | { ok: false; error: string } {
  if (!file || file.size === 0) {
    return { ok: false, error: "Fichier vide" };
  }

  if (file.size > AVATAR_MAX_FILE_BYTES) {
    return {
      ok: false,
      error: `Image trop volumineuse (max ${AVATAR_MAX_FILE_BYTES / (1024 * 1024)} Mo)`,
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
      error: "Le contenu du fichier doit être une image JPEG, PNG ou WebP valide",
    };
  }

  if (file.type && file.type !== mime && file.type !== "application/octet-stream") {
    return { ok: false, error: "Type de fichier incohérent" };
  }

  return { ok: true, mime };
}

export function userAvatarDir(userId: string): string {
  return path.join(STORAGE_ROOT, userId);
}

export async function saveAvatarFile(
  userId: string,
  buffer: Buffer,
  mime: AvatarAllowedMime
): Promise<void> {
  const dir = userAvatarDir(userId);
  await mkdir(dir, { recursive: true });

  try {
    const existing = await readdir(dir);
    for (const name of existing) {
      if (name.startsWith(AVATAR_BASENAME)) {
        await unlink(path.join(dir, name));
      }
    }
  } catch {
    // dossier vide
  }

  const fileName = `${AVATAR_BASENAME}${extensionForMime(mime)}`;
  await writeFile(path.join(dir, fileName), buffer);
}

export async function deleteAvatarFiles(userId: string): Promise<void> {
  try {
    const dir = userAvatarDir(userId);
    const existing = await readdir(dir);
    for (const name of existing) {
      if (name.startsWith(AVATAR_BASENAME)) {
        await unlink(path.join(dir, name));
      }
    }
  } catch {
    // rien à supprimer
  }
}

export async function readAvatarFile(
  userId: string
): Promise<{ buffer: Buffer; mime: AvatarAllowedMime } | null> {
  try {
    const dir = userAvatarDir(userId);
    const files = await readdir(dir);
    const match = files.find((f) => f.startsWith(AVATAR_BASENAME));
    if (!match) return null;

    const ext = path.extname(match).toLowerCase();
    let mime: AvatarAllowedMime | null = null;
    if (ext === ".jpg" || ext === ".jpeg") mime = "image/jpeg";
    else if (ext === ".png") mime = "image/png";
    else if (ext === ".webp") mime = "image/webp";
    if (!mime) return null;

    const buffer = await readFile(path.join(dir, match));
    return { buffer, mime };
  } catch {
    return null;
  }
}
