/**
 * Turnstile on/off — shared by client forms and server verification.
 * Set NEXT_PUBLIC_TURNSTILE_SKIP_IN_DEV=true in .env while using Cursor Design
 * (embedded Electron browser cannot load Cloudflare Turnstile).
 */
export function isTurnstileSkippedInDev(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_TURNSTILE_SKIP_IN_DEV === "true"
  );
}

export function isTurnstileClientEnabled(): boolean {
  if (isTurnstileSkippedInDev()) return false;
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());
}

export function isTurnstileServerEnabled(): boolean {
  if (isTurnstileSkippedInDev()) return false;
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
  );
}
