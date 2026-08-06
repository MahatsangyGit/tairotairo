function readEnvUrl(key: "NEXT_PUBLIC_CDN_URL" | "NEXT_PUBLIC_APP_URL"): string {
  return process.env[key]?.replace(/\/$/, "") ?? "";
}

function hostnameFromRaw(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const value = raw.includes("://") ? raw : `https://${raw}`;
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isLocalHostname(hostname: string | null): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function isVercelHostname(hostname: string | null): boolean {
  return Boolean(hostname?.endsWith(".vercel.app"));
}

function isLocalAppUrl(): boolean {
  const appUrl = readEnvUrl("NEXT_PUBLIC_APP_URL");
  if (!appUrl) return process.env.NODE_ENV !== "production";
  return isLocalHostname(hostnameFromRaw(appUrl));
}

/**
 * CDN actif uniquement en production réelle (domaine custom).
 * Désactivé sur localhost, preview Vercel, et hébergements *.vercel.app :
 * les chunks hashés n'existent que sur le déploiement courant, pas sur le CDN prod.
 *
 * Critère : `NEXT_PUBLIC_APP_URL` (pas `VERCEL_URL`, toujours en *.vercel.app).
 */
export function isCdnEnabled(): boolean {
  const cdnUrl = readEnvUrl("NEXT_PUBLIC_CDN_URL");
  if (!cdnUrl) return false;
  if (process.env.NODE_ENV !== "production") return false;
  if (process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "development") {
    return false;
  }

  const appHost = hostnameFromRaw(readEnvUrl("NEXT_PUBLIC_APP_URL"));
  if (!appHost || isLocalHostname(appHost) || isVercelHostname(appHost)) {
    return false;
  }

  return true;
}

export function getCdnUrl(): string {
  return readEnvUrl("NEXT_PUBLIC_CDN_URL");
}

export function getAppUrl(): string {
  return readEnvUrl("NEXT_PUBLIC_APP_URL");
}

export function getAssetPrefix(): string | undefined {
  return isCdnEnabled() ? getCdnUrl() : undefined;
}

/** Préfixe un chemin same-origin avec l'origine CDN (production uniquement). */
export function cdnPath(path: string): string {
  if (!path.startsWith("/") || !isCdnEnabled()) {
    return path;
  }
  return `${getCdnUrl()}${path}`;
}

/** URL absolue pour SEO, emails et partage. */
export function absoluteAssetUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const origin = isCdnEnabled() ? getCdnUrl() : getAppUrl();
  if (!origin) return normalized;
  return `${origin}${normalized}`;
}

function hostnameFromEnvUrl(raw: string | undefined): string | null {
  return hostnameFromRaw(raw);
}

/** Patterns pour `images.remotePatterns` dans next.config. */
export function getImageRemotePatterns(): Array<{
  protocol: "http" | "https";
  hostname: string;
  port?: string;
  pathname: string;
}> {
  const seen = new Set<string>();
  const patterns: Array<{
    protocol: "http" | "https";
    hostname: string;
    port?: string;
    pathname: string;
  }> = [];

  const sources = [
    readEnvUrl("NEXT_PUBLIC_APP_URL"),
    readEnvUrl("NEXT_PUBLIC_CDN_URL"),
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];

  for (const raw of sources) {
    if (!raw) continue;
    try {
      const url = new URL(raw);
      const key = `${url.protocol}//${url.hostname}:${url.port || "default"}`;
      if (seen.has(key)) continue;
      seen.add(key);

      patterns.push({
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        ...(url.port ? { port: url.port } : {}),
        pathname: "/**",
      });
    } catch {
      /* ignore invalid URL */
    }
  }

  return patterns;
}

export function getConfiguredImageHosts(): string[] {
  return [
    hostnameFromEnvUrl(readEnvUrl("NEXT_PUBLIC_APP_URL")),
    // N'exposer le host CDN aux images/CSP que s'il est réellement actif.
    isCdnEnabled() ? hostnameFromEnvUrl(readEnvUrl("NEXT_PUBLIC_CDN_URL")) : null,
  ].filter((h): h is string => h != null);
}

export function shouldUseLocalImages(): boolean {
  return isLocalAppUrl() || !isCdnEnabled();
}
