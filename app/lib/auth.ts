import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, JwtPayload } from "@/lib/jwt";
import { throwForbidden, throwUnauthorized } from "@/lib/api-handler";

export async function getAuthUser(req: NextRequest): Promise<JwtPayload | null> {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Verifies JWT, token version, and rejects suspended accounts. */
export async function requireAuth(
  req: NextRequest
): Promise<JwtPayload | null> {
  const user = await getAuthUser(req);
  if (!user) return null;

  const record = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { suspendedAt: true, tokenVersion: true },
  });

  if (
    !record ||
    record.suspendedAt ||
    record.tokenVersion !== user.tokenVersion
  ) {
    return null;
  }

  return user;
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
