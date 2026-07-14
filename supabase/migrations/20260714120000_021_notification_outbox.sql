/*
# Notification outbox (audit M7)

Durable email/push delivery queue. In-app Notification rows stay immediate;
channel delivery is claimed by cron with SKIP LOCKED + advisory lock.
*/

DO $$ BEGIN
  CREATE TYPE "NotificationOutboxChannel" AS ENUM ('EMAIL', 'PUSH');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationOutboxStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'SENT',
    'FAILED',
    'DEAD'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "NotificationOutbox" (
  id               text                         PRIMARY KEY,
  "notificationId" text                         NOT NULL REFERENCES "Notification"(id) ON DELETE CASCADE,
  "userId"         text                         NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  channel          "NotificationOutboxChannel"  NOT NULL,
  status           "NotificationOutboxStatus"   NOT NULL DEFAULT 'PENDING',
  attempts         integer                      NOT NULL DEFAULT 0,
  "nextAttemptAt"  timestamptz                  NOT NULL DEFAULT now(),
  "lastError"      text,
  "createdAt"      timestamptz                  NOT NULL DEFAULT now(),
  "updatedAt"      timestamptz                  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "NotificationOutbox_status_nextAttemptAt_idx"
  ON "NotificationOutbox" (status, "nextAttemptAt");

CREATE INDEX IF NOT EXISTS "NotificationOutbox_notificationId_idx"
  ON "NotificationOutbox" ("notificationId");

CREATE INDEX IF NOT EXISTS "NotificationOutbox_userId_idx"
  ON "NotificationOutbox" ("userId");

ALTER TABLE "NotificationOutbox" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationOutbox" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notification_outbox_select ON "NotificationOutbox";
CREATE POLICY notification_outbox_select ON "NotificationOutbox"
  FOR SELECT
  USING (app.bypass_rls() OR app.is_admin());

DROP POLICY IF EXISTS notification_outbox_insert ON "NotificationOutbox";
CREATE POLICY notification_outbox_insert ON "NotificationOutbox"
  FOR INSERT
  WITH CHECK (app.bypass_rls() OR app.is_admin());

DROP POLICY IF EXISTS notification_outbox_update ON "NotificationOutbox";
CREATE POLICY notification_outbox_update ON "NotificationOutbox"
  FOR UPDATE
  USING (app.bypass_rls() OR app.is_admin())
  WITH CHECK (app.bypass_rls() OR app.is_admin());

DROP POLICY IF EXISTS notification_outbox_delete ON "NotificationOutbox";
CREATE POLICY notification_outbox_delete ON "NotificationOutbox"
  FOR DELETE
  USING (app.is_admin());

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tairo_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "NotificationOutbox" TO tairo_app;
  END IF;
END $$;
