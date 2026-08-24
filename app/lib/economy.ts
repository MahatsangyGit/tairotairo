import {
  normalizeCategoryName,
  SERVICE_CATEGORIES,
  type ServiceCategory,
} from "@/lib/categories";
import { isProfessionalClient } from "@/lib/client-kind";
import type { BookingDisplaySnapshot } from "@/lib/booking-display";

/** Commission services, prélevée sur le prestataire (client paie le prix affiché). */
export const SERVICE_COMMISSION_RATES: Record<ServiceCategory, number> = {
  Plomberie: 0.1,
  Mécanique: 0.1,
  Électricité: 0.1,
  Jardinage: 0.1,
  Agriculture: 0.1,
  Ménage: 0.1,
  Informatique: 0.25,
  Cuisine: 0.15,
  Transport: 0.25,
  Irakiraka: 0.1,
  Evénementiel: 0.25,
  Animaux: 0.25,
  Bricolage: 0.1,
  BTP: 0.1,
  Déménagement: 0.2,
  Arts: 0.25,
  Couture: 0.1,
  Musiques: 0.25,
};

export const DEFAULT_SERVICE_COMMISSION_RATE = 0.1;

export const RENTAL_PARTICULAR_COMMISSION_RATE = 0.13;

export const RENTAL_PRO_TIER_LOW_MAX = 25_000;
export const RENTAL_PRO_TIER_MID_MAX = 45_000;
export const RENTAL_PRO_RATE_LOW = 0.3;
export const RENTAL_PRO_RATE_MID = 0.2;
export const RENTAL_PRO_RATE_HIGH = 0.15;

export const RENTAL_PRO_TIERS = [
  {
    rate: RENTAL_PRO_RATE_LOW,
    label: "jusqu'à 25 000 Ar (total location)",
    matches: (total: number) => total <= RENTAL_PRO_TIER_LOW_MAX,
  },
  {
    rate: RENTAL_PRO_RATE_MID,
    label: "de 25 001 Ar à 45 000 Ar",
    matches: (total: number) =>
      total > RENTAL_PRO_TIER_LOW_MAX && total <= RENTAL_PRO_TIER_MID_MAX,
  },
  {
    rate: RENTAL_PRO_RATE_HIGH,
    label: "au-delà de 45 000 Ar",
    matches: (total: number) => total > RENTAL_PRO_TIER_MID_MAX,
  },
] as const;

export type CommissionSplit = {
  rate: number;
  gross: number;
  commissionAmount: number;
  net: number;
};

export function serviceCommissionRate(category: string): number {
  const normalized = normalizeCategoryName(category);
  if (!normalized) return DEFAULT_SERVICE_COMMISSION_RATE;
  return SERVICE_COMMISSION_RATES[normalized];
}

export function splitAmount(gross: number, rate: number): CommissionSplit {
  const safeGross = Number.isFinite(gross) ? gross : 0;
  const safeRate = Number.isFinite(rate) ? rate : 0;
  const commissionAmount = safeGross * safeRate;
  return {
    rate: safeRate,
    gross: safeGross,
    commissionAmount,
    net: safeGross - commissionAmount,
  };
}

export function withServiceCommission(
  snapshot: BookingDisplaySnapshot,
  frozenRate?: number | null
): BookingDisplaySnapshot & {
  commissionRate: number;
  commissionAmount: number;
} {
  const split = splitAmount(
    snapshot.displayPrice,
    frozenRate ?? serviceCommissionRate(snapshot.displayCategory)
  );
  return {
    ...snapshot,
    commissionRate: split.rate,
    commissionAmount: split.commissionAmount,
  };
}

export function professionalRentalCommissionRate(totalAmount: number): number {
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) return 0;
  if (totalAmount <= RENTAL_PRO_TIER_LOW_MAX) return RENTAL_PRO_RATE_LOW;
  if (totalAmount <= RENTAL_PRO_TIER_MID_MAX) return RENTAL_PRO_RATE_MID;
  return RENTAL_PRO_RATE_HIGH;
}

export function rentalCommissionRate(input: {
  isPlatformOwned: boolean;
  ownerIsProfessionalClient: boolean;
  totalAmount: number;
}): number {
  if (input.isPlatformOwned) return 0;
  if (input.ownerIsProfessionalClient) {
    return professionalRentalCommissionRate(input.totalAmount);
  }
  return RENTAL_PARTICULAR_COMMISSION_RATE;
}

export function rentalCommissionSplit(input: {
  isPlatformOwned: boolean;
  ownerIsProfessionalClient: boolean;
  totalAmount: number;
  frozenRate?: number | null;
}): CommissionSplit & { isPlatformOwned: boolean } {
  const rate =
    input.frozenRate ??
    rentalCommissionRate({
      isPlatformOwned: input.isPlatformOwned,
      ownerIsProfessionalClient: input.ownerIsProfessionalClient,
      totalAmount: input.totalAmount,
    });
  return {
    ...splitAmount(input.totalAmount, rate),
    isPlatformOwned: input.isPlatformOwned,
  };
}

export function ownerIsProfessionalClient(owner: {
  role?: string | null;
  clientKind?: string | null;
} | null): boolean {
  return isProfessionalClient(owner);
}

export function formatCommissionPercent(rate: number): string {
  const pct = rate * 100;
  if (Number.isInteger(pct)) return `${pct} %`;
  return `${String(pct).replace(".", ",")} %`;
}

export function formatMgaAmount(amount: number): string {
  return `${amount.toLocaleString("fr-MG")} Ar`;
}

export const SERVICE_COMMISSION_ROWS = SERVICE_CATEGORIES.map((category) => ({
  category,
  rate: SERVICE_COMMISSION_RATES[category],
}));
