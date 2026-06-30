import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getAuthCookieName, getAuthCookieOptions } from "@/lib/auth-cookie";
import {
  generateCsrfToken,
  getCsrfCookieName,
  getCsrfCookieOptions,
} from "@/lib/csrf";
import { logSecurityEventFromRequest } from "@/lib/security-audit";
import { bumpTokenVersion } from "@/lib/token-version";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);

  if (!auth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  await bumpTokenVersion(auth.userId);

  logSecurityEventFromRequest("auth.logout", req, { userId: auth.userId });

  const response = NextResponse.json({ message: "Déconnexion réussie" });

  response.cookies.set(getAuthCookieName(), "", getAuthCookieOptions(0));
  response.cookies.set(getCsrfCookieName(), "", getCsrfCookieOptions(0));

  const freshCsrf = generateCsrfToken();
  response.cookies.set(getCsrfCookieName(), freshCsrf, getCsrfCookieOptions());

  return response;
}
