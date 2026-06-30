import prisma from "@/lib/prisma";

export const EMAIL_VERIFICATION_REQUIRED_MESSAGE =
  "Vérifiez votre adresse email depuis votre profil avant cette action.";

export async function assertEmailVerified(
  userId: string,
  role: string
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if (role === "ADMIN") {
    return { ok: true };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });

  if (!user?.emailVerified) {
    return {
      ok: false,
      error: EMAIL_VERIFICATION_REQUIRED_MESSAGE,
      status: 403,
    };
  }

  return { ok: true };
}
