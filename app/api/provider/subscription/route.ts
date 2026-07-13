import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow, requireRole } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";
import { serializeSubscription } from "@/lib/subscription";
import {
  getSubscriptionPlans,
  SUBSCRIPTION_BENEFITS,
  SUBSCRIPTION_MONTHLY_PRICE_MGA,
} from "@/lib/subscription-plans";
import { syncProviderHomepageSpotlight } from "@/lib/provider-spotlight";

export const dynamic = "force-dynamic";

export const GET = withApiHandler("GET /api/provider/subscription", async (req) => {
  const auth = await requireAuthOrThrow(req);
  requireRole(auth, "PROVIDER", "Réservé aux prestataires");

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
});
