import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, JwtPayload } from "@/lib/jwt";

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
