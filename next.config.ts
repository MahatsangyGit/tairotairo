import type { NextConfig } from "next";
import { CATEGORY_META } from "./app/lib/categories";
import {
  getPostHogAssetsHost,
  POSTHOG_API_HOST,
} from "./app/lib/posthog";

const categoryRedirects = CATEGORY_META.flatMap((cat) => [
  {
    source: "/services",
    has: [{ type: "query" as const, key: "category", value: cat.name }],
    destination: `/services/categorie/${cat.slug}`,
    permanent: true,
  },
  {
    source: "/requests",
    has: [{ type: "query" as const, key: "category", value: cat.name }],
    destination: `/requests/categorie/${cat.slug}`,
    permanent: true,
  },
]);

const posthogAssetsHost = getPostHogAssetsHost(POSTHOG_API_HOST);

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  async redirects() {
    return categoryRedirects;
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: `${posthogAssetsHost}/static/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${POSTHOG_API_HOST}/:path*`,
      },
    ];
  },
};

export default nextConfig;
