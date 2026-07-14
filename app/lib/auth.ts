import { NextRequest } from "next/server";
import { JwtPayload } from "@/lib/jwt";
import { resolveActiveAuth } from "@/lib/active-session";
import { throwForbidden, throwUnauthorized } from "@/lib/api-handler";

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
