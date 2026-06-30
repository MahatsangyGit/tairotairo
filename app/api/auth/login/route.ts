import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { PostHogEvents } from "@/lib/posthog";
import { captureServerEvent } from "@/lib/posthog-server";
import {
  isLoginLocked,
  LOGIN_FAILED_MESSAGE,
  LOGIN_LOCKED_MESSAGE,
} from "@/lib/login-lockout";
import {
  recordFailedLogin,
  resetLoginAttempts,
} from "@/lib/login-lockout-admin";
import { getAuthCookieName, getAuthCookieOptions } from "@/lib/auth-cookie";
import {
  generateCsrfToken,
  getCsrfCookieName,
  getCsrfCookieOptions,
} from "@/lib/csrf";
import { enforceRateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";
import { logSecurityEventFromRequest } from "@/lib/security-audit";
import { loginSchema, parseBody, parseJsonBody } from "@/lib/api-schemas";

export async function POST(req: NextRequest) {
  try {
    const rateLimited = enforceRateLimit(req, "login", AUTH_RATE_LIMITS.login);
    if (rateLimited) return rateLimited;

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(loginSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        phone: true,
        avatar: true,
        suspendedAt: true,
        loginLockedAt: true,
        tokenVersion: true,
      },
    });

    if (!user) {
      logSecurityEventFromRequest("auth.login_failed", req, { email });
      return NextResponse.json(
        { error: LOGIN_FAILED_MESSAGE },
        { status: 401 }
      );
    }

    if (user.suspendedAt) {
      logSecurityEventFromRequest("auth.login_failed", req, {
        userId: user.id,
        email,
        detail: "suspended",
      });
      return NextResponse.json(
        { error: LOGIN_FAILED_MESSAGE },
        { status: 401 }
      );
    }

    if (isLoginLocked(user.loginLockedAt)) {
      return NextResponse.json({ error: LOGIN_LOCKED_MESSAGE }, { status: 423 });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      const { locked } = await recordFailedLogin(user.id);

      if (locked) {
        logSecurityEventFromRequest("auth.login_locked", req, {
          userId: user.id,
          email,
        });
        return NextResponse.json({ error: LOGIN_LOCKED_MESSAGE }, { status: 423 });
      }

      logSecurityEventFromRequest("auth.login_failed", req, {
        userId: user.id,
        email,
      });
      return NextResponse.json(
        { error: LOGIN_FAILED_MESSAGE },
        { status: 401 }
      );
    }

    await resetLoginAttempts(user.id);

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    const { password: _, loginLockedAt: __, ...userWithoutPassword } = user;

    const response = NextResponse.json(
      { message: "Connexion réussie", user: userWithoutPassword },
      { status: 200 }
    );

    response.cookies.set(getAuthCookieName(), token, getAuthCookieOptions());

    const csrfToken = generateCsrfToken();
    response.cookies.set(getCsrfCookieName(), csrfToken, getCsrfCookieOptions());

    logSecurityEventFromRequest("auth.login_success", req, {
      userId: user.id,
      email: user.email,
    });
    void captureServerEvent(user.id, PostHogEvents.USER_LOGGED_IN, {
      role: user.role,
    }).catch(console.error);

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
