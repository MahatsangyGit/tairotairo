import { mkdir, writeFile, unlink, readFile, readdir } from "fs/promises";
import path from "path";
import {
  AVATAR_ALLOWED_EXTENSIONS,
  AVATAR_ALLOWED_MIME_TYPES,
  type AvatarAllowedMime,
} from "@/lib/avatar";
import {
  LISTING_COVER_MAX_FILE_BYTES,
  type ListingCoverKind,
} from "@/lib/listing-cover";
import { assertSafeStorageId, resolveStoragePath } from "@/lib/storage-path";
import {
  detectImageMime,
  extensionForImageMime,
} from "@/lib/image-upload-validation";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "listings");
const COVER_BASENAME = "cover";

export function validateListingCoverFile(
  file: File,
  buffer: Buffer
): { ok: true; mime: AvatarAllowedMime } | { ok: false; error: string } {
  if (!file || file.size === 0) {
    return { ok: false, error: "Image requise" };
  }

  if (file.size > LISTING_COVER_MAX_FILE_BYTES) {
    return {
      ok: false,
      error: `Image trop volumineuse (max ${LISTING_COVER_MAX_FILE_BYTES / (1024 * 1024)} Mo)`,
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
      error: "Le fichier doit être une image JPEG, PNG ou WebP valide",
    };
  }

  if (file.type && file.type !== mime && file.type !== "application/octet-stream") {
    return { ok: false, error: "Type de fichier incohérent" };
  }

  return { ok: true, mime };
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
  mime: AvatarAllowedMime
): Promise<void> {
  const dir = listingDir(kind, id);
  await mkdir(dir, { recursive: true });

  try {
    const existing = await readdir(dir);
    for (const name of existing) {
      if (name.startsWith(COVER_BASENAME)) {
        await unlink(path.join(dir, name));
      }
    }
  } catch {
    // dossier vide
  }

  const fileName = `${COVER_BASENAME}${extensionForImageMime(mime)}`;
  await writeFile(path.join(dir, fileName), buffer);
}

export async function deleteListingCoverFiles(
  kind: ListingCoverKind,
  id: string
): Promise<void> {
  try {
    const dir = listingDir(kind, id);
    const existing = await readdir(dir);
    for (const name of existing) {
      if (name.startsWith(COVER_BASENAME)) {
        await unlink(path.join(dir, name));
      }
    }
  } catch {
    // rien à supprimer
  }
}

export async function readListingCoverFile(
  kind: ListingCoverKind,
  id: string
): Promise<{ buffer: Buffer; mime: AvatarAllowedMime } | null> {
  try {
    const dir = listingDir(kind, id);
    const files = await readdir(dir);
    const match = files.find((f) => f.startsWith(COVER_BASENAME));
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
