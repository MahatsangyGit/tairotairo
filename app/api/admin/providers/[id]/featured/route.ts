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
  "PATCH /api/admin/providers/[id]/featured",
  async (req, { params }) => {
    const auth = await requireAdmin(req);

    const { id } = await params;

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(featuredFlagSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const { featured } = parsed.data;

    const provider = await prisma.user.findUnique({
      where: { id, role: "PROVIDER" },
      select: { id: true, kycStatus: true },
    });

    if (!provider) {
      return NextResponse.json({ error: "Prestataire introuvable" }, { status: 404 });
    }

    if (featured) {
      const hasSub = await providerHasActiveSubscription(id);
      if (!hasSub) {
        return NextResponse.json(
          {
            error:
              "Abonnement mensuel actif requis avant de mettre ce prestataire en avant",
          },
          { status: 400 }
        );
      }
      if (provider.kycStatus !== "APPROVED") {
        return NextResponse.json(
          { error: "Le prestataire doit avoir un KYC approuvé" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.user.update({
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
        ? "Prestataire mis en avant sur l'accueil"
        : "Mise en avant prestataire retirée",
      provider: {
        ...updated,
        featuredOnHomepageAt: updated.featuredOnHomepageAt?.toISOString() ?? null,
      },
    });
  }
);
