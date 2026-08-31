import type { Metadata } from "next";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export function siteUrl(path = ""): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  );
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
  type?: "website" | "article" | "profile";
}

export function buildPageMetadata({
  title,
  description,
  path,
  noIndex = false,
  type = "website",
}: PageMetadataInput): Metadata {
  const url = siteUrl(path);

  return {
    title,
    description,
    alternates: { canonical: url },
    ...(noIndex && { robots: { index: false, follow: false } }),
    openGraph: {
      title,
      description,
      url,
      type,
      locale: "fr_MG",
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function homeMetadata(): Metadata {
  return buildPageMetadata({
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description:
      "Réservez le prestataire idéal à Madagascar. Recherchez un service, comparez les avis, puis réservez un prestataire vérifié près de chez vous.",
    path: "/",
  });
}

export function servicesListMetadata(): Metadata {
  return buildPageMetadata({
    title: "Services à Madagascar",
    description:
      "Parcourez les annonces de services publiées par des prestataires vérifiés à Madagascar. Filtrez par catégorie, ville et budget.",
    path: "/services",
  });
}

export function requestsListMetadata(): Metadata {
  return buildPageMetadata({
    title: "Demandes de services à Madagascar",
    description:
      "Consultez les demandes de clients à Madagascar et proposez vos services. Filtrez par catégorie, localisation et budget.",
    path: "/requests",
  });
}

export function providersListMetadata(): Metadata {
  return buildPageMetadata({
    title: "Prestataires vérifiés à Madagascar",
    description:
      "Découvrez les prestataires de services vérifiés sur Tairo ampio. Profils, avis clients et portfolio.",
    path: "/providers",
  });
}

export function categoryServicesMetadata(
  categoryName: string,
  description: string,
  slug: string
): Metadata {
  return buildPageMetadata({
    title: `${categoryName} à Madagascar — Services`,
    description,
    path: `/services/categorie/${slug}`,
  });
}

export function categoryRequestsMetadata(
  categoryName: string,
  description: string,
  slug: string
): Metadata {
  return buildPageMetadata({
    title: `${categoryName} à Madagascar — Demandes`,
    description: `Demandes de ${categoryName.toLowerCase()} publiées par des clients à Madagascar. Répondez et proposez votre tarif.`,
    path: `/requests/categorie/${slug}`,
  });
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function jsonLdWebSite() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl("/"),
    description: SITE_TAGLINE,
    inLanguage: "fr-MG",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl("/services")}?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function jsonLdOrganization() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl("/"),
    description: SITE_TAGLINE,
  };
}

export function jsonLdBreadcrumbList(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: siteUrl(item.path),
    })),
  };
}

export function jsonLdItemList(
  name: string,
  description: string,
  path: string,
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    description,
    url: siteUrl(path),
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: siteUrl(item.url),
    })),
  };
}

export function jsonLdService(input: {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  providerName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.title,
    description: input.description,
    url: siteUrl(`/services/${input.id}`),
    category: input.category,
    areaServed: input.location,
    provider: {
      "@type": "Person",
      name: input.providerName,
    },
    offers: {
      "@type": "Offer",
      price: input.price,
      priceCurrency: "MGA",
      availability: "https://schema.org/InStock",
    },
  };
}

export function jsonLdLocalBusiness(input: {
  id: string;
  name: string;
  description: string | null;
  averageRating: number;
  reviewCount: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: input.name,
    description: input.description ?? `Prestataire sur ${SITE_NAME}`,
    url: siteUrl(`/providers/${input.id}`),
    ...(input.reviewCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: input.averageRating,
        reviewCount: input.reviewCount,
      },
    }),
  };
}
