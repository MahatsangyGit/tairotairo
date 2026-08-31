import { NextRequest } from "next/server";
import { JwtPayload } from "@/lib/jwt";
import { resolveActiveAuth } from "@/lib/active-session";
import {
  throwForbidden,
  throwUnauthorized,
  throwUnlessOk,
} from "@/lib/api-handler";
import { assertEmailVerified } from "@/lib/email-verification";

export async function getAuthUser(req: NextRequest): Promise<JwtPayload | null> {
  const token = req.cookies.get("token")?.value;
  return resolveActiveAuth(token);
}

/** Verifies JWT, token version, and rejects suspended accounts. */
export async function requireAuth(
  req: NextRequest
): Promise<JwtPayload | null> {
  return getAuthUser(req);
}

/** Like requireAuth, but throws AppError 401 when unauthenticated. */
export async function requireAuthOrThrow(
  req: NextRequest,
  message = "Non autorisé"
): Promise<JwtPayload> {
  const user = await requireAuth(req);
  if (!user) throwUnauthorized(message);
  return user;
}

/** Throws AppError 403 unless the user has one of the allowed roles. */
export function requireRole(
  user: JwtPayload,
  roles: string | string[],
  message = "Accès refusé"
): void {
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(user.role)) {
    throwForbidden(message);
  }
}

export async function requireEmailVerified(user: JwtPayload): Promise<void> {
  throwUnlessOk(await assertEmailVerified(user.userId, user.role));
}

/** Auth + email vérifié (ADMIN déjà exempté dans assertEmailVerified). */
export async function requireVerifiedUser(
  req: NextRequest
): Promise<JwtPayload> {
  const user = await requireAuthOrThrow(req);
  await requireEmailVerified(user);
  return user;
}

export async function requireClient(
  req: NextRequest,
  options?: { verified?: boolean; message?: string }
): Promise<JwtPayload> {
  const user = await requireAuthOrThrow(req);
  requireRole(
    user,
    ["CLIENT", "ADMIN"],
    options?.message ?? "Réservé aux clients"
  );
  if (options?.verified) await requireEmailVerified(user);
  return user;
}

export async function requireProvider(
  req: NextRequest,
  options?: { verified?: boolean; allowAdmin?: boolean; message?: string }
): Promise<JwtPayload> {
  const user = await requireAuthOrThrow(req);
  const roles = options?.allowAdmin ? ["PROVIDER", "ADMIN"] : "PROVIDER";
  requireRole(
    user,
    roles,
    options?.message ?? "Réservé aux prestataires"
  );
  if (options?.verified) await requireEmailVerified(user);
  return user;
}
