import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  applyCspToResponse,
  buildContentSecurityPolicy,
  createCspRequestHeaders,
} from "@/lib/security-headers";

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

function getSecretKey(): Uint8Array | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function verifyAuthToken(token: string): Promise<TokenPayload | null> {
  const secretKey = getSecretKey();
  if (!secretKey) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey);
    const { userId, email, role } = payload;

    if (
      typeof userId !== "string" ||
      typeof email !== "string" ||
      typeof role !== "string"
    ) {
      return null;
    }

    return { userId, email, role };
  } catch {
    return null;
  }
}

function loginRedirect(request: NextRequest, pathname: string) {
  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

function finalizeResponse(
  response: NextResponse,
  csp: string,
  nonce: string
): NextResponse {
  applyCspToResponse(response, csp, nonce);
  return response;
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildContentSecurityPolicy(nonce);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return finalizeResponse(loginRedirect(request, pathname), csp, nonce);
    }

    const user = await verifyAuthToken(token);

    if (!user) {
      const response = loginRedirect(request, pathname);
      response.cookies.delete("token");
      return finalizeResponse(response, csp, nonce);
    }

    if (
      pathname.startsWith("/dashboard/client") &&
      user.role !== "CLIENT" &&
      user.role !== "ADMIN"
    ) {
      return finalizeResponse(
        NextResponse.redirect(new URL("/dashboard/provider", request.url)),
        csp,
        nonce
      );
    }

    if (
      pathname.startsWith("/dashboard/provider") &&
      user.role !== "PROVIDER" &&
      user.role !== "ADMIN"
    ) {
      return finalizeResponse(
        NextResponse.redirect(new URL("/dashboard/client", request.url)),
        csp,
        nonce
      );
    }

    if (pathname.startsWith("/dashboard/admin") && user.role !== "ADMIN") {
      return finalizeResponse(
        NextResponse.redirect(new URL("/dashboard/client", request.url)),
        csp,
        nonce
      );
    }
  }

  const requestHeaders = createCspRequestHeaders(request, csp, nonce);
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  return finalizeResponse(response, csp, nonce);
}

export const config = {
  matcher: [
    {
      source: "/((?!api|seo|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
