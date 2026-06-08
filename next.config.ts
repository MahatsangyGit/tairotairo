import type { NextConfig } from "next";
import { CATEGORY_META } from "./app/lib/categories";

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

const nextConfig: NextConfig = {
  async redirects() {
    return categoryRedirects;
  },
};

export default nextConfig;
