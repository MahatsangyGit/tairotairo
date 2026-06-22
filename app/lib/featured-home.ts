import prisma from "@/lib/prisma";
import { averageRating } from "@/lib/advanced-search";
import { isSubscriptionActive } from "@/lib/subscription";
import { withCoverImageUrl } from "@/lib/listing-cover";

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
      reviewsReceived: { select: { rating: true } },
      _count: { select: { services: { where: { available: true } } } },
    },
  });

  return rows.map((p) => {
    const rating = averageRating(p.reviewsReceived);
    return {
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      bio: p.bio,
      serviceCount: p._count.services,
      ...rating,
    };
  });
}

export async function getFeaturedServicesForHome(limit = MAX_FEATURED_SERVICES) {
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
          reviewsReceived: { select: { rating: true } },
        },
      },
    },
  });

  return rows.map((s) => {
    const { reviewsReceived, ...provider } = s.provider;
    const rating = averageRating(reviewsReceived);
    return withCoverImageUrl("service", {
      id: s.id,
      title: s.title,
      description: s.description,
      price: s.price,
      category: s.category,
      location: s.location,
      coverImageMime: s.coverImageMime,
      updatedAt: s.updatedAt,
      provider: { ...provider, ...rating },
    });
  });
}
