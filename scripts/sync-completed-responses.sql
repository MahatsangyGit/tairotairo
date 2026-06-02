-- Synchronise les propositions ACCEPTED dont la réservation est déjà COMPLETED
UPDATE "RequestResponse" rr
SET status = 'COMPLETED'
FROM "Booking" b
WHERE rr.id = b."requestResponseId"
  AND b.status = 'COMPLETED'
  AND rr.status = 'ACCEPTED';
