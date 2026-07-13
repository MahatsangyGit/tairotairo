import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  AVATAR_MAX_FILE_BYTES,
  type AvatarAllowedMime,
} from "@/lib/avatar";
import { assertSafeStorageId, resolveStoragePath } from "@/lib/storage-path";
import { optimizeUploadImage } from "@/lib/image-optimize";
import {
  deleteFilesWithBasename,
  readImageByBasename,
  validateImageUpload,
} from "@/lib/image-storage";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "avatars");
const AVATAR_BASENAME = "avatar";

export function validateAvatarUploadFile(
  file: File,
  buffer: Buffer
): { ok: true; mime: AvatarAllowedMime } | { ok: false; error: string } {
  return validateImageUpload(file, buffer, { maxBytes: AVATAR_MAX_FILE_BYTES });
}

export function userAvatarDir(userId: string): string {
  assertSafeStorageId(userId);
  return resolveStoragePath(STORAGE_ROOT, userId);
}

export async function saveAvatarFile(
  userId: string,
  buffer: Buffer,
  _mime?: AvatarAllowedMime
): Promise<void> {
  const dir = userAvatarDir(userId);
  await mkdir(dir, { recursive: true });
  await deleteFilesWithBasename(dir, AVATAR_BASENAME);

  const optimized = await optimizeUploadImage(buffer, "avatar");
  const fileName = `${AVATAR_BASENAME}${optimized.extension}`;
  await writeFile(path.join(dir, fileName), optimized.buffer);
}

export async function deleteAvatarFiles(userId: string): Promise<void> {
  await deleteFilesWithBasename(userAvatarDir(userId), AVATAR_BASENAME);
}

export async function readAvatarFile(
  userId: string
): Promise<{ buffer: Buffer; mime: AvatarAllowedMime } | null> {
  return readImageByBasename(userAvatarDir(userId), AVATAR_BASENAME);
}
