import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, JwtPayload } from "@/lib/jwt";

export const getAuthUser = (req: NextRequest): JwtPayload | null => {
  const token = req.cookies.get("token")?.value;

  if (!token) return null;

  return verifyToken(token);
};

/** Verifies JWT and rejects suspended accounts. */
export async function requireAuth(
  req: NextRequest
): Promise<JwtPayload | null> {
  const user = getAuthUser(req);
  if (!user) return null;

  const record = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { suspendedAt: true },
  });

  if (!record || record.suspendedAt) {
    return null;
  }

  return user;
}
