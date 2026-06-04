import type { Role } from "@/generated/prisma/client";

/** Rôles autorisés à l'inscription publique (pas ADMIN). */
export const PUBLIC_REGISTRATION_ROLES = ["CLIENT", "PROVIDER"] as const satisfies readonly Role[];

export type PublicRegistrationRole = (typeof PUBLIC_REGISTRATION_ROLES)[number];

/**
 * Normalise le rôle demandé à l'inscription.
 * Toute valeur autre que PROVIDER (ex. ADMIN) est rejetée → CLIENT.
 */
export function parsePublicRegistrationRole(value: unknown): PublicRegistrationRole {
  return value === "PROVIDER" ? "PROVIDER" : "CLIENT";
}
