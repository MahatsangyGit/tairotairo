import {
  AVATAR_MAX_FILE_BYTES,
  type AvatarAllowedMime,
} from "@/lib/avatar";
import { assertSafeStorageId } from "@/lib/storage-path";
import { optimizeUploadImage } from "@/lib/image-optimize";
import {
  mimeFromStoredExtension,
  validateImageUpload,
} from "@/lib/image-storage";
import {
  deleteKeysWithBasename,
  findKeyWithBasename,
  getStorageBackend,
} from "@/lib/storage/backend";
import path from "path";

const AVATAR_BASENAME = "avatar";

export function validateAvatarUploadFile(
  file: File,
  buffer: Buffer
): { ok: true; mime: AvatarAllowedMime } | { ok: false; error: string } {
  return validateImageUpload(file, buffer, { maxBytes: AVATAR_MAX_FILE_BYTES });
}

/** Object-key prefix for a user avatar (`avatars/{userId}`). */
export function userAvatarKeyPrefix(userId: string): string {
  assertSafeStorageId(userId);
  return `avatars/${userId}`;
}

/** @deprecated Prefer userAvatarKeyPrefix — kept for callers expecting a path-like id. */
export function userAvatarDir(userId: string): string {
  return userAvatarKeyPrefix(userId);
}

export async function saveAvatarFile(
  userId: string,
  buffer: Buffer,
  _mime?: AvatarAllowedMime
): Promise<void> {
  const backend = getStorageBackend();
  const prefix = userAvatarKeyPrefix(userId);
  await deleteKeysWithBasename(backend, prefix, AVATAR_BASENAME);

  const optimized = await optimizeUploadImage(buffer, "avatar");
  const key = `${prefix}/${AVATAR_BASENAME}${optimized.extension}`;
  await backend.put(key, optimized.buffer, optimized.mime);
}

export async function deleteAvatarFiles(userId: string): Promise<void> {
  await deleteKeysWithBasename(
    getStorageBackend(),
    userAvatarKeyPrefix(userId),
    AVATAR_BASENAME
  );
}

export async function readAvatarFile(
  userId: string
): Promise<{ buffer: Buffer; mime: AvatarAllowedMime } | null> {
  const backend = getStorageBackend();
  const key = await findKeyWithBasename(
    backend,
    userAvatarKeyPrefix(userId),
    AVATAR_BASENAME
  );
  if (!key) return null;

  const buffer = await backend.get(key);
  if (!buffer) return null;

  const mime = mimeFromStoredExtension(path.extname(key));
  if (!mime) return null;
  return { buffer, mime };
}
