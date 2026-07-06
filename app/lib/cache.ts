import { NextResponse } from "next/server";

/** Durées de revalidation ISR pour les pages publiques (secondes). */
export const PAGE_REVALIDATE_SECONDS = {
  HOME: 120,
  PROVIDERS: 300,
  SERVICES: 120,
  REQUESTS: 120,
  CATEGORY: 120,
  PROVIDER_PROFILE: 300,
} as const;

export const CACHE_CONTROL = {
  STATIC_IMMUTABLE: "public, max-age=31536000, immutable",
  IMAGE_LONG: "public, max-age=86400, stale-while-revalidate=604800",
  IMAGE_IMMUTABLE: "public, max-age=31536000, immutable",
  API_PUBLIC: "public, s-maxage=60, stale-while-revalidate=300",
  PRIVATE_NO_STORE: "private, no-store",
} as const;

export function imageCacheControl(versioned: boolean): string {
  return versioned ? CACHE_CONTROL.IMAGE_IMMUTABLE : CACHE_CONTROL.IMAGE_LONG;
}

export function imageResponseHeaders(
  mime: string,
  options?: { versioned?: boolean; etag?: string }
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": mime,
    "Cache-Control": imageCacheControl(!!options?.versioned),
  };
  if (options?.etag) {
    headers.ETag = options.etag;
  }
  return headers;
}

export function jsonWithPublicCache<T>(data: T, maxAgeSeconds = 60): NextResponse {
  const swr = maxAgeSeconds * 5;
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": `public, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${swr}`,
    },
  });
}
