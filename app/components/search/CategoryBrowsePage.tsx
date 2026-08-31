import { notFound, redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import JsonLdScripts from "@/components/seo/JsonLdScripts";
import PublicServicesExplorer from "@/components/search/PublicServicesExplorer";
import PublicRequestsExplorer from "@/components/search/PublicRequestsExplorer";
import {
  getCategoryMeta,
  isLegacyCategorySlug,
  isValidCategorySlug,
  resolveCategorySlug,
  slugToCategory,
} from "@/lib/categories";
import prisma from "@/lib/prisma";
import { buildRequestWhere, buildServiceWhere } from "@/lib/advanced-search";
import { SEO_SCHEMA_PATHS } from "@/lib/seo-schema-routes";
import type { ListingKind } from "@/lib/listing-cover";

export async function countCategoryListings(
  kind: ListingKind,
  slug: string
): Promise<{ total: number } | null> {
  const category = slugToCategory(slug);
  if (!category) return null;
  const params = {
    search: "",
    category,
    location: "",
    minPrice: null,
    maxPrice: null,
  };
  if (kind === "service") {
    return { total: await prisma.service.count({ where: buildServiceWhere(params) }) };
  }
  return {
    total: await prisma.serviceRequest.count({ where: buildRequestWhere(params) }),
  };
}

export default async function CategoryBrowsePage({
  kind,
  slug,
}: {
  kind: ListingKind;
  slug: string;
}) {
  const base = kind === "service" ? "/services" : "/requests";
  if (isLegacyCategorySlug(slug)) {
    redirect(`${base}/categorie/${resolveCategorySlug(slug)}`);
  }
  if (!isValidCategorySlug(slug)) notFound();

  const counts = await countCategoryListings(kind, slug);
  const meta = getCategoryMeta(resolveCategorySlug(slug));
  if (!counts || !meta) notFound();

  const path = `${base}/categorie/${resolveCategorySlug(slug)}`;
  const { total } = counts;

  const countLabel =
    kind === "service"
      ? `(${total} annonce${total > 1 ? "s" : ""} disponible${total > 1 ? "s" : ""}).`
      : `(${total} demande${total > 1 ? "s" : ""} ouverte${total > 1 ? "s" : ""}).`;

  const explorer: ReactNode =
    kind === "service" ? (
      <PublicServicesExplorer
        lockedCategory={meta.name}
        listBasePath={path}
        title={`${meta.name} à Madagascar`}
        titleIconSlug={meta.slug}
      />
    ) : (
      <PublicRequestsExplorer
        lockedCategory={meta.name}
        listBasePath={path}
        title={`Demandes ${meta.name}`}
        titleIconSlug={meta.slug}
        subtitle={`Missions ${meta.name.toLowerCase()} publiées par des clients à Madagascar`}
      />
    );

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScripts
        paths={
          kind === "service"
            ? SEO_SCHEMA_PATHS.servicesCategory(slug)
            : SEO_SCHEMA_PATHS.requestsCategory(slug)
        }
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumbs
          items={[
            { name: "Accueil", path: "/" },
            {
              name: kind === "service" ? "Services" : "Demandes",
              path: base,
            },
            { name: meta.name, path },
          ]}
        />
        <p className="text-muted-foreground text-sm mb-4 max-w-2xl">
          {meta.description} {total > 0 && countLabel}
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
          </div>
        }
      >
        {explorer}
      </Suspense>
    </div>
  );
}
