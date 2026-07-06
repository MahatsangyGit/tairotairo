import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getBcryptRounds } from "@/lib/env";
import { hashPasswordResetToken } from "@/lib/password-reset";
import { logSecurityEventFromRequest } from "@/lib/security-audit";
import {
  parseBody,
  parseJsonBody,
  resetPasswordSchema,
} from "@/lib/api-schemas";

export async function POST(req: NextRequest) {
  try {
    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(resetPasswordSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const { token, password } = parsed.data;

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

    const hashedPassword = await bcrypt.hash(password, getBcryptRounds());

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: {
          password: hashedPassword,
          tokenVersion: { increment: 1 },
        },
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

    logSecurityEventFromRequest("auth.password_reset", req, {
      userId: resetRecord.userId,
    });

    return NextResponse.json({
      message: "Mot de passe mis à jour. Vous pouvez vous connecter.",
    });
  } catch (error) {
    console.error("[POST /api/auth/reset-password]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
