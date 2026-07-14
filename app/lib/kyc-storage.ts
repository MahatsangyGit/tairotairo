import path from "path";
import crypto from "crypto";
import {
  KYC_ALLOWED_EXTENSIONS,
  KYC_ALLOWED_MIME_TYPES,
  KYC_MAX_FILE_BYTES,
  type KycAllowedMime,
} from "@/lib/kyc";
import { assertSafeStorageId } from "@/lib/storage-path";
import { getStorageBackend } from "@/lib/storage/backend";

function extensionForMime(mime: KycAllowedMime): string {
  switch (mime) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "application/pdf":
      return ".pdf";
  }
}

function detectMime(buffer: Buffer, fileName: string): KycAllowedMime | null {
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50) {
    return "image/png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "image/jpeg";
  }
  if (buffer.slice(0, 5).toString("utf8") === "%PDF-") {
    return "application/pdf";
  }

  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".pdf") return "application/pdf";
  return null;
}

export function validateKycUploadFile(
  file: File,
  buffer: Buffer
): { ok: true; mime: KycAllowedMime } | { ok: false; error: string } {
  if (!file || file.size === 0) {
    return { ok: false, error: "Fichier vide" };
  }

  if (file.size > KYC_MAX_FILE_BYTES) {
    return {
      ok: false,
      error: `Fichier trop volumineux (max ${KYC_MAX_FILE_BYTES / (1024 * 1024)} Mo)`,
    };
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!KYC_ALLOWED_EXTENSIONS.includes(ext as (typeof KYC_ALLOWED_EXTENSIONS)[number])) {
    return {
      ok: false,
      error: "Format non autorisé. Utilisez JPEG, PNG ou PDF",
    };
  }

  const mime = detectMime(buffer, file.name);
  if (!mime || !KYC_ALLOWED_MIME_TYPES.includes(mime)) {
    return {
      ok: false,
      error: "Le contenu du fichier ne correspond pas à un JPEG, PNG ou PDF valide",
    };
  }

  if (file.type && file.type !== mime && file.type !== "application/octet-stream") {
    return {
      ok: false,
      error: "Type de fichier incohérent",
    };
  }

  return { ok: true, mime };
}

/** Object-key prefix for KYC files (`kyc/{userId}`). */
export function userKycKeyPrefix(userId: string): string {
  assertSafeStorageId(userId);
  return `kyc/${userId}`;
}

/** @deprecated Prefer userKycKeyPrefix. */
export function userKycDir(userId: string): string {
  return userKycKeyPrefix(userId);
}

function kycObjectKey(userId: string, storedName: string): string {
  const safeName = path.basename(storedName);
  if (!safeName || safeName !== storedName.replace(/\\/g, "/").split("/").pop()) {
    throw new Error("Nom de fichier KYC invalide");
  }
  if (safeName.includes("..")) {
    throw new Error("Nom de fichier KYC invalide");
  }
  return `${userKycKeyPrefix(userId)}/${safeName}`;
}

export async function saveKycFile(
  userId: string,
  buffer: Buffer,
  mime: KycAllowedMime
): Promise<string> {
  const storedName = `${crypto.randomUUID()}${extensionForMime(mime)}`;
  const key = kycObjectKey(userId, storedName);
  await getStorageBackend().put(key, buffer, mime);
  return storedName;
}

export async function deleteKycFile(
  userId: string,
  storedName: string
): Promise<void> {
  try {
    await getStorageBackend().delete(kycObjectKey(userId, storedName));
  } catch {
    // fichier déjà absent / clé invalide
  }
}

export async function readKycFile(
  userId: string,
  storedName: string
): Promise<Buffer> {
  const buffer = await getStorageBackend().get(
    kycObjectKey(userId, storedName)
  );
  if (!buffer) {
    throw new Error("Fichier KYC introuvable");
  }
  return buffer;
}

export function resolveCinSlot(
  existingCinSlots: number[],
  requestedSlot?: number | null
): number | null {
  if (requestedSlot === 1 || requestedSlot === 2) {
    return requestedSlot;
  }
  if (!existingCinSlots.includes(1)) return 1;
  if (!existingCinSlots.includes(2)) return 2;
  return null;
}
