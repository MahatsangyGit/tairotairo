import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import {
  applyCspToResponse,
  buildContentSecurityPolicy,
  createCspRequestHeaders,
} from "@/lib/security-headers";
import {
  guestBrowseIntentFromPath,
  isGuestBrowsePath,
} from "@/lib/guest-browse";
import { getJwtSecret } from "@/lib/jwt-secret";
import {
  getLearningHost,
  getRentalHost,
  isLearningEnabled,
  isRentalEnabled,
  resolveVerticalFromHost,
} from "@/lib/origins";

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(getJwtSecret());
}

async function verifyAuthToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
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

function stripPort(host: string): string {
  return host.split(":")[0]!.toLowerCase();
}

/**
 * Host-based routing for ecosystem subdomains.
 * Rewrites ampindramo.* → /ampindramo/… and ampianaro.* → /ampianaro/…
 * On the main host in production, public /ampindramo|/ampianaro paths redirect
 * to the dedicated subdomain when configured.
 */
function resolveHostRouting(
  request: NextRequest,
  pathname: string
): NextResponse | null {
  const hostHeader = request.headers.get("host");
  const vertical = resolveVerticalFromHost(hostHeader);
  const rentalHost = getRentalHost();
  const learningHost = getLearningHost();

  if (vertical === "rental" && isRentalEnabled()) {
    if (
      pathname === "/ampindramo" ||
      pathname.startsWith("/ampindramo/")
    ) {
      return null;
    }
    if (
      pathname.startsWith("/api") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/seo")
    ) {
      return null;
    }
    const target =
      pathname === "/"
        ? "/ampindramo"
        : `/ampindramo${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
    const url = request.nextUrl.clone();
    url.pathname = target;
    return NextResponse.rewrite(url);
  }

  if (vertical === "learning" && isLearningEnabled()) {
    if (
      pathname === "/ampianaro" ||
      pathname.startsWith("/ampianaro/")
    ) {
      return null;
    }
    if (
      pathname.startsWith("/api") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/seo")
    ) {
      return null;
    }
    const target =
      pathname === "/"
        ? "/ampianaro"
        : `/ampianaro${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
    const url = request.nextUrl.clone();
    url.pathname = target;
    return NextResponse.rewrite(url);
  }

  // Canonical redirects from main host → dedicated subdomains (production only)
  if (
    process.env.NODE_ENV === "production" &&
    vertical === "marketplace"
  ) {
    if (
      rentalHost &&
      isRentalEnabled() &&
      (pathname === "/ampindramo" || pathname.startsWith("/ampindramo/"))
    ) {
      const suffix =
        pathname === "/ampindramo" ? "/" : pathname.slice("/ampindramo".length);
      const dest = new URL(
        `https://${stripPort(rentalHost)}${suffix === "" ? "/" : suffix}`
      );
      dest.search = request.nextUrl.search;
      return NextResponse.redirect(dest, 308);
    }
    if (
      learningHost &&
      isLearningEnabled() &&
      (pathname === "/ampianaro" || pathname.startsWith("/ampianaro/"))
    ) {
      const suffix =
        pathname === "/ampianaro" ? "/" : pathname.slice("/ampianaro".length);
      const dest = new URL(
        `https://${stripPort(learningHost)}${suffix === "" ? "/" : suffix}`
      );
      dest.search = request.nextUrl.search;
      return NextResponse.redirect(dest, 308);
    }
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildContentSecurityPolicy(nonce);
  const { pathname } = request.nextUrl;

  const hostRouted = resolveHostRouting(request, pathname);
  if (hostRouted) {
    return finalizeResponse(hostRouted, csp, nonce);
  }

  if (isGuestBrowsePath(pathname)) {
    const token = request.cookies.get("token")?.value;
    const user = token ? await verifyAuthToken(token) : null;

    if (!user) {
      const home = new URL("/", request.url);
      home.searchParams.set("join", guestBrowseIntentFromPath(pathname));
      return finalizeResponse(NextResponse.redirect(home), csp, nonce);
    }
  }

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
