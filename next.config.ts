import type { NextConfig } from "next";
import {
  CATEGORY_META,
  LEGACY_CATEGORY_NAMES,
  LEGACY_CATEGORY_SLUGS,
} from "./app/lib/categories";
import { getAssetPrefix, getImageRemotePatterns } from "./app/lib/cdn";
import { CACHE_CONTROL } from "./app/lib/cache";
import {
  getPostHogAssetsHost,
  POSTHOG_API_HOST,
} from "./app/lib/posthog";
import { getSecurityHeaders } from "./app/lib/security-headers";

const legacyNameRedirects = Object.entries(LEGACY_CATEGORY_NAMES).flatMap(
  ([legacyName, canonical]) => {
    const meta = CATEGORY_META.find((cat) => cat.name === canonical);
    if (!meta) return [];

    return [
      {
        source: "/services",
        has: [{ type: "query" as const, key: "category", value: legacyName }],
        destination: `/services/categorie/${meta.slug}`,
        permanent: true,
      },
      {
        source: "/requests",
        has: [{ type: "query" as const, key: "category", value: legacyName }],
        destination: `/requests/categorie/${meta.slug}`,
        permanent: true,
      },
    ];
  }
);

const legacySlugRedirects = Object.entries(LEGACY_CATEGORY_SLUGS).flatMap(
  ([legacySlug, resolvedSlug]) => [
    {
      source: `/services/categorie/${legacySlug}`,
      destination: `/services/categorie/${resolvedSlug}`,
      permanent: true,
    },
    {
      source: `/requests/categorie/${legacySlug}`,
      destination: `/requests/categorie/${resolvedSlug}`,
      permanent: true,
    },
  ]
);

const categoryRedirects = [
  ...legacyNameRedirects,
  ...legacySlugRedirects,
  ...CATEGORY_META.flatMap((cat) => [
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
  ]),
];

const posthogAssetsHost = getPostHogAssetsHost(POSTHOG_API_HOST);
const assetPrefix = getAssetPrefix();
const imageRemotePatterns = getImageRemotePatterns();

/** Routes API images — sans `search` pour autoriser `?v=` si besoin. */
const imageLocalPatterns = [
  { pathname: "/api/**" },
];

const nextConfig: NextConfig = {
  assetPrefix,
  compress: true,
  poweredByHeader: false,
  skipTrailingSlashRedirect: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    localPatterns: imageLocalPatterns,
    remotePatterns: imageRemotePatterns,
  },
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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: getSecurityHeaders(),
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: CACHE_CONTROL.STATIC_IMMUTABLE },
        ],
      },
      {
        source: "/_next/image",
        headers: [
          { key: "Cache-Control", value: CACHE_CONTROL.IMAGE_LONG },
        ],
      },
      {
        source: "/api/services/:id/cover",
        headers: [
          { key: "Cache-Control", value: CACHE_CONTROL.IMAGE_LONG },
        ],
      },
      {
        source: "/api/requests/:id/cover",
        headers: [
          { key: "Cache-Control", value: CACHE_CONTROL.IMAGE_LONG },
        ],
      },
      {
        source: "/api/users/:id/avatar",
        headers: [
          { key: "Cache-Control", value: CACHE_CONTROL.IMAGE_LONG },
        ],
      },
      {
        source: "/api/provider/portfolio/:id/image",
        headers: [
          { key: "Cache-Control", value: CACHE_CONTROL.IMAGE_LONG },
        ],
      },
    ];
  },
};

export default nextConfig;
