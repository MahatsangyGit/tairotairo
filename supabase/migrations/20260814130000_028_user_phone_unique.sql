/*
# Téléphone utilisateur obligatoire à l’inscription, unique en base.

Normalise les numéros existants (chiffres seuls). Les doublons et formats
invalides sont vidés pour permettre l’index unique (NULL autorisé en legacy).
*/

UPDATE "User"
SET phone = regexp_replace(phone, '[^0-9]', '', 'g')
WHERE phone IS NOT NULL AND phone <> '';

UPDATE "User"
SET phone = NULL
WHERE phone IS NULL OR phone = '';

UPDATE "User"
SET phone = NULL
WHERE phone IS NOT NULL
  AND phone !~ '^0(3[0-9]{8}|20[0-9]{7})$';

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY phone
    ORDER BY "createdAt" ASC, id ASC
  ) AS rn
  FROM "User"
  WHERE phone IS NOT NULL
)
UPDATE "User" u
SET phone = NULL
FROM ranked r
WHERE u.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User" ("phone");
