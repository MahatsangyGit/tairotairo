import path from "path";
import {
  LISTING_COVER_MAX_FILE_BYTES,
  type ListingCoverKind,
} from "@/lib/listing-cover";
import type { AvatarAllowedMime } from "@/lib/avatar";
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

const COVER_BASENAME = "cover";

export function validateListingCoverFile(
  file: File,
  buffer: Buffer
): { ok: true; mime: AvatarAllowedMime } | { ok: false; error: string } {
  return validateImageUpload(file, buffer, {
    maxBytes: LISTING_COVER_MAX_FILE_BYTES,
    label: "Image",
  });
}

function listingKeyPrefix(kind: ListingCoverKind, id: string): string {
  assertSafeStorageId(id);
  const folder = kind === "service" ? "services" : "requests";
  return `listings/${folder}/${id}`;
}

export async function saveListingCoverFile(
  kind: ListingCoverKind,
  id: string,
  buffer: Buffer,
  _mime: AvatarAllowedMime
): Promise<void> {
  const backend = getStorageBackend();
  const prefix = listingKeyPrefix(kind, id);
  await deleteKeysWithBasename(backend, prefix, COVER_BASENAME);

  const optimized = await optimizeUploadImage(buffer, "cover");
  const key = `${prefix}/${COVER_BASENAME}${optimized.extension}`;
  await backend.put(key, optimized.buffer, optimized.mime);
}

export async function deleteListingCoverFiles(
  kind: ListingCoverKind,
  id: string
): Promise<void> {
  await deleteKeysWithBasename(
    getStorageBackend(),
    listingKeyPrefix(kind, id),
    COVER_BASENAME
  );
}

export async function readListingCoverFile(
  kind: ListingCoverKind,
  id: string
): Promise<{ buffer: Buffer; mime: AvatarAllowedMime } | null> {
  const backend = getStorageBackend();
  const key = await findKeyWithBasename(
    backend,
    listingKeyPrefix(kind, id),
    COVER_BASENAME
  );
  if (!key) return null;

  const buffer = await backend.get(key);
  if (!buffer) return null;

  const mime = mimeFromStoredExtension(path.extname(key));
  if (!mime) return null;
  return { buffer, mime };
}
