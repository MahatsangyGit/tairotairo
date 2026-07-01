import type { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { isTurnstileServerEnabled } from "@/lib/turnstile-config";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_TOKEN_MAX_LENGTH = 2048;

interface TurnstileSiteverifyResponse {
  success: boolean;
  "error-codes"?: string[];
  action?: string;
  hostname?: string;
}

function getExpectedHostname(): string | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return null;
  try {
    return new URL(appUrl).hostname;
  } catch {
    return null;
  }
}

function getTurnstileSecret(): string {
  return process.env.TURNSTILE_SECRET_KEY?.trim() ?? "";
}

export function isTurnstileEnabled(): boolean {
  return isTurnstileServerEnabled();
}

export function getTurnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
}

function getRemoteIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("cf-connecting-ip");
  if (forwarded) return forwarded.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (!xff) return null;
  const first = xff.split(",")[0]?.trim();
  return first || null;
}

export async function verifyTurnstileToken(
  req: NextRequest,
  token: string | undefined,
  expectedAction: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isTurnstileEnabled()) return { ok: true };

  const normalizedToken = token?.trim() ?? "";
  if (!normalizedToken) {
    return { ok: false, error: "Vérification anti-bot requise." };
  }

  if (normalizedToken.length > TURNSTILE_TOKEN_MAX_LENGTH) {
    return { ok: false, error: "Jeton Turnstile invalide." };
  }

  const formData = new FormData();
  formData.append("secret", getTurnstileSecret());
  formData.append("response", normalizedToken);
  const remoteIp = getRemoteIp(req);
  if (remoteIp) formData.append("remoteip", remoteIp);
  formData.append("idempotency_key", randomUUID());

  let result: TurnstileSiteverifyResponse;
  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: formData,
    });
    result = (await res.json()) as TurnstileSiteverifyResponse;
  } catch {
    return { ok: false, error: "Impossible de vérifier le captcha. Réessayez." };
  }

  if (!result.success) {
    return { ok: false, error: "Vérification anti-bot échouée. Réessayez." };
  }

  if (result.action && result.action !== expectedAction) {
    return { ok: false, error: "Captcha invalide pour cette action." };
  }

  const expectedHostname = getExpectedHostname();
  if (expectedHostname && result.hostname && result.hostname !== expectedHostname) {
    return { ok: false, error: "Captcha invalide pour ce domaine." };
  }

  return { ok: true };
}
