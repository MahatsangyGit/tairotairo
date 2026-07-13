import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/cron-auth";
import { expireSubscriptionSpotlights } from "@/lib/expire-subscriptions";
import { withApiHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export const GET = withApiHandler("GET /api/cron/expire-subscriptions", async (req) => {
  const auth = requireCronSecret(req);
  if (!auth.ok) return auth.response;

  const result = await expireSubscriptionSpotlights();

  return NextResponse.json({
    message:
      result.cleared > 0
        ? `${result.cleared} prestataire(s) retiré(s) de la mise en avant`
        : "Aucune mise en avant à retirer",
    ...result,
    ranAt: new Date().toISOString(),
  });
});
