/*
# Token cleanup indexes

Indexes on expiresAt for EmailOtp and PasswordResetToken to support
scheduled deletion of expired auth tokens.
*/

CREATE INDEX IF NOT EXISTS "EmailOtp_expiresAt_idx" ON "EmailOtp" ("expiresAt");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken" ("expiresAt");
