/** Pages auth où aucune query/hash ne doit être envoyée à l'analytics. */
export const ANALYTICS_SENSITIVE_PATHS = [
  "/auth/reset-password",
  "/auth/forgot-password",
] as const;

export function isAnalyticsSensitivePath(pathname: string): boolean {
  return ANALYTICS_SENSITIVE_PATHS.some((prefix) => pathname.startsWith(prefix));
}

/** URL de pageview sans query ni fragment (évite fuite de tokens). */
export function buildSafePageViewUrl(pathname: string): string {
  if (typeof window === "undefined") {
    return pathname;
  }
  return `${window.location.origin}${pathname}`;
}
