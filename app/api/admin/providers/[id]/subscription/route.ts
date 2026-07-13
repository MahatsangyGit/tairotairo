import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withApiHandler } from "@/lib/api-handler";
import { requireAdmin } from "@/lib/admin-auth";
import { SUBSCRIPTION_PERIOD_DAYS } from "@/lib/subscription";
import { activateProviderSubscription } from "@/lib/activate-provider-subscription";
import { disableProviderHomepageSpotlight } from "@/lib/provider-spotlight";
import {
  adminSubscriptionSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(
  "POST /api/admin/providers/[id]/subscription",
  async (req, { params }) => {
    const auth = await requireAdmin(req);

    const { id } = await params;

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(adminSubscriptionSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const { months, notes } = parsed.data;

    const provider = await prisma.user.findUnique({
      where: { id, role: "PROVIDER" },
      select: { id: true },
    });

    if (!provider) {
      return NextResponse.json({ error: "Prestataire introuvable" }, { status: 404 });
    }

    const activation = await activateProviderSubscription(
      id,
      months,
      notes ?? `Attribué par admin`
    );

    return NextResponse.json({
      message: `Abonnement prolongé de ${months} période(s) (${SUBSCRIPTION_PERIOD_DAYS} jours chacune). ${activation.message}`,
      subscription: activation.subscription,
      spotlightEnabled: activation.spotlightEnabled,
    });
  }
);

export const DELETE = withApiHandler(
  "DELETE /api/admin/providers/[id]/subscription",
  async (req, { params }) => {
    const auth = await requireAdmin(req);

    const { id } = await params;

    await prisma.providerSubscription.deleteMany({ where: { providerId: id } });
    await disableProviderHomepageSpotlight(id);

    return NextResponse.json({ message: "Abonnement retiré et mises en avant désactivées" });
  }
);
