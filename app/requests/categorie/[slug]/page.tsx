import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import JsonLdScripts from "@/components/seo/JsonLdScripts";
import PublicRequestsExplorer from "@/components/search/PublicRequestsExplorer";
import {
  CATEGORY_META,
  getCategoryMeta,
  isLegacyCategorySlug,
  isValidCategorySlug,
  resolveCategorySlug,
  slugToCategory,
} from "@/lib/categories";
import prisma from "@/lib/prisma";
import { buildRequestWhere } from "@/lib/advanced-search";
import {
  categoryRequestsMetadata,
} from "@/lib/seo";
import { SEO_SCHEMA_PATHS } from "@/lib/seo-schema-routes";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return CATEGORY_META.map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const meta = getCategoryMeta(slug);
  if (!meta) return { title: "Catégorie introuvable" };

  return categoryRequestsMetadata(meta.name, meta.description, meta.slug);
}

async function loadCategoryItems(slug: string) {
  const category = slugToCategory(slug);
  if (!category) return null;

  const where = buildRequestWhere({ search: "", category, location: "", minPrice: null, maxPrice: null });

  const [requests, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: { id: true, title: true },
    }),
    prisma.serviceRequest.count({ where }),
  ]);

  return { category, requests, total, meta: getCategoryMeta(resolveCategorySlug(slug))! };
}

export default async function RequestsCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  if (isLegacyCategorySlug(slug)) {
    redirect(`/requests/categorie/${resolveCategorySlug(slug)}`);
  }
  if (!isValidCategorySlug(slug)) notFound();

  const data = await loadCategoryItems(slug);
  if (!data) notFound();

  const { meta, requests, total } = data;
  const path = `/requests/categorie/${resolveCategorySlug(slug)}`;

  return (
    <div className="min-h-screen bg-background">
      <JsonLdScripts paths={SEO_SCHEMA_PATHS.requestsCategory(slug)} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumbs
          items={[
            { name: "Accueil", path: "/" },
            { name: "Demandes", path: "/requests" },
            { name: meta.name, path },
          ]}
        />
        <p className="text-muted-foreground text-sm mb-4 max-w-2xl">
          {meta.description}{" "}
          {total > 0 &&
            `(${total} demande${total > 1 ? "s" : ""} ouverte${total > 1 ? "s" : ""}).`}
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
          </div>
        }
      >
        <PublicRequestsExplorer
          lockedCategory={meta.name}
          listBasePath={path}
          title={`Demandes ${meta.name}`}
          titleIconSlug={meta.slug}
          subtitle={`Missions ${meta.name.toLowerCase()} publiées par des clients à Madagascar`}
        />
      </Suspense>
    </div>
  );
}
