import { mkdir, writeFile, unlink, readFile, readdir } from "fs/promises";
import path from "path";
import {
  AVATAR_ALLOWED_EXTENSIONS,
  AVATAR_ALLOWED_MIME_TYPES,
  AVATAR_MAX_FILE_BYTES,
  type AvatarAllowedMime,
} from "@/lib/avatar";
import { assertSafeStorageId, resolveStoragePath } from "@/lib/storage-path";
import { detectImageMime } from "@/lib/image-upload-validation";
import { optimizeUploadImage } from "@/lib/image-optimize";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "avatars");
const AVATAR_BASENAME = "avatar";

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

  const mime = detectImageMime(buffer, file.name);
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
  assertSafeStorageId(userId);
  return resolveStoragePath(STORAGE_ROOT, userId);
}

export async function saveAvatarFile(
  userId: string,
  buffer: Buffer,
  _mime: AvatarAllowedMime
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

  // Toujours WebP compressé (512×512 max) — le mime d'entrée n'est plus conservé.
  const optimized = await optimizeUploadImage(buffer, "avatar");
  const fileName = `${AVATAR_BASENAME}${optimized.extension}`;
  await writeFile(path.join(dir, fileName), optimized.buffer);
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
