import path from "path";
import type { AvatarAllowedMime } from "@/lib/media/avatar";
import { assertSafeStorageId } from "@/lib/storage-path";
import {
  mimeFromStoredExtension,
  saveOptimizedImageAtBasename,
  validateImageUpload,
} from "@/lib/media/image-storage";
import {
  deleteKeysWithBasename,
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
  const { key } = await saveOptimizedImageAtBasename(
    equipmentPhotoPrefix(equipmentId),
    `photo-${index}`,
    buffer,
    "cover"
  );
  return key;
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
  const buffer = await getStorageBackend().get(key);
  if (!buffer) return null;
  const mime = mimeFromStoredExtension(path.extname(key));
  return mime ? { buffer, mime } : null;
}
