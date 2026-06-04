import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { validateKycCompleteness } from "@/lib/kyc";
import { getProviderKycPayload } from "@/lib/provider-kyc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (auth.role !== "PROVIDER") {
      return NextResponse.json({ error: "Réservé aux prestataires" }, { status: 403 });
    }

    const documents = await prisma.providerKycDocument.findMany({
      where: { userId: auth.userId },
      select: { type: true },
    });

    const check = validateKycCompleteness(documents);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: auth.userId },
      data: {
        kycStatus: "APPROVED",
        kycSubmittedAt: new Date(),
      },
    });

    const kyc = await getProviderKycPayload(auth.userId);
    return NextResponse.json({
      message: "Vérification d'identité enregistrée. Votre compte prestataire est activé.",
      kyc,
    });
  } catch (error) {
    console.error("[POST /api/provider/kyc/submit]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
