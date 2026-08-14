/*
# Client professionnel

Sous-type de CLIENT (pas un rôle distinct). L’inscription entreprise
exige nom de société, NIF, STAT, RCS, adresse sociale et téléphone.
*/

DO $$ BEGIN
  CREATE TYPE "ClientKind" AS ENUM ('INDIVIDUAL', 'PROFESSIONAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "clientKind" "ClientKind" NOT NULL DEFAULT 'INDIVIDUAL',
  ADD COLUMN IF NOT EXISTS "companyName" TEXT,
  ADD COLUMN IF NOT EXISTS "companyAddress" TEXT;

CREATE INDEX IF NOT EXISTS "User_clientKind_idx" ON "User" ("clientKind");
