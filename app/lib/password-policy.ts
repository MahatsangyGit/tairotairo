export const MIN_PASSWORD_LENGTH = 12;

const HAS_LOWER = /[a-z]/;
const HAS_UPPER = /[A-Z]/;
const HAS_DIGIT = /\d/;

export function validatePassword(
  password: unknown
): { ok: true } | { ok: false; error: string } {
  if (typeof password !== "string" || !password) {
    return { ok: false, error: "Mot de passe obligatoire" };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`,
    };
  }

  if (!HAS_LOWER.test(password) || !HAS_UPPER.test(password) || !HAS_DIGIT.test(password)) {
    return {
      ok: false,
      error: "Le mot de passe doit contenir une majuscule, une minuscule et un chiffre",
    };
  }

  return { ok: true };
}
