import prisma from "@/lib/prisma";
import { disableProviderHomepageSpotlight } from "@/lib/provider-spotlight";
import { isSubscriptionActive } from "@/lib/subscription";

export type ExpireSubscriptionsResult = {
  scanned: number;
  cleared: number;
  providerIds: string[];
};

/**
 * Retire featuredOnHomepage (prestataire + annonces) pour les prestataires
 * dont l'abonnement est expiré ou absent.
 */
export async function expireSubscriptionSpotlights(
  now: Date = new Date()
): Promise<ExpireSubscriptionsResult> {
  const candidates = await prisma.user.findMany({
    where: {
      role: "PROVIDER",
      OR: [
        { featuredOnHomepage: true },
        { services: { some: { featuredOnHomepage: true } } },
      ],
    },
    select: {
      id: true,
      providerSubscription: { select: { expiresAt: true } },
    },
  });

  const toClear = candidates.filter(
    (p) => !isSubscriptionActive(p.providerSubscription?.expiresAt, now)
  );

  for (const provider of toClear) {
    await disableProviderHomepageSpotlight(provider.id);
  }

  return {
    scanned: candidates.length,
    cleared: toClear.length,
    providerIds: toClear.map((p) => p.id),
  };
}
