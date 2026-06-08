import { NextRequest, NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/cron-auth";
import { expireSubscriptionSpotlights } from "@/lib/expire-subscriptions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
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
  } catch (error) {
    console.error("[GET /api/cron/expire-subscriptions]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
