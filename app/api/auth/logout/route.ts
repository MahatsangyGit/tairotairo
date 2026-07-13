import { NextResponse } from "next/server";
import { requireAuthOrThrow } from "@/lib/auth";
import { getAuthCookieName, getAuthCookieOptions } from "@/lib/auth-cookie";
import {
  generateCsrfToken,
  getCsrfCookieName,
  getCsrfCookieOptions,
} from "@/lib/csrf";
import { logSecurityEventFromRequest } from "@/lib/security-audit";
import { bumpTokenVersion } from "@/lib/token-version";
import { withApiHandler } from "@/lib/api-handler";

export const POST = withApiHandler("POST /api/auth/logout", async (req) => {
  const auth = await requireAuthOrThrow(req);

  await bumpTokenVersion(auth.userId);

  logSecurityEventFromRequest("auth.logout", req, { userId: auth.userId });

  const response = NextResponse.json({ message: "Déconnexion réussie" });

  response.cookies.set(getAuthCookieName(), "", getAuthCookieOptions(0));
  response.cookies.set(getCsrfCookieName(), "", getCsrfCookieOptions(0));

  const freshCsrf = generateCsrfToken();
  response.cookies.set(getCsrfCookieName(), freshCsrf, getCsrfCookieOptions());

  return response;
});
