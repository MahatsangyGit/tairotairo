import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { serializeSubscription } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (auth.role !== "PROVIDER") {
      return NextResponse.json({ error: "Réservé aux prestataires" }, { status: 403 });
    }

    const [subscription, user, featuredService] = await Promise.all([
      prisma.providerSubscription.findUnique({
        where: { providerId: auth.userId },
      }),
      prisma.user.findUnique({
        where: { id: auth.userId },
        select: { featuredOnHomepage: true, kycStatus: true },
      }),
      prisma.service.findFirst({
        where: { providerId: auth.userId, featuredOnHomepage: true },
        select: { id: true, title: true },
        orderBy: { featuredOnHomepageAt: "desc" },
      }),
    ]);

    const sub = serializeSubscription(subscription);

    return NextResponse.json({
      subscription: sub,
      spotlight: {
        providerFeatured: user?.featuredOnHomepage ?? false,
        canFeature: Boolean(sub?.isActive && user?.kycStatus === "APPROVED"),
        featuredService: featuredService
          ? { id: featuredService.id, title: featuredService.title }
          : null,
      },
    });
  } catch (error) {
    console.error("[GET /api/provider/subscription]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
