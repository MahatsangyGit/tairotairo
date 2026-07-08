/*
# Escrow payments: paiements via l'app, séquestre, validation client, versement prestataire

## Flow
1. Provider confirme la réservation (PENDING -> CONFIRMED)
2. Client paie via l'app -> fonds capturés sous séquestre (booking PAID, transaction ESCROWED)
3. Provider démarre la prestation (PAID -> IN_PROGRESS)
4. Provider marque la prestation terminée (IN_PROGRESS -> DONE_PENDING_VALIDATION)
5. Client valide -> fonds débloqués vers le prestataire (booking COMPLETED, transaction RELEASED, ProviderPayout créée)
   Annulation après séquestre -> remboursement client (transaction REFUNDED)

## Changes (schéma Prisma PascalCase)
- Extend "BookingStatus" enum: + PAID, IN_PROGRESS, DONE_PENDING_VALIDATION
- Extend "TransactionStatus" enum: + ESCROWED, RELEASED, REFUNDED
- "Transaction": + escrowedAt, releasedAt, refundedAt
- New "ProviderPayout" table + "PayoutStatus" enum
*/

-- ── Extend enums ──────────────────────────────────────────────────────────────

ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'PAID';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'DONE_PENDING_VALIDATION';

ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'ESCROWED';
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'RELEASED';
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';

-- L'ancien état SUCCESS reste pour les lignes existantes (PostgreSQL ne permet
-- pas de retirer une valeur d'enum sans recréer le type). Le code applicatif
-- le traite comme RELEASED / ESCROWED.

-- ── Transaction : colonnes séquestre ──────────────────────────────────────────

ALTER TABLE "Transaction"
  ADD COLUMN IF NOT EXISTS "escrowedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "releasedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "refundedAt" timestamptz;

CREATE INDEX IF NOT EXISTS "Transaction_status_idx" ON "Transaction" (status);

-- ── PayoutStatus enum + ProviderPayout ────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ProviderPayout" (
  id               text              PRIMARY KEY,
  "providerId"     text              NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  "transactionId"  text              NOT NULL UNIQUE REFERENCES "Transaction"(id) ON DELETE CASCADE,
  amount           double precision  NOT NULL,
  currency         text              NOT NULL DEFAULT 'MGA',
  status           "PayoutStatus"    NOT NULL DEFAULT 'PENDING',
  reference        text,
  "createdAt"      timestamptz       NOT NULL DEFAULT now(),
  "updatedAt"      timestamptz       NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ProviderPayout_providerId_idx" ON "ProviderPayout" ("providerId");
CREATE INDEX IF NOT EXISTS "ProviderPayout_status_idx" ON "ProviderPayout" (status);

ALTER TABLE "ProviderPayout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProviderPayout" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS provider_payout_select ON "ProviderPayout";
CREATE POLICY provider_payout_select ON "ProviderPayout"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS provider_payout_insert ON "ProviderPayout";
CREATE POLICY provider_payout_insert ON "ProviderPayout"
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS provider_payout_update ON "ProviderPayout";
CREATE POLICY provider_payout_update ON "ProviderPayout"
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS provider_payout_delete ON "ProviderPayout";
CREATE POLICY provider_payout_delete ON "ProviderPayout"
  FOR DELETE USING (true);
