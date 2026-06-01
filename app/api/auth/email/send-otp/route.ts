import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";
import {
  generateOtpCode,
  getOtpExpiry,
  hashOtpCode,
  canResendOtp,
  getResendCooldownSeconds,
} from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);

    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, name: true, email: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
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
  } catch (error) {
    console.error("[POST /api/auth/email/send-otp]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
