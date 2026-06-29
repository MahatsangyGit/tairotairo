-- Verrouillage connexion après échecs répétés (schéma Prisma)

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "loginLockedAt" TIMESTAMP(3);
