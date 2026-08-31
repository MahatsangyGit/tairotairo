import prisma from "@/lib/prisma";
import { averageRating } from "@/lib/advanced-search";
import { activeSubscriptionWhere } from "@/lib/featured-home";
import { isEntrepriseIndividuelle } from "@/lib/provider-legal";

export const SUBSCRIBED_SUGGESTIONS_LIMIT = 8;

/** Prestataires abonnés pour la section « Nos suggestions » (hors tri recherche). */
export async function getSubscribedProviderSuggestions(
  limit = SUBSCRIBED_SUGGESTIONS_LIMIT
) {
  const rows = await prisma.user.findMany({
    where: {
      role: "PROVIDER",
      kycStatus: "APPROVED",
      ...activeSubscriptionWhere(),
    },
    orderBy: [
      { featuredOnHomepage: "desc" },
      { featuredOnHomepageAt: "desc" },
      { name: "asc" },
    ],
    take: limit,
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
      nif: true,
      stat: true,
      rcs: true,
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
      isEntrepriseIndividuelle: isEntrepriseIndividuelle(p),
      ...rating,
    };
  });
}

export async function loadVerifiedProvidersDirectory(take = 60) {
  const rows = await prisma.user.findMany({
    where: {
      role: { in: ["PROVIDER", "ADMIN"] },
      kycStatus: "APPROVED",
      services: { some: { available: true } },
    },
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
      nif: true,
      stat: true,
      rcs: true,
      services: {
        where: { available: true },
        take: 1,
        select: { category: true, location: true },
      },
      reviewsReceived: { select: { rating: true } },
    },
  });

  return rows.map((p) => {
    const rating = averageRating(p.reviewsReceived);
    const primary = p.services[0];
    return {
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      bio: p.bio,
      isEntrepriseIndividuelle: isEntrepriseIndividuelle(p),
      category: primary?.category ?? null,
      location: primary?.location ?? null,
      ...rating,
    };
  });
}
