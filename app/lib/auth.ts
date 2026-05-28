import { NextRequest } from "next/server";
import { verifyToken, JwtPayload } from "@/lib/jwt";

export const getAuthUser = (req: NextRequest): JwtPayload | null => {
  const token = req.cookies.get("token")?.value;

  if (!token) return null;

  return verifyToken(token);
};

export const requireAuth = (req: NextRequest): JwtPayload | null => {
  const user = getAuthUser(req);
  return user;
}