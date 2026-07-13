import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withApiHandler } from "@/lib/api-handler";
import { requireAdmin } from "@/lib/admin-auth";
import { serializeSubscription } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export const GET = withApiHandler("GET /api/admin/spotlight", async (req) => {
  const auth = await requireAdmin(req);

  const [providers, services] = await Promise.all([
    prisma.user.findMany({
      where: { role: "PROVIDER" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        kycStatus: true,
        featuredOnHomepage: true,
        featuredOnHomepageAt: true,
        providerSubscription: {
          select: { startsAt: true, expiresAt: true, notes: true },
        },
        _count: { select: { services: true } },
      },
    }),
    prisma.service.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        title: true,
        category: true,
        available: true,
        featuredOnHomepage: true,
        featuredOnHomepageAt: true,
        provider: {
          select: {
            id: true,
            name: true,
            providerSubscription: { select: { expiresAt: true } },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    providers: providers.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      kycStatus: p.kycStatus,
      featuredOnHomepage: p.featuredOnHomepage,
      featuredOnHomepageAt: p.featuredOnHomepageAt?.toISOString() ?? null,
      subscription: serializeSubscription(p.providerSubscription),
      servicesCount: p._count.services,
    })),
    services: services.map((s) => ({
      id: s.id,
      title: s.title,
      category: s.category,
      available: s.available,
      featuredOnHomepage: s.featuredOnHomepage,
      featuredOnHomepageAt: s.featuredOnHomepageAt?.toISOString() ?? null,
      providerId: s.provider.id,
      providerName: s.provider.name,
      providerSubscriptionActive: serializeSubscription(
        s.provider.providerSubscription
          ? {
              startsAt: new Date(0),
              expiresAt: s.provider.providerSubscription.expiresAt,
              notes: null,
            }
          : null
      )?.isActive ?? false,
    })),
  });
});
