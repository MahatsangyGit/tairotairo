import {
  AVATAR_MAX_FILE_BYTES,
  type AvatarAllowedMime,
} from "@/lib/media/avatar";
import { assertSafeStorageId } from "@/lib/storage-path";
import {
  readStoredImageAtBasename,
  saveOptimizedImageAtBasename,
  validateImageUpload,
} from "@/lib/media/image-storage";
import {
  deleteKeysWithBasename,
  getStorageBackend,
} from "@/lib/storage/backend";

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

export async function saveAvatarFile(
  userId: string,
  buffer: Buffer
): Promise<void> {
  await saveOptimizedImageAtBasename(
    userAvatarKeyPrefix(userId),
    AVATAR_BASENAME,
    buffer,
    "avatar"
  );
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
  return readStoredImageAtBasename(userAvatarKeyPrefix(userId), AVATAR_BASENAME);
}
