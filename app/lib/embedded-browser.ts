/**
 * Embedded IDE browsers (Cursor Simple Browser, VS Code preview, Electron shells)
 * use Chromium without a full browser fingerprint. Cloudflare Turnstile often
 * refuses to load its iframe in these environments (error 200500 / bot checks).
 */
export function isEmbeddedIdeBrowser(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent;
  if (/Electron/i.test(ua)) return true;
  if (/\b(Cursor|Code)\//i.test(ua)) return true;

  return false;
}
