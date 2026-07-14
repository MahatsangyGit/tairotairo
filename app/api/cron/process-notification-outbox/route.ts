import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/cron-auth";
import { processNotificationOutbox } from "@/lib/notification-outbox";
import { withApiHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  "GET /api/cron/process-notification-outbox",
  async (req) => {
    const auth = requireCronSecret(req);
    if (!auth.ok) return auth.response;

    const result = await processNotificationOutbox();

    return NextResponse.json({
      message: result.skippedLock
        ? "Cron déjà en cours (advisory lock)"
        : `Outbox: ${result.sent} envoyé(s), ${result.failed} échec(s), ${result.dead} mort(s)`,
      ...result,
      ranAt: new Date().toISOString(),
    });
  }
);
