import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { setProviderFeaturedService } from "@/lib/provider-spotlight";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (auth.role !== "PROVIDER") {
      return NextResponse.json({ error: "Réservé aux prestataires" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const serviceId =
      body.serviceId === null || body.serviceId === undefined
        ? null
        : String(body.serviceId).trim();

    if (serviceId === "") {
      return NextResponse.json({ error: "serviceId invalide" }, { status: 400 });
    }

    const result = await setProviderFeaturedService(auth.userId, serviceId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const featuredService =
      serviceId === null
        ? null
        : await prisma.service.findFirst({
            where: { id: serviceId, providerId: auth.userId },
            select: { id: true, title: true, featuredOnHomepage: true },
          });

    return NextResponse.json({
      message:
        serviceId === null
          ? "Mise en avant de l'annonce retirée"
          : "Annonce mise en avant sur l'accueil",
      featuredService,
    });
  } catch (error) {
    console.error("[PATCH /api/provider/featured-service]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
