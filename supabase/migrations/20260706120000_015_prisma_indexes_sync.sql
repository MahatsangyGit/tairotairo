/*
# Sync indexes — schéma Prisma (PascalCase)

Complète les index déjà présents dans les migrations 002–006 (snake_case) ou manquants
pour les requêtes courantes (listes, admin, tri par note).
*/

-- User
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User" (role);
CREATE INDEX IF NOT EXISTS "User_kycStatus_idx" ON "User" ("kycStatus");
CREATE INDEX IF NOT EXISTS "User_featuredOnHomepage_idx" ON "User" ("featuredOnHomepage") WHERE "featuredOnHomepage" = true;

-- Service
CREATE INDEX IF NOT EXISTS "Service_providerId_idx" ON "Service" ("providerId");
CREATE INDEX IF NOT EXISTS "Service_category_idx" ON "Service" (category);
CREATE INDEX IF NOT EXISTS "Service_available_idx" ON "Service" (available) WHERE available = true;
CREATE INDEX IF NOT EXISTS "Service_featuredOnHomepage_idx" ON "Service" ("featuredOnHomepage") WHERE "featuredOnHomepage" = true;
CREATE INDEX IF NOT EXISTS "Service_createdAt_idx" ON "Service" ("createdAt" DESC);

-- ServiceRequest
CREATE INDEX IF NOT EXISTS "ServiceRequest_clientId_idx" ON "ServiceRequest" ("clientId");
CREATE INDEX IF NOT EXISTS "ServiceRequest_category_idx" ON "ServiceRequest" (category);
CREATE INDEX IF NOT EXISTS "ServiceRequest_open_idx" ON "ServiceRequest" (open) WHERE open = true;
CREATE INDEX IF NOT EXISTS "ServiceRequest_createdAt_idx" ON "ServiceRequest" ("createdAt" DESC);

-- Booking
CREATE INDEX IF NOT EXISTS "Booking_clientId_idx" ON "Booking" ("clientId");
CREATE INDEX IF NOT EXISTS "Booking_providerId_idx" ON "Booking" ("providerId");
CREATE INDEX IF NOT EXISTS "Booking_serviceId_idx" ON "Booking" ("serviceId");
CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "Booking" (status);
CREATE INDEX IF NOT EXISTS "Booking_date_idx" ON "Booking" (date);
CREATE INDEX IF NOT EXISTS "Booking_clientId_updatedAt_idx" ON "Booking" ("clientId", "updatedAt" DESC);
CREATE INDEX IF NOT EXISTS "Booking_providerId_updatedAt_idx" ON "Booking" ("providerId", "updatedAt" DESC);

-- Review (agrégation notes prestataires)
CREATE INDEX IF NOT EXISTS "Review_targetId_idx" ON "Review" ("targetId");
CREATE INDEX IF NOT EXISTS "Review_authorId_idx" ON "Review" ("authorId");

-- RequestResponse
CREATE INDEX IF NOT EXISTS "RequestResponse_requestId_idx" ON "RequestResponse" ("requestId");
CREATE INDEX IF NOT EXISTS "RequestResponse_providerId_idx" ON "RequestResponse" ("providerId");
CREATE INDEX IF NOT EXISTS "RequestResponse_status_idx" ON "RequestResponse" (status);

-- Notification (tri DESC)
DROP INDEX IF EXISTS "Notification_userId_read_createdAt_idx";
CREATE INDEX IF NOT EXISTS "Notification_userId_read_createdAt_idx"
  ON "Notification" ("userId", read, "createdAt" DESC);
