import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";
import {
  generateOtpCode,
  getOtpExpiry,
  hashOtpCode,
  canResendOtp,
  getResendCooldownSeconds,
} from "@/lib/otp";
import { withApiHandler, throwNotFound } from "@/lib/api-handler";
import { enforceRateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";

export const POST = withApiHandler("POST /api/auth/email/send-otp", async (req) => {
  const auth = await requireAuthOrThrow(req);

  const rateLimited = await enforceRateLimit(
    req,
    "send-otp",
    AUTH_RATE_LIMITS.sendOtp,
    { userId: auth.userId }
  );
  if (rateLimited) return rateLimited;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, name: true, email: true, emailVerified: true },
  });

  if (!user) {
    throwNotFound("Utilisateur introuvable");
  }

  if (user.emailVerified) {
    return NextResponse.json(
      { error: "Votre email est déjà vérifié" },
      { status: 400 }
    );
  }

  const lastOtp = await prisma.emailOtp.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (!canResendOtp(lastOtp?.createdAt ?? null)) {
    return NextResponse.json(
      {
        error: "Veuillez patienter avant de renvoyer un code",
        retryAfter: getResendCooldownSeconds(lastOtp!.createdAt),
      },
      { status: 429 }
    );
  }

  await prisma.emailOtp.deleteMany({ where: { userId: user.id } });

  const code = generateOtpCode();
  const codeHash = await hashOtpCode(code);

  await prisma.emailOtp.create({
    data: {
      userId: user.id,
      codeHash,
      expiresAt: getOtpExpiry(),
    },
  });

  await sendOtpEmail(user.email, user.name, code);

  return NextResponse.json({
    message: "Code envoyé par email",
    expiresInMinutes: 10,
  });
});
