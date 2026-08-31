export const KYC_MAX_FILE_BYTES = 2 * 1024 * 1024;

export const KYC_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

export type KycAllowedMime = (typeof KYC_ALLOWED_MIME_TYPES)[number];

export const KYC_ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"] as const;

export const KYC_CIN_SLOTS = [1, 2] as const;

export type KycDocumentType = "CIN";

export interface KycDocumentMeta {
  id: string;
  type: KycDocumentType;
  cinSlot: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export type KycStatusValue = "NOT_STARTED" | "PENDING" | "APPROVED";

export interface KycStatusPayload {
  status: KycStatusValue;
  submittedAt: string | null;
  documents: KycDocumentMeta[];
  requirements: {
    cinMin: number;
    cinMax: number;
  };
  isComplete: boolean;
}

export function isKycApproved(
  status: string | null | undefined
): boolean {
  return status === "APPROVED";
}

export function kycStatusLabel(status: string): string {
  switch (status) {
    case "APPROVED":
      return "Approuvé";
    case "PENDING":
      return "En attente";
    default:
      return "Non soumis";
  }
}

export function validateKycCompleteness(
  documents: { type: string }[]
): { ok: boolean; error?: string } {
  const cinCount = documents.filter((d) => d.type === "CIN").length;

  if (cinCount < 1) {
    return {
      ok: false,
      error: "Ajoutez au moins un fichier pour la carte d'identité (CIN)",
    };
  }
  if (cinCount > 2) {
    return { ok: false, error: "Maximum 2 fichiers pour la CIN" };
  }
  return { ok: true };
}

export function documentTypeLabel(
  _type: KycDocumentType,
  cinSlot: number
): string {
  return cinSlot === 2 ? "CIN (verso / 2e fichier)" : "CIN (recto)";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
