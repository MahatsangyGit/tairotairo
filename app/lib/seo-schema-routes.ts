import prisma from "@/lib/prisma";
import { PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import { averageRating } from "@/lib/advanced-search";
import {
  getCategoryMeta,
  slugToCategory,
} from "@/lib/categories";
import { buildRequestWhere, buildServiceWhere } from "@/lib/advanced-search";
import { isKycApproved } from "@/lib/kyc";
import {
  jsonLdBreadcrumbList,
  jsonLdItemList,
  jsonLdLocalBusiness,
  jsonLdOrganization,
  jsonLdService,
  jsonLdWebSite,
} from "@/lib/seo";

export type SeoSchemaResult = {
  data: object;
  cacheSeconds: number;
};

export async function resolveSeoSchema(
  path: string[]
): Promise<SeoSchemaResult | null> {
  if (path.length === 0) return null;

  if (path[0] === "home" && path.length === 2) {
    if (path[1] === "website") {
      return {
        data: jsonLdWebSite(),
        cacheSeconds: PAGE_REVALIDATE_SECONDS.HOME,
      };
    }
    if (path[1] === "organization") {
      return {
        data: jsonLdOrganization(),
        cacheSeconds: PAGE_REVALIDATE_SECONDS.HOME,
      };
    }
    return null;
  }

  if (path[0] === "providers") {
    if (path.length === 2 && path[1] === "breadcrumb") {
      return {
        data: jsonLdBreadcrumbList([
          { name: "Accueil", path: "/" },
          { name: "Prestataires", path: "/providers" },
        ]),
        cacheSeconds: PAGE_REVALIDATE_SECONDS.PROVIDERS,
      };
    }

    if (path.length === 2 && path[1] === "list") {
      const rows = await prisma.user.findMany({
        where: {
          role: { in: ["PROVIDER", "ADMIN"] },
          kycStatus: "APPROVED",
          services: { some: { available: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 60,
        select: { id: true, name: true },
      });

      return {
        data: jsonLdItemList(
          "Prestataires vérifiés à Madagascar",
          "Profils de prestataires vérifiés sur Tairo ampio",
          "/providers",
          rows.map((p) => ({ name: p.name, url: `/providers/${p.id}` }))
        ),
        cacheSeconds: PAGE_REVALIDATE_SECONDS.PROVIDERS,
      };
    }

    if (path.length === 3 && path[2] === "breadcrumb") {
      const provider = await prisma.user.findUnique({
        where: { id: path[1], role: { in: ["PROVIDER", "ADMIN"] } },
        select: { id: true, name: true },
      });
      if (!provider) return null;

      return {
        data: jsonLdBreadcrumbList([
          { name: "Accueil", path: "/" },
          { name: "Prestataires", path: "/providers" },
          { name: provider.name, path: `/providers/${provider.id}` },
        ]),
        cacheSeconds: PAGE_REVALIDATE_SECONDS.PROVIDERS,
      };
    }

    if (path.length === 3 && path[2] === "business") {
      const provider = await prisma.user.findUnique({
        where: { id: path[1], role: { in: ["PROVIDER", "ADMIN"] } },
        select: { id: true, name: true, bio: true },
      });
      if (!provider) return null;

      const reviews = await prisma.review.findMany({
        where: { targetId: path[1] },
        select: { rating: true },
      });
      const rating = averageRating(reviews);

      return {
        data: jsonLdLocalBusiness({
          id: provider.id,
          name: provider.name,
          description: provider.bio,
          averageRating: rating.averageRating,
          reviewCount: rating.total,
        }),
        cacheSeconds: PAGE_REVALIDATE_SECONDS.PROVIDERS,
      };
    }
  }

  if (path[0] === "services" && path.length === 3) {
    const id = path[1];
    const service = await prisma.service.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        category: true,
        location: true,
        available: true,
        provider: { select: { name: true, kycStatus: true } },
      },
    });

    if (
      !service ||
      !service.available ||
      !isKycApproved(service.provider.kycStatus)
    ) {
      return null;
    }

    if (path[2] === "breadcrumb") {
      return {
        data: jsonLdBreadcrumbList([
          { name: "Accueil", path: "/" },
          { name: "Services", path: "/services" },
          { name: service.title, path: `/services/${id}` },
        ]),
        cacheSeconds: PAGE_REVALIDATE_SECONDS.PROVIDERS,
      };
    }

    if (path[2] === "service") {
      return {
        data: jsonLdService({
          id: service.id,
          title: service.title,
          description: service.description,
          price: service.price,
          category: service.category,
          location: service.location,
          providerName: service.provider.name,
        }),
        cacheSeconds: PAGE_REVALIDATE_SECONDS.PROVIDERS,
      };
    }
  }

  if (path[0] === "requests" && path.length === 3 && path[2] === "breadcrumb") {
    const id = path[1];
    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      select: { id: true, title: true, open: true },
    });
    if (!request || !request.open) return null;

    return {
      data: jsonLdBreadcrumbList([
        { name: "Accueil", path: "/" },
        { name: "Demandes", path: "/requests" },
        { name: request.title, path: `/requests/${id}` },
      ]),
      cacheSeconds: PAGE_REVALIDATE_SECONDS.PROVIDERS,
    };
  }

  if (
    path[0] === "services" &&
    path[1] === "category" &&
    path.length === 4
  ) {
    const slug = path[2];
    const meta = getCategoryMeta(slug);
    const category = slugToCategory(slug);
    if (!meta || !category) return null;

    const listPath = `/services/categorie/${slug}`;

    if (path[3] === "breadcrumb") {
      return {
        data: jsonLdBreadcrumbList([
          { name: "Accueil", path: "/" },
          { name: "Services", path: "/services" },
          { name: meta.name, path: listPath },
        ]),
        cacheSeconds: PAGE_REVALIDATE_SECONDS.PROVIDERS,
      };
    }

    if (path[3] === "list") {
      const where = buildServiceWhere({
        search: "",
        category,
        location: "",
        minPrice: null,
        maxPrice: null,
      });
      const services = await prisma.service.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: 12,
        select: { id: true, title: true },
      });

      return {
        data: jsonLdItemList(
          `${meta.name} à Madagascar`,
          meta.description,
          listPath,
          services.map((s) => ({ name: s.title, url: `/services/${s.id}` }))
        ),
        cacheSeconds: PAGE_REVALIDATE_SECONDS.PROVIDERS,
      };
    }
  }

  if (
    path[0] === "requests" &&
    path[1] === "category" &&
    path.length === 4
  ) {
    const slug = path[2];
    const meta = getCategoryMeta(slug);
    const category = slugToCategory(slug);
    if (!meta || !category) return null;

    const listPath = `/requests/categorie/${slug}`;

    if (path[3] === "breadcrumb") {
      return {
        data: jsonLdBreadcrumbList([
          { name: "Accueil", path: "/" },
          { name: "Demandes", path: "/requests" },
          { name: meta.name, path: listPath },
        ]),
        cacheSeconds: PAGE_REVALIDATE_SECONDS.PROVIDERS,
      };
    }

    if (path[3] === "list") {
      const where = buildRequestWhere({
        search: "",
        category,
        location: "",
        minPrice: null,
        maxPrice: null,
      });
      const requests = await prisma.serviceRequest.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: 12,
        select: { id: true, title: true },
      });

      return {
        data: jsonLdItemList(
          `Demandes ${meta.name} à Madagascar`,
          meta.description,
          listPath,
          requests.map((r) => ({ name: r.title, url: `/requests/${r.id}` }))
        ),
        cacheSeconds: PAGE_REVALIDATE_SECONDS.PROVIDERS,
      };
    }
  }

  return null;
}

/** Chemins JSON-LD externes pour les pages publiques. */
export const SEO_SCHEMA_PATHS = {
  home: [["home", "website"], ["home", "organization"]] as const,
  providersList: [["providers", "breadcrumb"], ["providers", "list"]] as const,
  provider: (id: string) =>
    [
      ["providers", id, "breadcrumb"],
      ["providers", id, "business"],
    ] as const,
  service: (id: string) =>
    [
      ["services", id, "breadcrumb"],
      ["services", id, "service"],
    ] as const,
  request: (id: string) => [["requests", id, "breadcrumb"]] as const,
  servicesCategory: (slug: string) =>
    [
      ["services", "category", slug, "breadcrumb"],
      ["services", "category", slug, "list"],
    ] as const,
  requestsCategory: (slug: string) =>
    [
      ["requests", "category", slug, "breadcrumb"],
      ["requests", "category", slug, "list"],
    ] as const,
};
