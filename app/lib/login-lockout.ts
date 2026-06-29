export const MAX_FAILED_LOGIN_ATTEMPTS = 5;

export const LOGIN_FAILED_MESSAGE = "Email ou mot de passe incorrect";

export const LOGIN_LOCKED_MESSAGE =
  "Compte temporairement verrouillé après plusieurs tentatives incorrectes. Contactez un administrateur pour le débloquer.";

export function isLoginLocked(loginLockedAt: Date | null | undefined): boolean {
  return loginLockedAt != null;
}

export function attemptsUntilLock(failedAttempts: number): number {
  return Math.max(0, MAX_FAILED_LOGIN_ATTEMPTS - failedAttempts);
}
