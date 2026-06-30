import prisma from "@/lib/prisma";
import { MAX_FAILED_LOGIN_ATTEMPTS } from "@/lib/login-lockout";
import { logSecurityEvent } from "@/lib/security-audit";

export async function unlockUserLogin(
  targetId: string
): Promise<{ ok: true; message: string } | { ok: false; error: string; status: number }> {
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, loginLockedAt: true, failedLoginAttempts: true },
  });

  if (!target) {
    return { ok: false, error: "Utilisateur introuvable", status: 404 };
  }

  if (!target.loginLockedAt && target.failedLoginAttempts === 0) {
    return { ok: false, error: "Ce compte n'est pas verrouillé", status: 400 };
  }

  await prisma.user.update({
    where: { id: targetId },
    data: {
      loginLockedAt: null,
      failedLoginAttempts: 0,
    },
  });

  logSecurityEvent({
    event: "admin.login_unlocked",
    userId: targetId,
  });

  return { ok: true, message: "Connexion débloquée" };
}

export async function recordFailedLogin(userId: string): Promise<{
  locked: boolean;
  attempts: number;
}> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: { increment: 1 },
    },
    select: { failedLoginAttempts: true },
  });

  const locked = user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;

  if (locked) {
    await prisma.user.update({
      where: { id: userId },
      data: { loginLockedAt: new Date() },
    });
  }

  return { locked, attempts: user.failedLoginAttempts };
}

export async function resetLoginAttempts(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      loginLockedAt: null,
    },
  });
}
