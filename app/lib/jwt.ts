import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/jwt-secret";

const JWT_EXPIRES_IN = "7d";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, getJwtSecret()) as JwtPayload;
  } catch {
    return null;
  }
}