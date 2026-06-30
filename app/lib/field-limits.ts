export const FIELD_LIMITS = {
  USER_NAME: 100,
  USER_BIO: 2000,
  USER_PHONE: 30,
  LISTING_TITLE: 200,
  LISTING_DESCRIPTION: 5000,
  LISTING_CATEGORY: 100,
  LISTING_LOCATION: 100,
  REVIEW_COMMENT: 2000,
  REQUEST_RESPONSE_MESSAGE: 2000,
  MESSAGE_BODY: 2000,
} as const;

export function trimString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateRequiredText(
  value: unknown,
  label: string,
  maxLength: number
): { ok: true; value: string } | { ok: false; error: string } {
  const text = trimString(value);

  if (!text) {
    return { ok: false, error: `${label} est obligatoire` };
  }

  if (text.length > maxLength) {
    return {
      ok: false,
      error: `${label} trop long (max ${maxLength} caractères)`,
    };
  }

  return { ok: true, value: text };
}

export function validateOptionalText(
  value: unknown,
  label: string,
  maxLength: number
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: null };
  }

  const text = trimString(value);

  if (text.length > maxLength) {
    return {
      ok: false,
      error: `${label} trop long (max ${maxLength} caractères)`,
    };
  }

  return { ok: true, value: text };
}

export function validateTextIfPresent(
  value: unknown,
  label: string,
  maxLength: number
): { ok: true; value?: string } | { ok: false; error: string } {
  if (value === undefined) {
    return { ok: true };
  }

  const text = trimString(value);

  if (!text) {
    return { ok: false, error: `${label} ne peut pas être vide` };
  }

  if (text.length > maxLength) {
    return {
      ok: false,
      error: `${label} trop long (max ${maxLength} caractères)`,
    };
  }

  return { ok: true, value: text };
}
