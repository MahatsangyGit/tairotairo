/*
# Location ampindramo conditionnée par une prestation ampio

Ajoute le lien RentalBooking.serviceBookingId → Booking.
Les locations existantes restent valides (colonne nullable).
Les nouvelles locations exigent une réservation éligible côté API.
*/

ALTER TABLE "RentalBooking"
  ADD COLUMN IF NOT EXISTS "serviceBookingId" TEXT;

DO $$
BEGIN
  ALTER TABLE "RentalBooking"
    ADD CONSTRAINT "RentalBooking_serviceBookingId_fkey"
    FOREIGN KEY ("serviceBookingId") REFERENCES "Booking"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "RentalBooking_serviceBookingId_idx"
  ON "RentalBooking" ("serviceBookingId");
