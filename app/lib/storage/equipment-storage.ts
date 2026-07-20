import path from "path";
import type { AvatarAllowedMime } from "@/lib/avatar";
import { assertSafeStorageId } from "@/lib/storage-path";
import { optimizeUploadImageDispatched } from "@/lib/image-optimize-dispatch";
import {
  mimeFromStoredExtension,
  validateImageUpload,
} from "@/lib/image-storage";
import {
  deleteKeysWithBasename,
  findKeyWithBasename,
  getStorageBackend,
} from "@/lib/storage/backend";

export const EQUIPMENT_PHOTO_MAX_BYTES = 3 * 1024 * 1024;
export const EQUIPMENT_MAX_PHOTOS = 6;

function equipmentPhotoPrefix(equipmentId: string): string {
  assertSafeStorageId(equipmentId);
  return `equipment/${equipmentId}`;
}

export function validateEquipmentPhotoFile(
  file: File,
  buffer: Buffer
): { ok: true; mime: AvatarAllowedMime } | { ok: false; error: string } {
  return validateImageUpload(file, buffer, {
    maxBytes: EQUIPMENT_PHOTO_MAX_BYTES,
    label: "Photo",
  });
}

/** Save a photo under equipment/{id}/photo-{index}.webp and return the storage key. */
export async function saveEquipmentPhoto(
  equipmentId: string,
  index: number,
  buffer: Buffer
): Promise<string> {
  const backend = getStorageBackend();
  const prefix = equipmentPhotoPrefix(equipmentId);
  const basename = `photo-${index}`;
  await deleteKeysWithBasename(backend, prefix, basename);
  const optimized = await optimizeUploadImageDispatched(buffer, "cover");
  const key = `${prefix}/${basename}${optimized.extension}`;
  await backend.put(key, optimized.buffer, optimized.mime);
  return key;
}

export async function deleteEquipmentPhotoKey(key: string): Promise<void> {
  if (!key.startsWith("equipment/")) return;
  await getStorageBackend().delete(key);
}

export async function deleteAllEquipmentPhotos(
  equipmentId: string
): Promise<void> {
  const backend = getStorageBackend();
  const prefix = equipmentPhotoPrefix(equipmentId);
  for (let i = 0; i < EQUIPMENT_MAX_PHOTOS; i++) {
    await deleteKeysWithBasename(backend, prefix, `photo-${i}`);
  }
}

export async function readEquipmentPhotoByKey(
  key: string
): Promise<{ buffer: Buffer; mime: AvatarAllowedMime } | null> {
  if (!key.startsWith("equipment/")) return null;
  const backend = getStorageBackend();
  const buffer = await backend.get(key);
  if (!buffer) return null;
  const mime = mimeFromStoredExtension(path.extname(key));
  if (!mime) return null;
  return { buffer, mime };
}

export async function findEquipmentCover(
  equipmentId: string
): Promise<string | null> {
  const backend = getStorageBackend();
  const prefix = equipmentPhotoPrefix(equipmentId);
  return findKeyWithBasename(backend, prefix, "photo-0");
}
