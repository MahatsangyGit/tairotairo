import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { getAuthCookieName } from "@/lib/auth-cookie";
import type { AuthUser } from "@/lib/auth-user";
import { rlsContextFromAuth, runWithRls } from "@/lib/rls";

/**
 * Résout l'utilisateur courant depuis le cookie JWT (SSR).
 * Utilisé pour hydrater AuthProvider sans mismatch client/serveur.
 */
export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  try {
    const token = (await cookies()).get(getAuthCookieName())?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    // Pose le contexte RLS avant la lecture Prisma (requis hors server.ts / Vercel).
    return runWithRls(rlsContextFromAuth(payload), async () => {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          suspendedAt: true,
          tokenVersion: true,
        },
      });

      if (
        !user ||
        user.suspendedAt ||
        user.tokenVersion !== payload.tokenVersion
      ) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as AuthUser["role"],
        avatar: user.avatar,
      };
    });
  } catch {
    return null;
  }
}
