import prisma from "@/lib/prisma";

export async function bumpTokenVersion(userId: string): Promise<number> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
    select: { tokenVersion: true },
  });
  return user.tokenVersion;
}
