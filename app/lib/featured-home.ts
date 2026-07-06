import prisma from "@/lib/prisma";
import { withAnonymousRls } from "@/lib/rls";
import { isSubscriptionActive } from "@/lib/subscription";
import { withCoverImageUrl } from "@/lib/listing-cover";
import { getProviderRatingMap } from "@/lib/rating-sort-search";

export const MAX_FEATURED_PROVIDERS = 8;
export const MAX_FEATURED_SERVICES = 8;

const now = () => new Date();

export function activeSubscriptionWhere() {
  return {
    providerSubscription: {
      is: { expiresAt: { gt: now() } },
    },
  };
}

export async function providerHasActiveSubscription(
  providerId: string
): Promise<boolean> {
  const sub = await prisma.providerSubscription.findUnique({
    where: { providerId },
    select: { expiresAt: true },
  });
  return isSubscriptionActive(sub?.expiresAt);
}

export async function getFeaturedProvidersForHome(limit = MAX_FEATURED_PROVIDERS) {
  return withAnonymousRls(async () => {
  const rows = await prisma.user.findMany({
    where: {
      role: "PROVIDER",
      featuredOnHomepage: true,
      kycStatus: "APPROVED",
      ...activeSubscriptionWhere(),
    },
    orderBy: { featuredOnHomepageAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
      _count: {
        select: {
          services: { where: { available: true } },
          reviewsReceived: true,
        },
      },
    },
  });

  const ratingRows = await prisma.review.groupBy({
    by: ["targetId"],
    where: { targetId: { in: rows.map((p) => p.id) } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const ratingMap = new Map(
    ratingRows.map((r) => [
      r.targetId,
      {
        averageRating:
          r._avg.rating != null ? Math.round(r._avg.rating * 10) / 10 : null,
        reviewCount: r._count.rating,
      },
    ])
  );

  return rows.map((p) => {
    const rating = ratingMap.get(p.id) ?? {
      averageRating: null,
      reviewCount: 0,
    };
    return {
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      bio: p.bio,
      serviceCount: p._count.services,
      ...rating,
    };
  });
  });
}

export async function getFeaturedServicesForHome(limit = MAX_FEATURED_SERVICES) {
  return withAnonymousRls(async () => {
  const rows = await prisma.service.findMany({
    where: {
      featuredOnHomepage: true,
      available: true,
      provider: {
        kycStatus: "APPROVED",
        ...activeSubscriptionWhere(),
      },
    },
    orderBy: { featuredOnHomepageAt: "desc" },
    take: limit,
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  const ratingMap = await getProviderRatingMap(rows.map((s) => s.provider.id));

  return rows.map((s) => {
    const rating = ratingMap.get(s.provider.id) ?? {
      averageRating: null,
      reviewCount: 0,
    };
    return withCoverImageUrl("service", {
      id: s.id,
      title: s.title,
      description: s.description,
      price: s.price,
      category: s.category,
      location: s.location,
      coverImageMime: s.coverImageMime,
      updatedAt: s.updatedAt,
      provider: { ...s.provider, ...rating },
    });
  });
  });
}
