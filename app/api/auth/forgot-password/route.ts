import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { APP_URL, sendPasswordResetEmail } from "@/lib/email";
import {
  canRequestPasswordReset,
  generatePasswordResetToken,
  getPasswordResetCooldownSeconds,
  getPasswordResetExpiry,
} from "@/lib/password-reset";
import { enforceRateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";
import {
  forgotPasswordSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";
import { verifyTurnstileToken } from "@/lib/turnstile";

const GENERIC_MESSAGE =
  "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.";

export async function POST(req: NextRequest) {
  try {
    const rateLimited = enforceRateLimit(
      req,
      "forgot-password",
      AUTH_RATE_LIMITS.forgotPassword
    );
    if (rateLimited) return rateLimited;

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(forgotPasswordSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const { email, turnstileToken } = parsed.data;
    const turnstile = await verifyTurnstileToken(
      req,
      turnstileToken,
      "forgot_password"
    );
    if (!turnstile.ok) {
      return NextResponse.json({ error: turnstile.error }, { status: 400 });
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

      const resetUrl = `${APP_URL}/auth/reset-password#token=${encodeURIComponent(raw)}`;
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
