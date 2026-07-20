import type { RentalStatus } from "@/generated/prisma/client";

export type RentalActor = "renter" | "owner" | "admin";

/**
 * Machine à états location.
 * Transitions autorisées par acteur — toute autre combinaison est rejetée.
 */
const TRANSITIONS: Record<
  RentalStatus,
  Partial<Record<RentalStatus, RentalActor[]>>
> = {
  REQUESTED: {
    ACCEPTED: ["owner", "admin"],
    CANCELLED: ["renter", "owner", "admin"],
  },
  ACCEPTED: {
    PAID: ["renter", "admin"], // via pay endpoint; status set by payment
    CANCELLED: ["renter", "owner", "admin"],
  },
  PAID: {
    ONGOING: ["owner", "admin"],
    CANCELLED: ["admin"],
    DISPUTED: ["renter", "owner", "admin"],
  },
  ONGOING: {
    RETURN_PENDING: ["renter", "owner", "admin"],
    DISPUTED: ["renter", "owner", "admin"],
  },
  RETURN_PENDING: {
    COMPLETED: ["owner", "admin"],
    DISPUTED: ["renter", "owner", "admin"],
  },
  DISPUTED: {
    COMPLETED: ["admin"],
    CANCELLED: ["admin"],
  },
  COMPLETED: {},
  CANCELLED: {},
};

export function canTransitionRental(
  from: RentalStatus,
  to: RentalStatus,
  actor: RentalActor
): boolean {
  const allowed = TRANSITIONS[from]?.[to];
  if (!allowed) return false;
  return allowed.includes(actor);
}

export function rentalActorForUser(params: {
  userId: string;
  role: string;
  renterId: string;
  ownerId: string;
}): RentalActor | null {
  if (params.role === "ADMIN") return "admin";
  if (params.userId === params.ownerId) return "owner";
  if (params.userId === params.renterId) return "renter";
  return null;
}

/** Statuts qui bloquent le calendrier (chevauchement). */
export const ACTIVE_RENTAL_STATUSES: RentalStatus[] = [
  "REQUESTED",
  "ACCEPTED",
  "PAID",
  "ONGOING",
  "RETURN_PENDING",
  "DISPUTED",
];

export function computeRentalTotalAmount(
  dailyPrice: number,
  startDate: Date,
  endDate: Date
): number {
  const ms = endDate.getTime() - startDate.getTime();
  const days = Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  return Math.round(dailyPrice * days);
}

export function parseRentalDate(value: string | number | Date): Date | null {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}
