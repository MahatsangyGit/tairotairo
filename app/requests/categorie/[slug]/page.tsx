import type { Metadata } from "next";
import CategoryBrowsePage from "@/components/search/CategoryBrowsePage";
import {
  CATEGORY_META,
  getCategoryMeta,
} from "@/lib/categories";
import { categoryRequestsMetadata } from "@/lib/seo";

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

export default async function RequestsCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  return <CategoryBrowsePage kind="request" slug={slug} />;
}
