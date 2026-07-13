import { NextResponse } from "next/server";
import {
  generateCsrfToken,
  getCsrfCookieName,
  getCsrfCookieOptions,
} from "@/lib/csrf";
import { withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler("GET /api/auth/csrf", async () => {
  const csrfToken = generateCsrfToken();
  const response = NextResponse.json({ csrfToken });

  response.cookies.set(
    getCsrfCookieName(),
    csrfToken,
    getCsrfCookieOptions()
  );

  return response;
});
