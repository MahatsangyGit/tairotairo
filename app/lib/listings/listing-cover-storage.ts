import {
  LISTING_COVER_MAX_FILE_BYTES,
  type ListingCoverKind,
} from "@/lib/listings/listing-cover";
import type { AvatarAllowedMime } from "@/lib/media/avatar";
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
  buffer: Buffer
): Promise<void> {
  await saveOptimizedImageAtBasename(
    listingKeyPrefix(kind, id),
    COVER_BASENAME,
    buffer,
    "cover"
  );
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
  return readStoredImageAtBasename(listingKeyPrefix(kind, id), COVER_BASENAME);
}
