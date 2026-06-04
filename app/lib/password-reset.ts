import crypto from "crypto";

const RESET_TTL_MS = 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export function generatePasswordResetToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString("base64url");
  return { raw, hash: hashPasswordResetToken(raw) };
}

export function hashPasswordResetToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function verifyPasswordResetToken(raw: string, hash: string): boolean {
  const computed = hashPasswordResetToken(raw);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed, "hex"),
      Buffer.from(hash, "hex")
    );
  } catch {
    return false;
  }
}

export function getPasswordResetExpiry(): Date {
  return new Date(Date.now() + RESET_TTL_MS);
}

export function canRequestPasswordReset(lastCreatedAt: Date | null): boolean {
  if (!lastCreatedAt) return true;
  return Date.now() - lastCreatedAt.getTime() >= RESEND_COOLDOWN_MS;
}

export function getPasswordResetCooldownSeconds(lastCreatedAt: Date): number {
  const remaining =
    RESEND_COOLDOWN_MS - (Date.now() - lastCreatedAt.getTime());
  return Math.max(0, Math.ceil(remaining / 1000));
}

export const PASSWORD_RESET_EXPIRY_HOURS = RESET_TTL_MS / (60 * 60 * 1000);
