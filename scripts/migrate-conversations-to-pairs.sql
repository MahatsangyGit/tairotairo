-- Migration manuelle : conversations liées aux réservations → paires client/prestataire
-- À exécuter une fois si la table Conversation existe déjà avec bookingId

ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "clientId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "providerId" TEXT;

UPDATE "Conversation" c
SET
  "clientId" = b."clientId",
  "providerId" = b."providerId"
FROM "Booking" b
WHERE c."bookingId" = b."id"
  AND (c."clientId" IS NULL OR c."providerId" IS NULL);

-- Fusionner les doublons (même paire, plusieurs réservations)
WITH ranked AS (
  SELECT
    id,
    "clientId",
    "providerId",
    ROW_NUMBER() OVER (
      PARTITION BY "clientId", "providerId"
      ORDER BY "updatedAt" DESC
    ) AS rn
  FROM "Conversation"
  WHERE "clientId" IS NOT NULL AND "providerId" IS NOT NULL
),
keepers AS (
  SELECT id AS keep_id, "clientId", "providerId"
  FROM ranked
  WHERE rn = 1
),
dupes AS (
  SELECT r.id AS dupe_id, k.keep_id
  FROM ranked r
  JOIN keepers k ON k."clientId" = r."clientId" AND k."providerId" = r."providerId"
  WHERE r.rn > 1
)
UPDATE "Message" m
SET "conversationId" = d.keep_id
FROM dupes d
WHERE m."conversationId" = d.dupe_id;

DELETE FROM "Conversation" c
USING (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY "clientId", "providerId"
        ORDER BY "updatedAt" DESC
      ) AS rn
    FROM "Conversation"
    WHERE "clientId" IS NOT NULL
  ) t
  WHERE rn > 1
) dup
WHERE c.id = dup.id;

ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS "Conversation_bookingId_fkey";
ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS "Conversation_bookingId_key";
ALTER TABLE "Conversation" DROP COLUMN IF EXISTS "bookingId";

ALTER TABLE "Conversation" ALTER COLUMN "clientId" SET NOT NULL;
ALTER TABLE "Conversation" ALTER COLUMN "providerId" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Conversation_clientId_providerId_key"
  ON "Conversation"("clientId", "providerId");
