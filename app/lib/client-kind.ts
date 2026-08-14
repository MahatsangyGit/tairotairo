export const CLIENT_KINDS = ["INDIVIDUAL", "PROFESSIONAL"] as const;

export type ClientKindValue = (typeof CLIENT_KINDS)[number];

export function parseClientKind(value: unknown): ClientKindValue {
  return value === "PROFESSIONAL" ? "PROFESSIONAL" : "INDIVIDUAL";
}

export function isProfessionalClient(
  user:
    | {
        role?: string | null;
        clientKind?: string | null;
      }
    | null
    | undefined
): boolean {
  if (!user) return false;
  return user.role === "CLIENT" && user.clientKind === "PROFESSIONAL";
}
