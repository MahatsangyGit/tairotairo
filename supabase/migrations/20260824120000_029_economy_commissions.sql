/*
# Modèle économique : commissions figées + recettes catalogue Tairo.

Les réservations existantes restent à 0 % (DEFAULT).
*/

ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "RentalBooking"
  ADD COLUMN IF NOT EXISTS "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "platformOwnedSnapshot" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "RentalPayout"
  ADD COLUMN IF NOT EXISTS "isPlatformRevenue" BOOLEAN NOT NULL DEFAULT false;
