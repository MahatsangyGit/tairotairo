import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  LISTING_COVER_MAX_FILE_BYTES,
  type ListingCoverKind,
} from "@/lib/listing-cover";
import type { AvatarAllowedMime } from "@/lib/avatar";
import { assertSafeStorageId, resolveStoragePath } from "@/lib/storage-path";
import { optimizeUploadImage } from "@/lib/image-optimize";
import {
  deleteFilesWithBasename,
  readImageByBasename,
  validateImageUpload,
} from "@/lib/image-storage";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "listings");
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

function listingDir(kind: ListingCoverKind, id: string): string {
  assertSafeStorageId(id);
  const folder = kind === "service" ? "services" : "requests";
  return resolveStoragePath(STORAGE_ROOT, folder, id);
}

export async function saveListingCoverFile(
  kind: ListingCoverKind,
  id: string,
  buffer: Buffer,
  _mime: AvatarAllowedMime
): Promise<void> {
  const dir = listingDir(kind, id);
  await mkdir(dir, { recursive: true });
  await deleteFilesWithBasename(dir, COVER_BASENAME);

  const optimized = await optimizeUploadImage(buffer, "cover");
  const fileName = `${COVER_BASENAME}${optimized.extension}`;
  await writeFile(path.join(dir, fileName), optimized.buffer);
}

export async function deleteListingCoverFiles(
  kind: ListingCoverKind,
  id: string
): Promise<void> {
  await deleteFilesWithBasename(listingDir(kind, id), COVER_BASENAME);
}

export async function readListingCoverFile(
  kind: ListingCoverKind,
  id: string
): Promise<{ buffer: Buffer; mime: AvatarAllowedMime } | null> {
  return readImageByBasename(listingDir(kind, id), COVER_BASENAME);
}
