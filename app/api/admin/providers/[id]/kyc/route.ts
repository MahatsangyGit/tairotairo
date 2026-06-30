import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { validateKycCompleteness } from "@/lib/kyc";
import {
  disableProviderHomepageSpotlight,
  syncProviderHomepageSpotlight,
} from "@/lib/provider-spotlight";
import { notifyKycApproved, notifyKycRejected } from "@/lib/notify-kyc";
import {
  adminKycActionSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;

    const { id } = await params;

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(adminKycActionSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const { action } = parsed.data;

    const provider = await prisma.user.findUnique({
      where: { id, role: "PROVIDER" },
      select: {
        id: true,
        kycStatus: true,
        kycDocuments: { select: { type: true } },
      },
    });

    if (!provider) {
      return NextResponse.json({ error: "Prestataire introuvable" }, { status: 404 });
    }

    if (action === "approve") {
      const check = validateKycCompleteness(provider.kycDocuments);
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }

      if (provider.kycStatus === "APPROVED") {
        return NextResponse.json(
          { error: "Ce prestataire est déjà approuvé" },
          { status: 400 }
        );
      }

      await prisma.user.update({
        where: { id },
        data: {
          kycStatus: "APPROVED",
          kycSubmittedAt: new Date(),
        },
      });

      await syncProviderHomepageSpotlight(id);
      await notifyKycApproved(id);

      return NextResponse.json({
        message: "Identité du prestataire approuvée",
        kycStatus: "APPROVED",
      });
    }

    await prisma.user.update({
      where: { id },
      data: {
        kycStatus: "NOT_STARTED",
        kycSubmittedAt: null,
      },
    });

    if (provider.kycStatus === "APPROVED") {
      await disableProviderHomepageSpotlight(id);
    }

    await notifyKycRejected(id);

    return NextResponse.json({
      message: "Dossier KYC refusé. Le prestataire peut soumettre à nouveau.",
      kycStatus: "NOT_STARTED",
    });
  } catch (error) {
    console.error("[PATCH /api/admin/providers/[id]/kyc]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
