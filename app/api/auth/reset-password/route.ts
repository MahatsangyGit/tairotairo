import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { hashPasswordResetToken } from "@/lib/password-reset";
import { validatePassword } from "@/lib/password-policy";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password =
      typeof body.password === "string" ? body.password : "";

    if (!token) {
      return NextResponse.json(
        { error: "Lien de réinitialisation invalide" },
        { status: 400 }
      );
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.ok) {
      return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
    }

    const tokenHash = hashPasswordResetToken(token);

    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, userId: true },
    });

    if (!resetRecord) {
      return NextResponse.json(
        {
          error:
            "Ce lien est invalide ou a expiré. Demandez un nouvel email de réinitialisation.",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: resetRecord.userId,
          usedAt: null,
          id: { not: resetRecord.id },
        },
      }),
    ]);

    return NextResponse.json({
      message: "Mot de passe mis à jour. Vous pouvez vous connecter.",
    });
  } catch (error) {
    console.error("[POST /api/auth/reset-password]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
