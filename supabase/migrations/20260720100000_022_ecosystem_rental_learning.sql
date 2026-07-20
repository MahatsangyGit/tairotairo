/*
# Écosystème Tairo — tables ampindramo (location) + ampianaro (formation)

Migrations additives uniquement. Ne modifie aucune table marketplace existante.
*/

-- Extension pour EXCLUDE USING gist (anti-chevauchement des locations)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ── Enums location ───────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "EquipmentCategory" AS ENUM (
    'POWER_TOOLS', 'HAND_TOOLS', 'ELECTRICAL', 'PLUMBING',
    'PAINTING', 'GARDENING', 'CONSTRUCTION', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "EquipmentStatus" AS ENUM (
    'DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'SUSPENDED', 'ARCHIVED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RentalStatus" AS ENUM (
    'REQUESTED', 'ACCEPTED', 'PAID', 'ONGOING', 'RETURN_PENDING',
    'COMPLETED', 'CANCELLED', 'DISPUTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RentalTransactionStatus" AS ENUM (
    'PENDING', 'ESCROWED', 'RELEASED', 'REFUNDED', 'FAILED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Enums formation ──────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "CourseCategory" AS ENUM (
    'DIY', 'HANDYWORK', 'ELECTRICAL', 'PLUMBING', 'PAINTING', 'SAFETY', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── EquipmentItem ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "EquipmentItem" (
  id                text                 PRIMARY KEY,
  title             text                 NOT NULL,
  description       text                 NOT NULL,
  category          "EquipmentCategory"  NOT NULL,
  location          text                 NOT NULL,
  "dailyPrice"      double precision     NOT NULL,
  "depositAmount"   double precision     NOT NULL,
  status            "EquipmentStatus"    NOT NULL DEFAULT 'DRAFT',
  "isPlatformOwned" boolean              NOT NULL DEFAULT false,
  "rejectionReason" text,
  "photoKeys"       text[]               NOT NULL DEFAULT '{}',
  "createdAt"       timestamptz          NOT NULL DEFAULT now(),
  "updatedAt"       timestamptz          NOT NULL DEFAULT now(),
  "ownerId"         text                 NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "EquipmentItem_status_idx" ON "EquipmentItem" (status);
CREATE INDEX IF NOT EXISTS "EquipmentItem_category_idx" ON "EquipmentItem" (category);
CREATE INDEX IF NOT EXISTS "EquipmentItem_ownerId_idx" ON "EquipmentItem" ("ownerId");
CREATE INDEX IF NOT EXISTS "EquipmentItem_status_updatedAt_idx" ON "EquipmentItem" (status, "updatedAt");
CREATE INDEX IF NOT EXISTS "EquipmentItem_isPlatformOwned_idx" ON "EquipmentItem" ("isPlatformOwned");

-- ── RentalBooking ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "RentalBooking" (
  id                  text            PRIMARY KEY,
  status              "RentalStatus"  NOT NULL DEFAULT 'REQUESTED',
  "startDate"         timestamptz     NOT NULL,
  "endDate"           timestamptz     NOT NULL,
  "totalAmount"       double precision NOT NULL,
  "depositAmount"     double precision NOT NULL,
  "displayTitle"      text,
  "displayCategory"   text,
  "displayLocation"   text,
  "displayDailyPrice" double precision,
  "createdAt"         timestamptz     NOT NULL DEFAULT now(),
  "updatedAt"         timestamptz     NOT NULL DEFAULT now(),
  "equipmentId"       text            NOT NULL REFERENCES "EquipmentItem"(id) ON DELETE RESTRICT,
  "renterId"          text            NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  "ownerId"           text            NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  CONSTRAINT "RentalBooking_dates_check" CHECK ("endDate" > "startDate")
);

CREATE INDEX IF NOT EXISTS "RentalBooking_equipmentId_idx" ON "RentalBooking" ("equipmentId");
CREATE INDEX IF NOT EXISTS "RentalBooking_renterId_idx" ON "RentalBooking" ("renterId");
CREATE INDEX IF NOT EXISTS "RentalBooking_ownerId_idx" ON "RentalBooking" ("ownerId");
CREATE INDEX IF NOT EXISTS "RentalBooking_status_idx" ON "RentalBooking" (status);
CREATE INDEX IF NOT EXISTS "RentalBooking_dates_idx" ON "RentalBooking" ("startDate", "endDate");
CREATE INDEX IF NOT EXISTS "RentalBooking_renterId_updatedAt_idx" ON "RentalBooking" ("renterId", "updatedAt");
CREATE INDEX IF NOT EXISTS "RentalBooking_ownerId_updatedAt_idx" ON "RentalBooking" ("ownerId", "updatedAt");

-- Anti-chevauchement sur les locations actives d'un même matériel
ALTER TABLE "RentalBooking" DROP CONSTRAINT IF EXISTS "RentalBooking_no_overlap";
ALTER TABLE "RentalBooking"
  ADD CONSTRAINT "RentalBooking_no_overlap"
  EXCLUDE USING gist (
    "equipmentId" WITH =,
    tstzrange("startDate", "endDate", '[)') WITH &&
  )
  WHERE (status IN ('REQUESTED', 'ACCEPTED', 'PAID', 'ONGOING', 'RETURN_PENDING', 'DISPUTED'));

-- ── RentalTransaction ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "RentalTransaction" (
  id                  text                       PRIMARY KEY,
  amount              double precision           NOT NULL,
  "depositAmount"     double precision           NOT NULL,
  currency            text                       NOT NULL DEFAULT 'MGA',
  status              "RentalTransactionStatus"  NOT NULL DEFAULT 'PENDING',
  "paymentMethod"     "PaymentMethod"            NOT NULL,
  "referenceId"       text,
  "escrowedAt"        timestamptz,
  "releasedAt"        timestamptz,
  "refundedAt"        timestamptz,
  "depositRefundedAt" timestamptz,
  "depositRetained"   double precision           NOT NULL DEFAULT 0,
  "createdAt"         timestamptz                NOT NULL DEFAULT now(),
  "updatedAt"         timestamptz                NOT NULL DEFAULT now(),
  "rentalBookingId"   text                       NOT NULL UNIQUE REFERENCES "RentalBooking"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "RentalTransaction_status_idx" ON "RentalTransaction" (status);

-- ── RentalPayout ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "RentalPayout" (
  id              text           PRIMARY KEY,
  "ownerId"       text           NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  "transactionId" text           NOT NULL UNIQUE REFERENCES "RentalTransaction"(id) ON DELETE CASCADE,
  amount          double precision NOT NULL,
  currency        text           NOT NULL DEFAULT 'MGA',
  status          "PayoutStatus" NOT NULL DEFAULT 'PENDING',
  reference       text,
  "createdAt"     timestamptz    NOT NULL DEFAULT now(),
  "updatedAt"     timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "RentalPayout_ownerId_idx" ON "RentalPayout" ("ownerId");
CREATE INDEX IF NOT EXISTS "RentalPayout_status_idx" ON "RentalPayout" (status);

-- ── Course ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Course" (
  id            text              PRIMARY KEY,
  title         text              NOT NULL,
  slug          text              NOT NULL UNIQUE,
  description   text              NOT NULL,
  category      "CourseCategory"  NOT NULL,
  "coverKey"    text,
  status        "CourseStatus"    NOT NULL DEFAULT 'DRAFT',
  "createdAt"   timestamptz       NOT NULL DEFAULT now(),
  "updatedAt"   timestamptz       NOT NULL DEFAULT now(),
  "createdById" text              NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "Course_status_idx" ON "Course" (status);
CREATE INDEX IF NOT EXISTS "Course_category_idx" ON "Course" (category);
CREATE INDEX IF NOT EXISTS "Course_status_updatedAt_idx" ON "Course" (status, "updatedAt");

-- ── CourseLesson ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "CourseLesson" (
  id            text        PRIMARY KEY,
  title         text        NOT NULL,
  description   text,
  position      integer     NOT NULL,
  "videoKey"    text,
  "videoMime"   text,
  "durationSec" integer,
  "createdAt"   timestamptz NOT NULL DEFAULT now(),
  "updatedAt"   timestamptz NOT NULL DEFAULT now(),
  "courseId"    text        NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
  CONSTRAINT "CourseLesson_courseId_position_key" UNIQUE ("courseId", position)
);

CREATE INDEX IF NOT EXISTS "CourseLesson_courseId_idx" ON "CourseLesson" ("courseId");

-- ── CourseEnrollment ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "CourseEnrollment" (
  id             text        PRIMARY KEY,
  "lastLessonId" text,
  "createdAt"    timestamptz NOT NULL DEFAULT now(),
  "updatedAt"    timestamptz NOT NULL DEFAULT now(),
  "userId"       text        NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "courseId"     text        NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
  CONSTRAINT "CourseEnrollment_userId_courseId_key" UNIQUE ("userId", "courseId")
);

CREATE INDEX IF NOT EXISTS "CourseEnrollment_userId_idx" ON "CourseEnrollment" ("userId");
CREATE INDEX IF NOT EXISTS "CourseEnrollment_courseId_idx" ON "CourseEnrollment" ("courseId");

-- ── LessonProgress ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "LessonProgress" (
  id            text        PRIMARY KEY,
  "completedAt" timestamptz,
  "createdAt"   timestamptz NOT NULL DEFAULT now(),
  "updatedAt"   timestamptz NOT NULL DEFAULT now(),
  "userId"      text        NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "lessonId"    text        NOT NULL REFERENCES "CourseLesson"(id) ON DELETE CASCADE,
  CONSTRAINT "LessonProgress_userId_lessonId_key" UNIQUE ("userId", "lessonId")
);

CREATE INDEX IF NOT EXISTS "LessonProgress_userId_idx" ON "LessonProgress" ("userId");
CREATE INDEX IF NOT EXISTS "LessonProgress_lessonId_idx" ON "LessonProgress" ("lessonId");

-- ── Grants ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tairo_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "EquipmentItem" TO tairo_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "RentalBooking" TO tairo_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "RentalTransaction" TO tairo_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "RentalPayout" TO tairo_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "Course" TO tairo_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "CourseLesson" TO tairo_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "CourseEnrollment" TO tairo_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "LessonProgress" TO tairo_app;
  END IF;
END $$;
