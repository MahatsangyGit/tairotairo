import prisma from "@/lib/prisma";

export type ContactViewer = {
  userId: string;
  role: string;
};

/** Téléphone client visible : propriétaire, admin, ou prestataire ayant déjà proposé. */
export async function canViewRequestClientPhone(
  requestId: string,
  clientId: string,
  viewer: ContactViewer | null
): Promise<boolean> {
  if (!viewer) return false;
  if (viewer.role === "ADMIN") return true;
  if (viewer.userId === clientId) return true;

  if (viewer.role === "PROVIDER") {
    const response = await prisma.requestResponse.findUnique({
      where: {
        requestId_providerId: { requestId, providerId: viewer.userId },
      },
      select: { id: true },
    });
    return Boolean(response);
  }

  return false;
}

export function stripPhone<T extends { phone?: string | null }>(
  entity: T
): Omit<T, "phone"> {
  const { phone: _phone, ...rest } = entity;
  return rest;
}
