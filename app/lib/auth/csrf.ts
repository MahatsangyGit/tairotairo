import crypto from "crypto";

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Auth routes that establish a session or are unauthenticated entry points. */
const CSRF_EXEMPT_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/csrf",
  "/api/cron/",
];

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function getCsrfCookieName(): typeof CSRF_COOKIE_NAME {
  return CSRF_COOKIE_NAME;
}

export function getCsrfCookieOptions(maxAge = CSRF_MAX_AGE_SECONDS) {
  const domain = process.env.AUTH_COOKIE_DOMAIN?.trim() || undefined;
  return {
    httpOnly: false as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    ...(domain ? { domain } : {}),
  };
}

export function isCsrfExemptPath(pathname: string): boolean {
  return CSRF_EXEMPT_PATHS.some((prefix) => pathname.startsWith(prefix));
}

export function shouldEnforceCsrf(method: string, pathname: string): boolean {
  if (!MUTATING_METHODS.has(method.toUpperCase())) {
    return false;
  }

  if (!pathname.startsWith("/api")) {
    return false;
  }

  return !isCsrfExemptPath(pathname);
}

export function csrfTokensMatch(
  cookieToken: string | undefined,
  headerToken: string | undefined
): boolean {
  if (!cookieToken || !headerToken) {
    return false;
  }

  if (cookieToken.length !== headerToken.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  );
}
