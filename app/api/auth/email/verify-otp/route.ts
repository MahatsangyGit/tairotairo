import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { verifyOtpCode } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);

    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
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
