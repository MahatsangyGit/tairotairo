import { AsyncLocalStorage } from "node:async_hooks";
import type { NextRequest } from "next/server";
import type { PoolClient } from "pg";
import type { JwtPayload } from "@/lib/jwt";
import { verifyToken } from "@/lib/jwt";

export type RlsContext =
  | { mode: "anonymous" }
  | { mode: "user"; userId: string; role: string }
  | { mode: "bypass" };

const rlsStorage = new AsyncLocalStorage<RlsContext>();

export const ANONYMOUS_RLS: RlsContext = { mode: "anonymous" };
export const BYPASS_RLS: RlsContext = { mode: "bypass" };

export function getRlsContext(): RlsContext {
  return rlsStorage.getStore() ?? ANONYMOUS_RLS;
}

export function rlsContextFromAuth(auth: JwtPayload | null): RlsContext {
  if (!auth) return ANONYMOUS_RLS;
  return { mode: "user", userId: auth.userId, role: auth.role };
}

export function runWithRls<T>(ctx: RlsContext, fn: () => Promise<T>): Promise<T> {
  return rlsStorage.run(ctx, fn);
}

export function withRequestRls<T>(
  req: NextRequest,
  fn: () => Promise<T>
): Promise<T> {
  const token = req.cookies.get("token")?.value;
  const auth = token ? verifyToken(token) : null;
  return runWithRls(rlsContextFromAuth(auth), fn);
}

export function withBypassRls<T>(fn: () => Promise<T>): Promise<T> {
  return runWithRls(BYPASS_RLS, fn);
}

export function withAnonymousRls<T>(fn: () => Promise<T>): Promise<T> {
  return runWithRls(ANONYMOUS_RLS, fn);
}

const AUTH_BYPASS_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/email/send-otp",
  "/api/auth/email/verify-otp",
];

function parseCookieHeader(header: string | undefined): Record<string, string> {
  if (!header) return {};

  return Object.fromEntries(
    header.split(";").map((part) => {
      const trimmed = part.trim();
      const eq = trimmed.indexOf("=");
      if (eq === -1) return [trimmed, ""];
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      try {
        return [key, decodeURIComponent(value)];
      } catch {
        return [key, value];
      }
    })
  );
}

/** Resolves RLS context from an incoming HTTP request (used by custom server). */
export function resolveRlsContextFromRequest(
  url: string | undefined,
  cookieHeader: string | undefined
): RlsContext {
  const pathname = (() => {
    try {
      return new URL(url ?? "/", "http://localhost").pathname;
    } catch {
      return url ?? "/";
    }
  })();

  if (pathname.startsWith("/api/cron/")) {
    return BYPASS_RLS;
  }

  if (AUTH_BYPASS_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return BYPASS_RLS;
  }

  const token = parseCookieHeader(cookieHeader).token;
  if (!token) return ANONYMOUS_RLS;

  return rlsContextFromAuth(verifyToken(token));
}

/** Applies session variables on a pooled pg client before each query. */
export async function applyRlsToPgClient(client: PoolClient): Promise<void> {
  try {
    const ctx = getRlsContext();

    if (ctx.mode === "bypass") {
      await client.query(
        `SELECT set_config('app.bypass_rls', 'true', false),
                set_config('app.user_id', '', false),
                set_config('app.user_role', '', false)`
      );
      return;
    }

    if (ctx.mode === "anonymous") {
      await client.query(
        `SELECT set_config('app.bypass_rls', 'false', false),
                set_config('app.user_id', '', false),
                set_config('app.user_role', '', false)`
      );
      return;
    }

    await client.query(
      `SELECT set_config('app.bypass_rls', 'false', false),
              set_config('app.user_id', $1, false),
              set_config('app.user_role', $2, false)`,
      [ctx.userId, ctx.role]
    );
  } catch (error) {
    console.error("[RLS] Impossible d'appliquer le contexte sur la connexion pg:", error);
    throw error;
  }
}
