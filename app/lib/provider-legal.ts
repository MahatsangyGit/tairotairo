/**
 * Identifiants légaux Madagascar (entreprise individuelle).
 *
 * - NIF : 10 chiffres (DGI / NIFOnline).
 *   https://taxdo.com/resources/global-tax-id-validation-guide/madagascar
 * - STAT : 17 chiffres (INSTAT, décret 2005-380) :
 *   5 activité + 2 région + 4 année + 1 indice + 5 ordre.
 * - RCS : immatriculation greffe — commune, lettre A (personne physique / EI),
 *   millésime, n° chronologique (ex. RCS/FD/2005/A 00031).
 */

export const NIF_ERROR =
  "NIF invalide : 10 chiffres (ex. 3002064702)";
export const STAT_ERROR =
  "STAT invalide : 17 chiffres (ex. 41002 52 2015 0 00152)";
export const RCS_ERROR =
  "RCS invalide : ex. RCS Antananarivo A 2024 00031";

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function parseNif(value: string): string | null {
  const digits = digitsOnly(value);
  if (digits.length !== 10) return null;
  return digits;
}

export function parseStat(value: string): string | null {
  const digits = digitsOnly(value);
  if (digits.length !== 17) return null;
  return digits;
}

export function formatStat(digits: string): string {
  if (digits.length !== 17) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 11)} ${digits.slice(11, 12)} ${digits.slice(12)}`;
}

export function parseRcs(value: string): string | null {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length < 6 || trimmed.length > 60) return null;
  if (!/^[\p{L}0-9][\p{L}0-9\s/.\-]*$/u.test(trimmed)) return null;
  const compact = trimmed.replace(/[\s/.\-]/g, "").toUpperCase();
  if (!/(?:19|20)\d{2}/.test(compact)) return null;
  if (!/[ABCD]/.test(compact)) return null;
  return trimmed;
}

export function isEntrepriseIndividuelle(ids: {
  nif?: string | null;
  stat?: string | null;
  rcs?: string | null;
}): boolean {
  return Boolean(ids.nif?.trim() && ids.stat?.trim() && ids.rcs?.trim());
}

export const providerLegalSelect = {
  nif: true,
  stat: true,
  rcs: true,
} as const;

export function withEiFlag<
  T extends { nif?: string | null; stat?: string | null; rcs?: string | null },
>(provider: T): Omit<T, "nif" | "stat" | "rcs"> & {
  isEntrepriseIndividuelle: boolean;
} {
  const { nif, stat, rcs, ...rest } = provider;
  return {
    ...rest,
    isEntrepriseIndividuelle: isEntrepriseIndividuelle({ nif, stat, rcs }),
  };
}
