import type { MetadataRoute } from "next";
import { getSitemapEntries, getStaticSitemapPaths } from "@/lib/sitemap-data";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = getStaticSitemapPaths();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: siteUrl(path),
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : path.includes("/categorie/") ? 0.85 : 0.8,
  }));

  try {
    const { services, requests, providers } = await getSitemapEntries();

    const dynamicEntries: MetadataRoute.Sitemap = [
      ...services.map((s) => ({
        url: siteUrl(`/services/${s.id}`),
        lastModified: s.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...requests.map((r) => ({
        url: siteUrl(`/requests/${r.id}`),
        lastModified: r.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...providers.map((p) => ({
        url: siteUrl(`/providers/${p.id}`),
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      })),
    ];

    return [...staticEntries, ...dynamicEntries];
  } catch {
    return staticEntries;
  }
}
