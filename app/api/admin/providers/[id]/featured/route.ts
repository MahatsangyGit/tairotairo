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
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;

    const { id } = await params;
    const { featured } = await req.json();

    if (typeof featured !== "boolean") {
      return NextResponse.json({ error: "Champ featured requis (boolean)" }, { status: 400 });
    }

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
  } catch (error) {
    console.error("[PATCH /api/admin/providers/[id]/featured]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
