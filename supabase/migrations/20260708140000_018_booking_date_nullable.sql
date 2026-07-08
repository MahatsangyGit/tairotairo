/*
# Booking.date nullable — date de prestation non imputée automatiquement

Quand une demande client est acceptée sans date souhaitée (`desiredDate`),
la réservation ne doit plus recevoir une date inventée (ex. J+7).
Le client fixe ensuite la date depuis ses réservations.
*/

ALTER TABLE "Booking" ALTER COLUMN date DROP NOT NULL;
