import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { verifyOtpCode, MAX_OTP_ATTEMPTS, OTP_LOCKED_MESSAGE } from "@/lib/otp";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
  AUTH_RATE_LIMITS,
} from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);

    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(
      `verify-otp:${ip}:${auth.userId}`,
      AUTH_RATE_LIMITS.verifyOtp
    );
    if (!rateLimit.ok) {
      return rateLimitResponse(rateLimit.retryAfter);
    }

    const { code } = await req.json();

    if (!code || String(code).trim().length !== 6) {
      return NextResponse.json(
        { error: "Code à 6 chiffres requis" },
        { status: 400 }
      );
    }

    const otp = await prisma.emailOtp.findFirst({
      where: {
        userId: auth.userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json(
        { error: "Code expiré ou introuvable. Demandez un nouveau code." },
        { status: 400 }
      );
    }

    const valid = await verifyOtpCode(String(code).trim(), otp.codeHash);

    if (!valid) {
      const nextAttempts = otp.failedAttempts + 1;

      if (nextAttempts >= MAX_OTP_ATTEMPTS) {
        await prisma.emailOtp.delete({ where: { id: otp.id } });
        return NextResponse.json({ error: OTP_LOCKED_MESSAGE }, { status: 429 });
      }

      await prisma.emailOtp.update({
        where: { id: otp.id },
        data: { failedAttempts: nextAttempts },
      });

      return NextResponse.json({ error: "Code incorrect" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: auth.userId },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      }),
      prisma.emailOtp.deleteMany({ where: { userId: auth.userId } }),
    ]);

    return NextResponse.json({
      message: "Email vérifié avec succès",
      emailVerified: true,
    });
  } catch (error) {
    console.error("[POST /api/auth/email/verify-otp]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
