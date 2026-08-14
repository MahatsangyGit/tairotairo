/** Téléphone Madagascar : 10 chiffres, affichage 3-2-3-2 (ex. 032 74 617 90). */

export const MG_PHONE_ERROR =
  "Numéro invalide : 10 chiffres, format 032 74 617 90";
export const MG_PHONE_REQUIRED = "Numéro de téléphone obligatoire";
export const MG_PHONE_DUPLICATE =
  "Ce numéro de téléphone est déjà associé à un compte.";

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Mobile 03x (Orange / Telma / Airtel) ou fixe 020, 10 chiffres.
 */
export function parseMgPhone(value: string): string | null {
  const digits = digitsOnly(value);
  if (!/^0(3[0-9]{8}|20[0-9]{7})$/.test(digits)) return null;
  return digits;
}

export function isValidMgPhone(phone: string): boolean {
  return parseMgPhone(phone) != null;
}

export function normalizeMgPhone(phone: string): string {
  return digitsOnly(phone);
}

/** Affichage : 032 74 617 90 */
export function formatMgPhone(value: string): string {
  const digits = digitsOnly(value);
  if (digits.length !== 10) return value.trim();
  return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
}

/** Saisie progressive, max 10 chiffres. */
export function formatMgPhoneInput(value: string): string {
  const digits = digitsOnly(value).slice(0, 10);
  const parts = [
    digits.slice(0, 3),
    digits.slice(3, 5),
    digits.slice(5, 8),
    digits.slice(8, 10),
  ].filter(Boolean);
  return parts.join(" ");
}
