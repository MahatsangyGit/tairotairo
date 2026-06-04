import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { APP_URL, sendPasswordResetEmail } from "@/lib/email";
import {
  canRequestPasswordReset,
  generatePasswordResetToken,
  getPasswordResetCooldownSeconds,
  getPasswordResetExpiry,
} from "@/lib/password-reset";

const GENERIC_MESSAGE =
  "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Adresse email invalide" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, name: true, email: true },
    });

    if (user) {
      const lastToken = await prisma.passwordResetToken.findFirst({
        where: { userId: user.id, usedAt: null },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

      if (!canRequestPasswordReset(lastToken?.createdAt ?? null)) {
        return NextResponse.json(
          {
            error: "Veuillez patienter avant de renvoyer un email",
            retryAfter: getPasswordResetCooldownSeconds(lastToken!.createdAt),
          },
          { status: 429 }
        );
      }

      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });

      const { raw, hash } = generatePasswordResetToken();

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hash,
          expiresAt: getPasswordResetExpiry(),
        },
      });

      const resetUrl = `${APP_URL}/auth/reset-password?token=${encodeURIComponent(raw)}`;
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("[POST /api/auth/forgot-password]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
