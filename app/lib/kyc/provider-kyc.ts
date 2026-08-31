import prisma from "@/lib/prisma";
import {
  isKycApproved,
  validateKycCompleteness,
  type KycStatusPayload,
} from "@/lib/kyc";

export async function getProviderKycPayload(
  userId: string
): Promise<KycStatusPayload> {
  const [user, documents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true, kycSubmittedAt: true },
    }),
    prisma.providerKycDocument.findMany({
      where: { userId },
      orderBy: [{ type: "asc" }, { cinSlot: "asc" }],
    }),
  ]);

  const docs = documents.map((d) => ({
    id: d.id,
    type: d.type as KycStatusPayload["documents"][0]["type"],
    cinSlot: d.cinSlot,
    originalName: d.originalName,
    mimeType: d.mimeType,
    sizeBytes: d.sizeBytes,
    createdAt: d.createdAt.toISOString(),
  }));

  const completeness = validateKycCompleteness(docs);

  return {
    status: (user?.kycStatus ?? "NOT_STARTED") as KycStatusPayload["status"],
    submittedAt: user?.kycSubmittedAt?.toISOString() ?? null,
    documents: docs,
    requirements: {
      cinMin: 1,
      cinMax: 2,
    },
    isComplete: completeness.ok,
  };
}

export async function assertProviderKycApproved(
  userId: string,
  role: string
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if (role === "ADMIN") return { ok: true };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true, role: true },
  });

  if (!user || user.role !== "PROVIDER") {
    return { ok: false, error: "Réservé aux prestataires", status: 403 };
  }

  if (!isKycApproved(user.kycStatus)) {
    return {
      ok: false,
      error:
        "Vérification d'identité requise. Complétez votre KYC dans Mon profil (CIN).",
      status: 403,
    };
  }

  return { ok: true };
}

export async function resetProviderKycIfIncomplete(userId: string) {
  const documents = await prisma.providerKycDocument.findMany({
    where: { userId },
    select: { type: true },
  });
  const check = validateKycCompleteness(documents);
  if (!check.ok) {
    await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: "NOT_STARTED", kycSubmittedAt: null },
    });
  }
}
