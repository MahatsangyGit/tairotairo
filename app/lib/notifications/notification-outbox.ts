import prisma from "@/lib/prisma";
import { withBypassRls } from "@/lib/rls";
import { sendNotificationEmail } from "@/lib/notifications";
import { sendPushToUser } from "@/lib/push";

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 50;
/** Stable advisory lock key for this cron (arbitrary positive int). */
const OUTBOX_ADVISORY_LOCK_KEY = 872_014_021;

export type OutboxProcessResult = {
  claimed: number;
  sent: number;
  failed: number;
  dead: number;
  skippedLock: boolean;
};

type ClaimedOutboxRow = {
  id: string;
  notificationId: string;
  userId: string;
  channel: "EMAIL" | "PUSH";
  attempts: number;
};

function backoffMs(attempts: number): number {
  // attempts is post-increment (1..5): 30s, 2m, 8m, 32m, 2h
  const minutes = Math.min(120, 0.5 * 2 ** (attempts - 1));
  return Math.round(minutes * 60_000);
}

async function deliverOutboxRow(row: ClaimedOutboxRow): Promise<void> {
  const notification = await prisma.notification.findUnique({
    where: { id: row.notificationId },
    select: {
      title: true,
      body: true,
      link: true,
    },
  });

  if (!notification) {
    throw new Error(`Notification ${row.notificationId} introuvable`);
  }

  if (row.channel === "EMAIL") {
    const user = await prisma.user.findUnique({
      where: { id: row.userId },
      select: { email: true, name: true },
    });
    if (!user) {
      throw new Error(`User ${row.userId} introuvable`);
    }
    await sendNotificationEmail(
      user.email,
      user.name,
      notification.title,
      notification.body,
      notification.link
    );
    return;
  }

  await sendPushToUser(row.userId, {
    title: notification.title,
    body: notification.body,
    url: notification.link ?? undefined,
  });
}

export async function processNotificationOutbox(): Promise<OutboxProcessResult> {
  return withBypassRls(async () => {
    const lockRows = await prisma.$queryRaw<{ locked: boolean }[]>`
      SELECT pg_try_advisory_lock(${OUTBOX_ADVISORY_LOCK_KEY}) AS locked
    `;
    const locked = Boolean(lockRows[0]?.locked);
    if (!locked) {
      return {
        claimed: 0,
        sent: 0,
        failed: 0,
        dead: 0,
        skippedLock: true,
      };
    }

    try {
      const claimed = await prisma.$queryRaw<ClaimedOutboxRow[]>`
        WITH due AS (
          SELECT id
          FROM "NotificationOutbox"
          WHERE status IN ('PENDING', 'FAILED')
            AND "nextAttemptAt" <= NOW()
          ORDER BY "nextAttemptAt" ASC
          FOR UPDATE SKIP LOCKED
          LIMIT ${BATCH_SIZE}
        )
        UPDATE "NotificationOutbox" AS o
        SET
          status = 'PROCESSING',
          attempts = o.attempts + 1,
          "updatedAt" = NOW()
        FROM due
        WHERE o.id = due.id
        RETURNING
          o.id,
          o."notificationId" AS "notificationId",
          o."userId" AS "userId",
          o.channel::text AS channel,
          o.attempts
      `;

      let sent = 0;
      let failed = 0;
      let dead = 0;

      for (const row of claimed) {
        try {
          await deliverOutboxRow(row);
          await prisma.notificationOutbox.update({
            where: { id: row.id },
            data: {
              status: "SENT",
              lastError: null,
              nextAttemptAt: new Date(),
            },
          });
          sent += 1;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          const isDead = row.attempts >= MAX_ATTEMPTS;

          await prisma.notificationOutbox.update({
            where: { id: row.id },
            data: {
              status: isDead ? "DEAD" : "FAILED",
              lastError: message.slice(0, 2000),
              nextAttemptAt: isDead
                ? new Date()
                : new Date(Date.now() + backoffMs(row.attempts)),
            },
          });

          if (isDead) dead += 1;
          else failed += 1;
        }
      }

      return {
        claimed: claimed.length,
        sent,
        failed,
        dead,
        skippedLock: false,
      };
    } finally {
      await prisma.$executeRaw`
        SELECT pg_advisory_unlock(${OUTBOX_ADVISORY_LOCK_KEY})
      `;
    }
  });
}
