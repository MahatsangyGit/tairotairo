-- Aligne le statut réservation sur les propositions déjà terminées
UPDATE "Booking" b
SET status = 'COMPLETED'
FROM "RequestResponse" rr
WHERE b."requestResponseId" = rr.id
  AND rr.status = 'COMPLETED'
  AND b.status IS DISTINCT FROM 'COMPLETED';
