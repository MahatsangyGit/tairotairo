import prisma from "@/lib/prisma";
import { CATEGORY_META } from "@/lib/categories";

export async function getSitemapEntries() {
  const [services, requests, providers] = await Promise.all([
    prisma.service.findMany({
      where: {
        available: true,
        provider: { kycStatus: "APPROVED" },
      },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }),
    prisma.serviceRequest.findMany({
      where: { open: true },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }),
    prisma.user.findMany({
      where: {
        role: { in: ["PROVIDER", "ADMIN"] },
        kycStatus: "APPROVED",
        services: { some: { available: true } },
      },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 2000,
    }),
  ]);

  return { services, requests, providers };
}

export function getStaticSitemapPaths() {
  const staticPaths = ["", "/services", "/requests", "/providers"];

  const categoryPaths = CATEGORY_META.flatMap((cat) => [
    `/services/categorie/${cat.slug}`,
    `/requests/categorie/${cat.slug}`,
  ]);

  return [...staticPaths, ...categoryPaths];
}
