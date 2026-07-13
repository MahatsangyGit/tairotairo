import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow, requireRole } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";
import { assertEmailVerified } from "@/lib/email-verification";
import { validateKycCompleteness } from "@/lib/kyc";
import { getProviderKycPayload } from "@/lib/provider-kyc";
import { notifyKycPending } from "@/lib/notify-kyc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApiHandler("POST /api/provider/kyc/submit", async (req) => {
  const auth = await requireAuthOrThrow(req);
  requireRole(auth, "PROVIDER", "Réservé aux prestataires");

  const emailCheck = await assertEmailVerified(auth.userId, auth.role);
  if (!emailCheck.ok) {
    return NextResponse.json(
      { error: emailCheck.error },
      { status: emailCheck.status }
    );
  }

  const documents = await prisma.providerKycDocument.findMany({
    where: { userId: auth.userId },
    select: { type: true },
  });

  const check = validateKycCompleteness(documents);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { kycStatus: true },
  });

  if (existing?.kycStatus === "PENDING") {
    return NextResponse.json(
      { error: "Votre dossier est déjà en cours de vérification" },
      { status: 400 }
    );
  }

  if (existing?.kycStatus === "APPROVED") {
    return NextResponse.json(
      { error: "Votre identité est déjà vérifiée" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: auth.userId },
    data: {
      kycStatus: "PENDING",
      kycSubmittedAt: new Date(),
    },
  });

  await notifyKycPending(auth.userId);

  const kyc = await getProviderKycPayload(auth.userId);
  return NextResponse.json({
    message:
      "Dossier envoyé. Votre identité sera vérifiée par notre équipe sous peu.",
    kyc,
  });
});
