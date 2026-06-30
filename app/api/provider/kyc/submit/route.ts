import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertEmailVerified } from "@/lib/email-verification";
import { validateKycCompleteness } from "@/lib/kyc";
import { getProviderKycPayload } from "@/lib/provider-kyc";
import { notifyKycPending } from "@/lib/notify-kyc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (auth.role !== "PROVIDER") {
      return NextResponse.json({ error: "Réservé aux prestataires" }, { status: 403 });
    }

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
  } catch (error) {
    console.error("[POST /api/provider/kyc/submit]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
