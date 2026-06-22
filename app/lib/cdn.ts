function readEnvUrl(key: "NEXT_PUBLIC_CDN_URL" | "NEXT_PUBLIC_APP_URL"): string {
  return process.env[key]?.replace(/\/$/, "") ?? "";
}

function isLocalAppUrl(): boolean {
  const appUrl = readEnvUrl("NEXT_PUBLIC_APP_URL");
  if (!appUrl) return process.env.NODE_ENV !== "production";
  try {
    const host = new URL(appUrl).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return process.env.NODE_ENV !== "production";
  }
}

/** CDN actif uniquement en production (évite les URLs CDN en dev local). */
export function isCdnEnabled(): boolean {
  if (!readEnvUrl("NEXT_PUBLIC_CDN_URL")) return false;
  if (process.env.NODE_ENV !== "production") return false;
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
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
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
    hostnameFromEnvUrl(readEnvUrl("NEXT_PUBLIC_CDN_URL")),
  ].filter((h): h is string => h != null);
}

export function shouldUseLocalImages(): boolean {
  return isLocalAppUrl() || !isCdnEnabled();
}
