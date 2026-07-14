import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow, requireRole } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";
import { assertEmailVerified } from "@/lib/email-verification";
import {
  deleteKycFile,
  resolveCinSlot,
  saveKycFile,
  validateKycUploadFile,
} from "@/lib/kyc-storage";
import { getProviderKycPayload } from "@/lib/provider-kyc";
import type { KycDocumentType } from "@/lib/kyc";
import { API_RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { rejectInvalidUploadContentLength } from "@/lib/http-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApiHandler("POST /api/provider/kyc/upload", async (req) => {
  const auth = await requireAuthOrThrow(req);
  requireRole(auth, "PROVIDER", "Réservé aux prestataires");

  const rateLimited = await enforceRateLimit(
    req,
    "upload",
    API_RATE_LIMITS.upload,
    { userId: auth.userId }
  );
  if (rateLimited) return rateLimited;

  const tooLarge = rejectInvalidUploadContentLength(req);
  if (tooLarge) return tooLarge;

  const emailCheck = await assertEmailVerified(auth.userId, auth.role);
  if (!emailCheck.ok) {
    return NextResponse.json(
      { error: emailCheck.error },
      { status: emailCheck.status }
    );
  }

  const formData = await req.formData();
  const type = formData.get("type") as string | null;
  const file = formData.get("file");

  if (type !== "CIN") {
    return NextResponse.json(
      { error: "Seule la carte d'identité (CIN) est acceptée" },
      { status: 400 }
    );
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = validateKycUploadFile(file, buffer);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const docType: KycDocumentType = "CIN";
  const slotParam = formData.get("cinSlot");
  const requestedSlot =
    slotParam != null && slotParam !== ""
      ? parseInt(String(slotParam), 10)
      : null;

  const existingCin = await prisma.providerKycDocument.findMany({
    where: { userId: auth.userId, type: "CIN" },
    select: { cinSlot: true },
  });
  const slots = existingCin.map((d) => d.cinSlot);
  const resolved = resolveCinSlot(slots, requestedSlot);

  if (resolved == null) {
    return NextResponse.json(
      { error: "Maximum 2 fichiers CIN déjà envoyés. Supprimez-en un pour remplacer." },
      { status: 400 }
    );
  }
  const cinSlot = resolved;

  const existing = await prisma.providerKycDocument.findUnique({
    where: {
      userId_type_cinSlot: {
        userId: auth.userId,
        type: docType,
        cinSlot,
      },
    },
  });

  const storedName = await saveKycFile(auth.userId, buffer, validation.mime);

  if (existing) {
    await deleteKycFile(auth.userId, existing.storedName);
    await prisma.providerKycDocument.update({
      where: { id: existing.id },
      data: {
        storedName,
        originalName: file.name.slice(0, 200),
        mimeType: validation.mime,
        sizeBytes: file.size,
      },
    });
  } else {
    await prisma.providerKycDocument.create({
      data: {
        userId: auth.userId,
        type: docType,
        cinSlot,
        storedName,
        originalName: file.name.slice(0, 200),
        mimeType: validation.mime,
        sizeBytes: file.size,
      },
    });
  }

  await prisma.user.update({
    where: { id: auth.userId },
    data: { kycStatus: "NOT_STARTED", kycSubmittedAt: null },
  });

  const kyc = await getProviderKycPayload(auth.userId);
  return NextResponse.json({ message: "Document enregistré", kyc });
});
