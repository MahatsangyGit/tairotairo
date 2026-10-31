export const PROVIDER_ADDRESS_MAX_LENGTH = 32;

export const PROVIDER_ADDRESS_ERROR = `Adresse invalide : ${PROVIDER_ADDRESS_MAX_LENGTH} caractères max, lettres et chiffres uniquement`;

/** Lettres (accents inclus) et chiffres, mots séparés par un espace simple. */
const PROVIDER_ADDRESS_PATTERN = /^[\p{L}\p{N}]+(?: [\p{L}\p{N}]+)*$/u;

export function normalizeProviderAddress(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function parseProviderAddress(value: string): string | null {
  const address = normalizeProviderAddress(value);
  if (
    !address ||
    address.length > PROVIDER_ADDRESS_MAX_LENGTH ||
    !PROVIDER_ADDRESS_PATTERN.test(address)
  ) {
    return null;
  }
  return address;
}
