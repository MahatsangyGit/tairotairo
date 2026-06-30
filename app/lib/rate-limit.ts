import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredBuckets(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return { ok: true };
  }

  if (bucket.count >= config.maxAttempts) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true };
}

export const AUTH_RATE_LIMITS = {
  login: { maxAttempts: 10, windowMs: 15 * 60 * 1000 },
  register: { maxAttempts: 5, windowMs: 60 * 60 * 1000 },
  forgotPassword: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  verifyOtp: { maxAttempts: 20, windowMs: 15 * 60 * 1000 },
} as const satisfies Record<string, RateLimitConfig>;

export function rateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    {
      error: "Trop de tentatives. Réessayez plus tard.",
      retryAfter,
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    }
  );
}

export function enforceRateLimit(
  req: NextRequest,
  scope: string,
  config: RateLimitConfig
): NextResponse | null {
  const ip = getClientIp(req);
  const result = checkRateLimit(`${scope}:${ip}`, config);

  if (!result.ok) {
    return rateLimitResponse(result.retryAfter);
  }

  return null;
}
