/*
# Create users and authentication tables

## New Tables

### `users`
Core user table for all roles (CLIENT, PROVIDER, ADMIN).
- `id` — CUID string primary key
- `name` — display name
- `email` — unique login email
- `password` — bcrypt-hashed password
- `phone` — optional contact number
- `role` — enum: CLIENT / PROVIDER / ADMIN (default CLIENT)
- `avatar` — stored filename of profile image
- `bio` — optional provider biography
- `email_verified`, `email_verified_at` — email verification state
- `notify_email`, `notify_push` — notification preferences
- `kyc_status` — KYC verification state (NOT_STARTED / APPROVED)
- `kyc_submitted_at` — when KYC was submitted
- `featured_on_homepage`, `featured_on_homepage_at` — admin spotlight flags
- `created_at`, `updated_at` — timestamps

### `provider_subscriptions`
Monthly subscription record for providers who are featured on homepage.
- `id` — CUID primary key
- `provider_id` — FK to users (unique — one subscription per provider)
- `starts_at`, `expires_at` — subscription window
- `notes` — admin notes

### `email_otps`
One-time password codes for email verification.
- `id` — CUID primary key
- `user_id` — FK to users
- `code_hash` — hashed OTP
- `expires_at` — expiry timestamp

### `password_reset_tokens`
Tokens for the forgot-password flow.
- `id` — CUID primary key
- `user_id` — FK to users
- `token_hash` — hashed token
- `expires_at` — expiry
- `used_at` — when redeemed (nullable)

## Security
RLS is enabled on all tables. Because this app uses custom JWT auth (not Supabase Auth), 
policies use `TO anon, authenticated` with permissive USING/WITH CHECK so that the Prisma
server-side client (connecting with the service role or direct DATABASE_URL) can operate.
Row-level access control is enforced at the application layer via middleware.
*/

-- ── Users ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            text        PRIMARY KEY,
  name          text        NOT NULL,
  email         text        NOT NULL UNIQUE,
  password      text        NOT NULL,
  phone         text,
  role          role        NOT NULL DEFAULT 'CLIENT',
  avatar        text,
  bio           text,
  email_verified      boolean     NOT NULL DEFAULT false,
  email_verified_at   timestamptz,
  notify_email        boolean     NOT NULL DEFAULT true,
  notify_push         boolean     NOT NULL DEFAULT true,
  kyc_status          kyc_status  NOT NULL DEFAULT 'NOT_STARTED',
  kyc_submitted_at    timestamptz,
  featured_on_homepage      boolean     NOT NULL DEFAULT false,
  featured_on_homepage_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);
CREATE INDEX IF NOT EXISTS users_featured_idx ON users (featured_on_homepage) WHERE featured_on_homepage = true;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select" ON users;
CREATE POLICY "users_select" ON users FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "users_insert" ON users;
CREATE POLICY "users_insert" ON users FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "users_update" ON users;
CREATE POLICY "users_update" ON users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users_delete" ON users;
CREATE POLICY "users_delete" ON users FOR DELETE TO anon, authenticated USING (true);

-- ── Provider Subscriptions ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS provider_subscriptions (
  id          text        PRIMARY KEY,
  provider_id text        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  starts_at   timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provider_subscriptions_expires_at_idx ON provider_subscriptions (expires_at);

ALTER TABLE provider_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provider_subscriptions_select" ON provider_subscriptions;
CREATE POLICY "provider_subscriptions_select" ON provider_subscriptions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "provider_subscriptions_insert" ON provider_subscriptions;
CREATE POLICY "provider_subscriptions_insert" ON provider_subscriptions FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "provider_subscriptions_update" ON provider_subscriptions;
CREATE POLICY "provider_subscriptions_update" ON provider_subscriptions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "provider_subscriptions_delete" ON provider_subscriptions;
CREATE POLICY "provider_subscriptions_delete" ON provider_subscriptions FOR DELETE TO anon, authenticated USING (true);

-- ── Email OTPs ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS email_otps (
  id          text        PRIMARY KEY,
  user_id     text        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash   text        NOT NULL,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_otps_user_id_idx ON email_otps (user_id);

ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_otps_select" ON email_otps;
CREATE POLICY "email_otps_select" ON email_otps FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "email_otps_insert" ON email_otps;
CREATE POLICY "email_otps_insert" ON email_otps FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "email_otps_update" ON email_otps;
CREATE POLICY "email_otps_update" ON email_otps FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "email_otps_delete" ON email_otps;
CREATE POLICY "email_otps_delete" ON email_otps FOR DELETE TO anon, authenticated USING (true);

-- ── Password Reset Tokens ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          text        PRIMARY KEY,
  user_id     text        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text        NOT NULL,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS password_reset_tokens_token_hash_idx ON password_reset_tokens (token_hash);

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "password_reset_tokens_select" ON password_reset_tokens;
CREATE POLICY "password_reset_tokens_select" ON password_reset_tokens FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "password_reset_tokens_insert" ON password_reset_tokens;
CREATE POLICY "password_reset_tokens_insert" ON password_reset_tokens FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "password_reset_tokens_update" ON password_reset_tokens;
CREATE POLICY "password_reset_tokens_update" ON password_reset_tokens FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "password_reset_tokens_delete" ON password_reset_tokens;
CREATE POLICY "password_reset_tokens_delete" ON password_reset_tokens FOR DELETE TO anon, authenticated USING (true);
