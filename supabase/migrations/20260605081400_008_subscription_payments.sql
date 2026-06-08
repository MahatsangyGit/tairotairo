-- Provider self-service subscription payments

DO $$ BEGIN
  CREATE TYPE subscription_payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS provider_subscription_payments (
  id              TEXT PRIMARY KEY,
  provider_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  months          INTEGER NOT NULL,
  amount          DOUBLE PRECISION NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'MGA',
  payment_method  payment_method NOT NULL,
  phone           TEXT NOT NULL,
  status          subscription_payment_status NOT NULL DEFAULT 'PENDING',
  reference_id    TEXT NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS provider_subscription_payments_provider_id_created_at_idx
  ON provider_subscription_payments (provider_id, created_at DESC);
