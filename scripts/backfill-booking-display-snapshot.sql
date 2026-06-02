-- Remplit display* pour les réservations encore liées à un service ou une demande.
-- Les réservations déjà orphelines (demande supprimée sans snapshot) ne peuvent pas être reconstruites.

UPDATE "Booking" b
SET
  "displayTitle" = s.title,
  "displayPrice" = s.price,
  "displayCategory" = s.category,
  "displayLocation" = s.location,
  "displaySource" = 'service',
  "displayTargetId" = s.id
FROM "Service" s
WHERE b."serviceId" = s.id
  AND b."displayTitle" IS NULL;

UPDATE "Booking" b
SET
  "displayTitle" = sr.title,
  "displayPrice" = COALESCE(rr."proposedPrice", sr.budget),
  "displayCategory" = sr.category,
  "displayLocation" = sr.location,
  "displaySource" = 'request',
  "displayTargetId" = sr.id
FROM "RequestResponse" rr
JOIN "ServiceRequest" sr ON sr.id = rr."requestId"
WHERE b."requestResponseId" = rr.id
  AND b."displayTitle" IS NULL;
