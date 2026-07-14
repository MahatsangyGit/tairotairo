import prisma from "@/lib/prisma";
import { isSubscriptionActive } from "@/lib/subscription";

/** Stable advisory lock key for expire-subscriptions cron (app-specific). */
const EXPIRE_SUBSCRIPTIONS_LOCK_KEY = 804_291_001;

export type ExpireSubscriptionsResult = {
  scanned: number;
  cleared: number;
  providerIds: string[];
  skipped?: boolean;
};

/**
 * Retire featuredOnHomepage (prestataire + annonces) pour les prestataires
 * dont l'abonnement est expiré ou absent.
 * Uses pg_try_advisory_xact_lock so concurrent cron runs skip safely under pooling.
 */
export async function expireSubscriptionSpotlights(
  now: Date = new Date()
): Promise<ExpireSubscriptionsResult> {
  return prisma.$transaction(async (tx) => {
    const lockRows = await tx.$queryRaw<Array<{ locked: boolean }>>`
      SELECT pg_try_advisory_xact_lock(${EXPIRE_SUBSCRIPTIONS_LOCK_KEY}) AS locked
    `;

    if (!lockRows[0]?.locked) {
      return {
        scanned: 0,
        cleared: 0,
        providerIds: [],
        skipped: true,
      };
    }

    const candidates = await tx.user.findMany({
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

    const providerIds = candidates
      .filter(
        (p) => !isSubscriptionActive(p.providerSubscription?.expiresAt, now)
      )
      .map((p) => p.id);

    if (providerIds.length > 0) {
      await tx.user.updateMany({
        where: { id: { in: providerIds } },
        data: { featuredOnHomepage: false, featuredOnHomepageAt: null },
      });
      await tx.service.updateMany({
        where: { providerId: { in: providerIds } },
        data: { featuredOnHomepage: false, featuredOnHomepageAt: null },
      });
    }

    return {
      scanned: candidates.length,
      cleared: providerIds.length,
      providerIds,
    };
  });
}
