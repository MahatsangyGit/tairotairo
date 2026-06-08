import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { serializeSubscription } from "@/lib/subscription";
import {
  getSubscriptionPlans,
  SUBSCRIPTION_BENEFITS,
  SUBSCRIPTION_MONTHLY_PRICE_MGA,
} from "@/lib/subscription-plans";
import { syncProviderHomepageSpotlight } from "@/lib/provider-spotlight";

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

    const [subscription, user, featuredService, recentPayments] = await Promise.all([
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
      prisma.providerSubscriptionPayment.findMany({
        where: { providerId: auth.userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          months: true,
          amount: true,
          paymentMethod: true,
          phone: true,
          status: true,
          referenceId: true,
          createdAt: true,
        },
      }),
    ]);

    const sub = serializeSubscription(subscription);

    if (!sub?.isActive) {
      await syncProviderHomepageSpotlight(auth.userId);
    }

    return NextResponse.json({
      subscription: sub,
      spotlight: {
        providerFeatured: user?.featuredOnHomepage ?? false,
        canFeature: Boolean(sub?.isActive && user?.kycStatus === "APPROVED"),
        featuredService: featuredService
          ? { id: featuredService.id, title: featuredService.title }
          : null,
      },
      plans: getSubscriptionPlans(),
      benefits: SUBSCRIPTION_BENEFITS,
      monthlyPriceMGA: SUBSCRIPTION_MONTHLY_PRICE_MGA,
      payments: recentPayments.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[GET /api/provider/subscription]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
