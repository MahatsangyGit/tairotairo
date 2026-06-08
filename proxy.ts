import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";

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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return loginRedirect(request, pathname);
  }

  const user = await verifyAuthToken(token);

  if (!user) {
    const response = loginRedirect(request, pathname);
    response.cookies.delete("token");
    return response;
  }

  if (
    pathname.startsWith("/dashboard/client") &&
    user.role !== "CLIENT" &&
    user.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/dashboard/provider", request.url));
  }

  if (
    pathname.startsWith("/dashboard/provider") &&
    user.role !== "PROVIDER" &&
    user.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/dashboard/client", request.url));
  }

  if (pathname.startsWith("/dashboard/admin") && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/client", request.url));
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { suspendedAt: true },
  });

  if (dbUser?.suspendedAt) {
    const response = NextResponse.redirect(
      new URL("/auth/login?suspended=1", request.url)
    );
    response.cookies.delete("token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
