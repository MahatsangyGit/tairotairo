import { NextRequest, NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";
import { logSecurityEventFromRequest } from "@/lib/security-audit";

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

function checkRateLimitMemory(
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

async function checkRateLimitRedis(
  key: string,
  config: RateLimitConfig
): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  const redis = getRedisClient();
  if (!redis) return checkRateLimitMemory(key, config);

  const windowSec = Math.ceil(config.windowMs / 1000);
  const redisKey = `ratelimit:${key}`;

  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, windowSec);
  }

  if (count > config.maxAttempts) {
    const ttl = await redis.ttl(redisKey);
    return { ok: false, retryAfter: Math.max(1, ttl) };
  }

  return { ok: true };
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  try {
    return await checkRateLimitRedis(key, config);
  } catch {
    return checkRateLimitMemory(key, config);
  }
}

/**
 * Client IP for rate limiting.
 * Only trusts X-Forwarded-For when TRUSTED_PROXY_COUNT is a positive integer
 * (number of trusted reverse-proxy hops from the right of the chain).
 */
export function getClientIp(req: NextRequest): string {
  const trustedProxyCount = parseInt(
    process.env.TRUSTED_PROXY_COUNT ?? "",
    10
  );

  if (Number.isFinite(trustedProxyCount) && trustedProxyCount > 0) {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      const parts = forwarded
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      const index = parts.length - 1 - trustedProxyCount;
      const candidate = parts[Math.max(0, index)];
      if (candidate) return candidate;
    }
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

export const AUTH_RATE_LIMITS = {
  login: { maxAttempts: 10, windowMs: 15 * 60 * 1000 },
  register: { maxAttempts: 5, windowMs: 60 * 60 * 1000 },
  forgotPassword: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  verifyOtp: { maxAttempts: 20, windowMs: 15 * 60 * 1000 },
  sendOtp: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  resetPassword: { maxAttempts: 10, windowMs: 15 * 60 * 1000 },
} as const satisfies Record<string, RateLimitConfig>;

export const API_RATE_LIMITS = {
  message: { maxAttempts: 60, windowMs: 60 * 1000 },
  upload: { maxAttempts: 20, windowMs: 15 * 60 * 1000 },
  adminExport: { maxAttempts: 10, windowMs: 15 * 60 * 1000 },
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

export type EnforceRateLimitOptions = {
  /** When set, also applies a user-scoped bucket (in addition to IP). */
  userId?: string;
};

export async function enforceRateLimit(
  req: NextRequest,
  scope: string,
  config: RateLimitConfig,
  options?: EnforceRateLimitOptions
): Promise<NextResponse | null> {
  const ip = getClientIp(req);
  const ipResult = await checkRateLimit(`${scope}:ip:${ip}`, config);

  if (!ipResult.ok) {
    logSecurityEventFromRequest("auth.rate_limited", req, {
      detail: scope,
      meta: { retryAfter: ipResult.retryAfter, key: "ip" },
    });
    return rateLimitResponse(ipResult.retryAfter);
  }

  if (options?.userId) {
    const userResult = await checkRateLimit(
      `${scope}:user:${options.userId}`,
      config
    );
    if (!userResult.ok) {
      logSecurityEventFromRequest("auth.rate_limited", req, {
        detail: scope,
        userId: options.userId,
        meta: { retryAfter: userResult.retryAfter, key: "user" },
      });
      return rateLimitResponse(userResult.retryAfter);
    }
  }

  return null;
}
