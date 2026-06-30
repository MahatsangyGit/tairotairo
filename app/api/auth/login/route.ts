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

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe obligatoires" },
        { status: 400 }
      );
    }

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
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: LOGIN_FAILED_MESSAGE },
        { status: 401 }
      );
    }

    if (user.suspendedAt) {
      return NextResponse.json(
        { error: "Ce compte a été suspendu. Contactez le support." },
        { status: 403 }
      );
    }

    if (isLoginLocked(user.loginLockedAt)) {
      return NextResponse.json({ error: LOGIN_LOCKED_MESSAGE }, { status: 423 });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      const { locked } = await recordFailedLogin(user.id);

      if (locked) {
        return NextResponse.json({ error: LOGIN_LOCKED_MESSAGE }, { status: 423 });
      }

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
    });

    const { password: _, loginLockedAt: __, ...userWithoutPassword } = user;

    const response = NextResponse.json(
      { message: "Connexion réussie", user: userWithoutPassword },
      { status: 200 }
    );

    response.cookies.set(getAuthCookieName(), token, getAuthCookieOptions());

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
