import { NextRequest, NextResponse } from "next/server";
import {
  generateCsrfToken,
  getCsrfCookieName,
  getCsrfCookieOptions,
} from "@/lib/csrf";

export async function GET(_req: NextRequest) {
  const csrfToken = generateCsrfToken();
  const response = NextResponse.json({ csrfToken });

  response.cookies.set(
    getCsrfCookieName(),
    csrfToken,
    getCsrfCookieOptions()
  );

  return response;
}
