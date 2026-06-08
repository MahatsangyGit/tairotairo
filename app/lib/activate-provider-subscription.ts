import prisma from "@/lib/prisma";
import {
  extendSubscriptionExpiry,
  serializeSubscription,
  SUBSCRIPTION_PERIOD_DAYS,
} from "@/lib/subscription";
import { syncProviderHomepageSpotlight } from "@/lib/provider-spotlight";

export async function activateProviderSubscription(
  providerId: string,
  months: number,
  notes?: string | null
) {
  const existing = await prisma.providerSubscription.findUnique({
    where: { providerId },
  });

  const expiresAt = extendSubscriptionExpiry(existing?.expiresAt, months);

  const subscription = await prisma.providerSubscription.upsert({
    where: { providerId },
    create: {
      providerId,
      expiresAt,
      notes: notes ?? null,
    },
    update: {
      expiresAt,
      ...(notes !== undefined && { notes }),
    },
  });

  const spotlightEnabled = await syncProviderHomepageSpotlight(providerId);

  return {
    subscription: serializeSubscription(subscription),
    spotlightEnabled,
    message: `Abonnement activé pour ${months} période(s) (${SUBSCRIPTION_PERIOD_DAYS} jours chacune)${
      spotlightEnabled
        ? ". Votre profil est mis en avant sur l'accueil."
        : ". Mise en avant sur l'accueil dès que le KYC est approuvé."
    }`,
  };
}
