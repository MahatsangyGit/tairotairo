import prisma from "@/lib/prisma";
import { providerHasActiveSubscription } from "@/lib/featured-home";

export async function syncProviderHomepageSpotlight(
  providerId: string
): Promise<boolean> {
  const provider = await prisma.user.findUnique({
    where: { id: providerId, role: "PROVIDER" },
    select: { kycStatus: true, featuredOnHomepage: true },
  });

  if (!provider) return false;

  const hasSub = await providerHasActiveSubscription(providerId);
  const eligible = hasSub && provider.kycStatus === "APPROVED";

  if (eligible) {
    if (!provider.featuredOnHomepage) {
      await prisma.user.update({
        where: { id: providerId },
        data: { featuredOnHomepage: true, featuredOnHomepageAt: new Date() },
      });
    }
    return true;
  }

  await disableProviderHomepageSpotlight(providerId);
  return false;
}

export async function disableProviderHomepageSpotlight(
  providerId: string
): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: providerId },
      data: { featuredOnHomepage: false, featuredOnHomepageAt: null },
    }),
    prisma.service.updateMany({
      where: { providerId },
      data: { featuredOnHomepage: false, featuredOnHomepageAt: null },
    }),
  ]);
}

export async function setProviderFeaturedService(
  providerId: string,
  serviceId: string | null
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const hasSub = await providerHasActiveSubscription(providerId);
  if (!hasSub) {
    return {
      ok: false,
      error: "Un abonnement actif est requis pour mettre une annonce en avant",
      status: 403,
    };
  }

  const provider = await prisma.user.findUnique({
    where: { id: providerId, role: "PROVIDER" },
    select: { kycStatus: true },
  });

  if (!provider || provider.kycStatus !== "APPROVED") {
    return {
      ok: false,
      error: "Votre identité doit être vérifiée (KYC approuvé)",
      status: 403,
    };
  }

  if (serviceId === null) {
    await prisma.service.updateMany({
      where: { providerId },
      data: { featuredOnHomepage: false, featuredOnHomepageAt: null },
    });
    return { ok: true };
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, providerId },
    select: { id: true, available: true },
  });

  if (!service) {
    return { ok: false, error: "Annonce introuvable", status: 404 };
  }

  if (!service.available) {
    return {
      ok: false,
      error: "L'annonce doit être en ligne pour être mise en avant",
      status: 400,
    };
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.service.updateMany({
      where: { providerId, id: { not: serviceId } },
      data: { featuredOnHomepage: false, featuredOnHomepageAt: null },
    }),
    prisma.service.update({
      where: { id: serviceId },
      data: { featuredOnHomepage: true, featuredOnHomepageAt: now },
    }),
    prisma.user.update({
      where: { id: providerId },
      data: { featuredOnHomepage: true, featuredOnHomepageAt: now },
    }),
  ]);

  return { ok: true };
}

export async function clearServiceFeaturedIfNeeded(serviceId: string): Promise<void> {
  await prisma.service.updateMany({
    where: { id: serviceId, featuredOnHomepage: true },
    data: { featuredOnHomepage: false, featuredOnHomepageAt: null },
  });
}
