const PLACEHOLDER_SECRETS = new Set([
  "replace-with-a-long-random-secret-at-least-32-chars",
  "your-secret",
  "changeme",
  "secret",
]);

const MIN_JWT_SECRET_LENGTH = 32;

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "JWT_SECRET est manquant. Copiez .env.example vers .env et définissez un secret aléatoire d'au moins 32 caractères."
    );
  }
  return secret;
}

export function validateJwtSecret(secret = getJwtSecret()): void {
  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET est trop court (${secret.length} caractères). Utilisez au moins ${MIN_JWT_SECRET_LENGTH} caractères aléatoires.`
    );
  }

  if (PLACEHOLDER_SECRETS.has(secret.toLowerCase())) {
    throw new Error(
      "JWT_SECRET utilise une valeur placeholder. Remplacez-la par un secret aléatoire d'au moins 32 caractères."
    );
  }
}
