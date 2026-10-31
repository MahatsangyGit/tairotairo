/*
# Adresse prestataire

Saisie à l’inscription prestataire : 32 caractères max, lettres et chiffres.
*/

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "providerAddress" VARCHAR(32);
