import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCronSecret } from "@/lib/cron-auth";
import { withApiHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

async function cleanupExpiredTokens() {
  const now = new Date();

  const [otp, resets] = await Promise.all([
    prisma.emailOtp.deleteMany({
      where: { expiresAt: { lt: now } },
    }),
    prisma.passwordResetToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }],
      },
    }),
  ]);

  return {
    deletedEmailOtps: otp.count,
    deletedPasswordResetTokens: resets.count,
  };
}

async function handle(req: NextRequest) {
  const auth = requireCronSecret(req);
  if (!auth.ok) return auth.response;

  const result = await cleanupExpiredTokens();

  return NextResponse.json({
    message: "Nettoyage des tokens terminé",
    ...result,
    ranAt: new Date().toISOString(),
  });
}

export const GET = withApiHandler("GET /api/cron/cleanup-tokens", handle);
export const POST = withApiHandler("POST /api/cron/cleanup-tokens", handle);
