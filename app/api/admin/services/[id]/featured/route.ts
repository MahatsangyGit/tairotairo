import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withApiHandler } from "@/lib/api-handler";
import { requireAdmin } from "@/lib/admin-auth";
import { providerHasActiveSubscription } from "@/lib/featured-home";
import {
  featuredFlagSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";

export const dynamic = "force-dynamic";

export const PATCH = withApiHandler(
  "PATCH /api/admin/services/[id]/featured",
  async (req, { params }) => {
    const auth = await requireAdmin(req);

    const { id } = await params;

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(featuredFlagSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const { featured } = parsed.data;

    const service = await prisma.service.findUnique({
      where: { id },
      select: {
        id: true,
        available: true,
        providerId: true,
        provider: { select: { kycStatus: true } },
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
    }

    if (featured) {
      const hasSub = await providerHasActiveSubscription(service.providerId);
      if (!hasSub) {
        return NextResponse.json(
          {
            error:
              "Le prestataire doit avoir un abonnement mensuel actif pour mettre cette annonce en avant",
          },
          { status: 400 }
        );
      }
      if (service.provider.kycStatus !== "APPROVED") {
        return NextResponse.json(
          { error: "KYC du prestataire non approuvé" },
          { status: 400 }
        );
      }
      if (!service.available) {
        return NextResponse.json(
          { error: "L'annonce doit être disponible pour être mise en avant" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        featuredOnHomepage: featured,
        featuredOnHomepageAt: featured ? new Date() : null,
      },
      select: {
        id: true,
        featuredOnHomepage: true,
        featuredOnHomepageAt: true,
      },
    });

    return NextResponse.json({
      message: featured
        ? "Annonce mise en avant sur l'accueil"
        : "Mise en avant annonce retirée",
      service: {
        ...updated,
        featuredOnHomepageAt: updated.featuredOnHomepageAt?.toISOString() ?? null,
      },
    });
  }
);
