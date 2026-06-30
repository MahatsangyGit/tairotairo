import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { SUBSCRIPTION_PERIOD_DAYS } from "@/lib/subscription";
import { activateProviderSubscription } from "@/lib/activate-provider-subscription";
import { disableProviderHomepageSpotlight } from "@/lib/provider-spotlight";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const months = Math.min(12, Math.max(1, parseInt(String(body.months ?? 1), 10) || 1));
    const notes =
      body.notes != null ? String(body.notes).trim().slice(0, 500) : undefined;

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
  } catch (error) {
    console.error("[POST /api/admin/providers/[id]/subscription]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;

    const { id } = await params;

    await prisma.providerSubscription.deleteMany({ where: { providerId: id } });
    await disableProviderHomepageSpotlight(id);

    return NextResponse.json({ message: "Abonnement retiré et mises en avant désactivées" });
  } catch (error) {
    console.error("[DELETE /api/admin/providers/[id]/subscription]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
