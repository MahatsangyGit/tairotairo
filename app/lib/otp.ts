import bcrypt from "bcryptjs";
import crypto from "crypto";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export const MAX_OTP_ATTEMPTS = 5;

export const OTP_LOCKED_MESSAGE =
  "Trop de tentatives incorrectes. Demandez un nouveau code.";

export function generateOtpCode(): string {
  const max = 10 ** OTP_LENGTH;
  const num = crypto.randomInt(0, max);
  return num.toString().padStart(OTP_LENGTH, "0");
}

export async function hashOtpCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function verifyOtpCode(
  code: string,
  codeHash: string
): Promise<boolean> {
  return bcrypt.compare(code, codeHash);
}

export function getOtpExpiry(): Date {
  return new Date(Date.now() + OTP_TTL_MS);
}

export function canResendOtp(lastCreatedAt: Date | null): boolean {
  if (!lastCreatedAt) return true;
  return Date.now() - lastCreatedAt.getTime() >= RESEND_COOLDOWN_MS;
}

export function getResendCooldownSeconds(lastCreatedAt: Date): number {
  const remaining =
    RESEND_COOLDOWN_MS - (Date.now() - lastCreatedAt.getTime());
  return Math.max(0, Math.ceil(remaining / 1000));
}
