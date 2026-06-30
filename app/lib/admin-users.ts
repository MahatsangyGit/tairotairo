import prisma from "@/lib/prisma";
import type { Role } from "@/generated/prisma/client";
import { disableProviderHomepageSpotlight } from "@/lib/provider-spotlight";
import { bumpTokenVersion } from "@/lib/token-version";
import { logSecurityEvent } from "@/lib/security-audit";

const ROLES: Role[] = ["CLIENT", "PROVIDER", "ADMIN"];

export function isValidRole(role: string): role is Role {
  return ROLES.includes(role as Role);
}

export async function countAdmins(): Promise<number> {
  return prisma.user.count({
    where: { role: "ADMIN", suspendedAt: null },
  });
}

export async function suspendUser(
  targetId: string,
  adminId: string
): Promise<{ ok: true; message: string } | { ok: false; error: string; status: number }> {
  if (targetId === adminId) {
    return { ok: false, error: "Vous ne pouvez pas suspendre votre propre compte", status: 400 };
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true, suspendedAt: true },
  });

  if (!target) {
    return { ok: false, error: "Utilisateur introuvable", status: 404 };
  }

  if (target.suspendedAt) {
    return { ok: false, error: "Ce compte est déjà suspendu", status: 400 };
  }

  if (target.role === "ADMIN") {
    const admins = await countAdmins();
    if (admins <= 1) {
      return {
        ok: false,
        error: "Impossible de suspendre le dernier administrateur actif",
        status: 400,
      };
    }
  }

  await prisma.user.update({
    where: { id: targetId },
    data: { suspendedAt: new Date() },
  });

  await bumpTokenVersion(targetId);

  logSecurityEvent({
    event: "admin.user_suspended",
    userId: targetId,
    meta: { adminId },
  });

  if (target.role === "PROVIDER") {
    await disableProviderHomepageSpotlight(targetId);
  }

  return { ok: true, message: "Compte suspendu" };
}

export async function unsuspendUser(
  targetId: string
): Promise<{ ok: true; message: string } | { ok: false; error: string; status: number }> {
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { suspendedAt: true },
  });

  if (!target) {
    return { ok: false, error: "Utilisateur introuvable", status: 404 };
  }

  if (!target.suspendedAt) {
    return { ok: false, error: "Ce compte n'est pas suspendu", status: 400 };
  }

  await prisma.user.update({
    where: { id: targetId },
    data: { suspendedAt: null },
  });

  logSecurityEvent({
    event: "admin.user_unsuspended",
    userId: targetId,
  });

  return { ok: true, message: "Compte réactivé" };
}

export async function setUserRole(
  targetId: string,
  adminId: string,
  role: Role
): Promise<{ ok: true; message: string; role: Role } | { ok: false; error: string; status: number }> {
  if (targetId === adminId) {
    return { ok: false, error: "Vous ne pouvez pas modifier votre propre rôle", status: 400 };
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true, suspendedAt: true },
  });

  if (!target) {
    return { ok: false, error: "Utilisateur introuvable", status: 404 };
  }

  if (target.role === role) {
    return { ok: false, error: "L'utilisateur a déjà ce rôle", status: 400 };
  }

  if (target.role === "ADMIN" && role !== "ADMIN") {
    const admins = await countAdmins();
    if (admins <= 1) {
      return {
        ok: false,
        error: "Impossible de retirer le rôle du dernier administrateur actif",
        status: 400,
      };
    }
  }

  await prisma.user.update({
    where: { id: targetId },
    data: { role },
  });

  if (target.role === "PROVIDER" && role !== "PROVIDER") {
    await disableProviderHomepageSpotlight(targetId);
  }

  const roleLabel =
    role === "CLIENT" ? "client" : role === "PROVIDER" ? "prestataire" : "administrateur";

  return {
    ok: true,
    message: `Rôle mis à jour : ${roleLabel}`,
    role,
  };
}
