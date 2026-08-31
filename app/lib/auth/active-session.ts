import prisma from "@/lib/prisma";
import { verifyToken, type JwtPayload } from "@/lib/jwt";

/**
 * Validates a JWT and ensures the session is still active in DB
 * (tokenVersion match + not suspended). Uses a transaction-local
 * bypass so it can run before request RLS context is established,
 * without importing the RLS ALS helpers (avoids circular deps).
 */
export async function resolveActiveAuth(
  token: string | null | undefined
): Promise<JwtPayload | null> {
  if (!token) return null;

  const auth = await verifyToken(token);
  if (!auth) return null;

  const record = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.bypass_rls', 'true', true)`;
    return tx.user.findUnique({
      where: { id: auth.userId },
      select: { suspendedAt: true, tokenVersion: true, role: true },
    });
  });

  if (
    !record ||
    record.suspendedAt ||
    record.tokenVersion !== auth.tokenVersion
  ) {
    return null;
  }

  return {
    userId: auth.userId,
    email: auth.email,
    role: record.role,
    tokenVersion: auth.tokenVersion,
  };
}
