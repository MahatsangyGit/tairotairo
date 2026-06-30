import { getConfiguredImageHosts, getCdnUrl } from "./cdn";

const isProduction = process.env.NODE_ENV === "production";

function hostToOrigin(host: string): string | null {
  if (!host) return null;
  if (host.startsWith("http://") || host.startsWith("https://")) {
    try {
      return new URL(host).origin;
    } catch {
      return null;
    }
  }
  return `https://${host}`;
}

function collectTrustedOrigins(): string[] {
  const origins = new Set<string>();

  for (const host of getConfiguredImageHosts()) {
    const origin = hostToOrigin(host);
    if (origin) origins.add(origin);
  }

  const cdnUrl = getCdnUrl();
  if (cdnUrl) {
    try {
      origins.add(new URL(cdnUrl).origin);
    } catch {
      /* ignore invalid CDN URL */
    }
  }

  const posthogUi = process.env.NEXT_PUBLIC_POSTHOG_UI_HOST;
  if (posthogUi) {
    try {
      origins.add(new URL(posthogUi).origin);
    } catch {
      /* ignore invalid PostHog UI URL */
    }
  }

  return [...origins];
}

function buildContentSecurityPolicy(): string {
  const trustedOrigins = collectTrustedOrigins();
  const originList = trustedOrigins.join(" ");

  const scriptSrc = isProduction
    ? `'self' 'unsafe-inline'${originList ? ` ${originList}` : ""}`
    : `'self' 'unsafe-inline' 'unsafe-eval'${originList ? ` ${originList}` : ""}`;

  const styleSrc = `'self' 'unsafe-inline'${originList ? ` ${originList}` : ""}`;
  const imgSrc = `'self' data: blob:${originList ? ` ${originList}` : ""}`;
  const fontSrc = `'self' data:${originList ? ` ${originList}` : ""}`;
  const connectSrc = `'self' ws: wss:${originList ? ` ${originList}` : ""}`;

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    `img-src ${imgSrc}`,
    `font-src ${fontSrc}`,
    `connect-src ${connectSrc}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];

  if (isProduction) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

/** Standard HTTP security headers applied to every response. */
export function getSecurityHeaders(): Array<{ key: string; value: string }> {
  const headers: Array<{ key: string; value: string }> = [
    { key: "X-DNS-Prefetch-Control", value: "on" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value:
        "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=()",
    },
    { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
  ];

  if (isProduction) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return headers;
}
