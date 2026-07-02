import type { IncomingMessage, ServerResponse } from "http";

/**
 * CORS policy aligned with https://web.dev/articles/cross-origin-resource-sharing
 * — explicit origins (no wildcard with credentials), preflight caching, Vary: Origin.
 */

const ALLOWED_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
] as const;

const ALLOWED_REQUEST_HEADERS = [
  "Accept",
  "Accept-Language",
  "Authorization",
  "Content-Type",
  "X-CSRF-Token",
] as const;

const PREFLIGHT_MAX_AGE_SECONDS = 86_400;

let cachedAllowedOrigins: Set<string> | null = null;

function normalizeOrigin(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = trimmed.includes("://") ? new URL(trimmed) : new URL(`https://${trimmed}`);
    return url.origin;
  } catch {
    return null;
  }
}

export function getAllowedCorsOrigins(): string[] {
  return [...getAllowedCorsOriginSet()];
}

function getAllowedCorsOriginSet(): Set<string> {
  if (cachedAllowedOrigins) {
    return cachedAllowedOrigins;
  }

  const origins = new Set<string>();

  const appOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL ?? "");
  if (appOrigin) {
    origins.add(appOrigin);
  }

  const extra = process.env.CORS_ALLOWED_ORIGINS?.trim();
  if (extra) {
    for (const part of extra.split(",")) {
      const origin = normalizeOrigin(part);
      if (origin) origins.add(origin);
    }
  }

  cachedAllowedOrigins = origins;
  return origins;
}

/** @internal Test helper — clears memoized origin list. */
export function resetAllowedCorsOriginsCache(): void {
  cachedAllowedOrigins = null;
}

export function isAllowedCorsOrigin(origin: string): boolean {
  return getAllowedCorsOriginSet().has(origin);
}

function getRequestHeader(
  headers: IncomingMessage["headers"],
  name: string
): string | undefined {
  const value = headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildAllowHeaders(requested: string | undefined): string {
  if (!requested?.trim()) {
    return ALLOWED_REQUEST_HEADERS.join(", ");
  }

  const requestedNames = new Set(
    requested
      .split(",")
      .map((header) => header.trim().toLowerCase())
      .filter(Boolean)
  );

  const allowed = ALLOWED_REQUEST_HEADERS.filter((header) =>
    requestedNames.has(header.toLowerCase())
  );

  return allowed.length > 0
    ? allowed.join(", ")
    : ALLOWED_REQUEST_HEADERS.join(", ");
}

function isAllowedPreflightMethod(method: string | undefined): boolean {
  if (!method) return false;
  return ALLOWED_METHODS.includes(
    method.toUpperCase() as (typeof ALLOWED_METHODS)[number]
  );
}

export function buildCorsResponseHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

function buildPreflightHeaders(
  origin: string,
  accessControlRequestHeaders: string | undefined
): Record<string, string> {
  return {
    ...buildCorsResponseHeaders(origin),
    "Access-Control-Allow-Methods": ALLOWED_METHODS.join(", "),
    "Access-Control-Allow-Headers": buildAllowHeaders(
      accessControlRequestHeaders
    ),
    "Access-Control-Max-Age": String(PREFLIGHT_MAX_AGE_SECONDS),
  };
}

export type CorsNodeResolution =
  | { action: "none" }
  | { action: "continue"; headers: Record<string, string> }
  | { action: "preflight"; status: 204; headers: Record<string, string> }
  | { action: "forbidden"; status: 403 };

export function resolveCorsForNodeRequest(
  req: IncomingMessage
): CorsNodeResolution {
  const origin = getRequestHeader(req.headers, "origin");

  if (!origin) {
    return { action: "none" };
  }

  if (!isAllowedCorsOrigin(origin)) {
    if (req.method?.toUpperCase() === "OPTIONS") {
      return { action: "forbidden", status: 403 };
    }
    return { action: "none" };
  }

  if (req.method?.toUpperCase() === "OPTIONS") {
    const requestMethod = getRequestHeader(
      req.headers,
      "access-control-request-method"
    );

    if (!isAllowedPreflightMethod(requestMethod)) {
      return { action: "forbidden", status: 403 };
    }

    return {
      action: "preflight",
      status: 204,
      headers: buildPreflightHeaders(
        origin,
        getRequestHeader(req.headers, "access-control-request-headers")
      ),
    };
  }

  return {
    action: "continue",
    headers: buildCorsResponseHeaders(origin),
  };
}

export function writeCorsOnlyResponse(
  res: ServerResponse,
  status: number,
  headers: Record<string, string>
): void {
  res.writeHead(status, headers);
  res.end();
}

export function attachCorsHeadersOnResponse(
  res: ServerResponse,
  corsHeaders: Record<string, string>
): void {
  if (Object.keys(corsHeaders).length === 0) return;

  const originalWriteHead = res.writeHead.bind(res);
  res.writeHead = function writeHeadWithCors(
    statusCode: number,
    ...args: unknown[]
  ) {
    for (const [key, value] of Object.entries(corsHeaders)) {
      if (!res.hasHeader(key)) {
        res.setHeader(key, value);
      }
    }

    return (originalWriteHead as (...a: unknown[]) => ServerResponse)(
      statusCode,
      ...args
    );
  };

  const originalEnd = res.end.bind(res);
  res.end = function endWithCors(...args: unknown[]) {
    for (const [key, value] of Object.entries(corsHeaders)) {
      if (!res.hasHeader(key)) {
        res.setHeader(key, value);
      }
    }

    return originalEnd(...(args as Parameters<typeof res.end>));
  };
}
