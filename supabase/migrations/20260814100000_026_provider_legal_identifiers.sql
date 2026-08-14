/*
# Identifiants légaux prestataire (NIF, STAT, RCS)

Optionnels. Un prestataire qui renseigne les trois obtient le badge EI
(entreprise individuelle). NIF + STAT figurent sur les factures PDF.
*/

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "nif" TEXT,
  ADD COLUMN IF NOT EXISTS "stat" TEXT,
  ADD COLUMN IF NOT EXISTS "rcs" TEXT;
