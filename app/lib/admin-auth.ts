import { NextRequest } from "next/server";
import { requireAuthOrThrow, requireRole } from "@/lib/auth";
import type { JwtPayload } from "@/lib/jwt";

/** Requires an authenticated ADMIN; throws AppError 401/403 otherwise. */
export async function requireAdmin(req: NextRequest): Promise<JwtPayload> {
  const auth = await requireAuthOrThrow(req);
  requireRole(auth, "ADMIN", "Accès réservé aux administrateurs");
  return auth;
}
