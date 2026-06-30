export const MIN_PASSWORD_LENGTH = 8;

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

  return { ok: true };
}
