import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { providerHasActiveSubscription } from "@/lib/featured-home";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = requireAdmin(req);
    if (!admin.ok) return admin.response;

    const { id } = await params;
    const { featured } = await req.json();

    if (typeof featured !== "boolean") {
      return NextResponse.json({ error: "Champ featured requis (boolean)" }, { status: 400 });
    }

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
  } catch (error) {
    console.error("[PATCH /api/admin/services/[id]/featured]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
