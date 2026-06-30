import { getConfiguredImageHosts, getCdnUrl } from "./cdn";

const isProduction = process.env.NODE_ENV === "production";
const isDev = process.env.NODE_ENV === "development";

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
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (turnstileSiteKey) {
    origins.add("https://challenges.cloudflare.com");
  }

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

/** CSP with per-request nonce (set via proxy.ts). */
export function buildContentSecurityPolicy(nonce: string): string {
  const trustedOrigins = collectTrustedOrigins();
  const originList = trustedOrigins.join(" ");

  const scriptSrc = `'self' 'nonce-${nonce}' 'strict-dynamic'${
    isDev ? " 'unsafe-eval'" : ""
  }${originList ? ` ${originList}` : ""}`;

  const styleSrc = isDev
    ? `'self' 'unsafe-inline'${originList ? ` ${originList}` : ""}`
    : `'self' 'nonce-${nonce}'${originList ? ` ${originList}` : ""}`;

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
    `frame-src 'self'${originList ? ` ${originList}` : ""}`,
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

/** Security headers without CSP (CSP is applied per-request in proxy.ts). */
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
  ];

  if (isProduction) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return headers;
}

export function applyCspToResponse(
  response: Response,
  csp: string,
  nonce: string
): void {
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("x-nonce", nonce);
}

export function createCspRequestHeaders(
  request: Request,
  csp: string,
  nonce: string
): Headers {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  return requestHeaders;
}
