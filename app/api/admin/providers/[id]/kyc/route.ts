import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withApiHandler } from "@/lib/api-handler";
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

export const PATCH = withApiHandler(
  "PATCH /api/admin/providers/[id]/kyc",
  async (req, { params }) => {
    const auth = await requireAdmin(req);

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
  }
);
