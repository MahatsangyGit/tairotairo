import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow, requireRole } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";
import { assertEmailVerified } from "@/lib/email-verification";
import { setProviderFeaturedService } from "@/lib/provider-spotlight";
import {
  featuredServiceSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";

export const dynamic = "force-dynamic";

export const PATCH = withApiHandler("PATCH /api/provider/featured-service", async (req) => {
  const auth = await requireAuthOrThrow(req);
  requireRole(auth, "PROVIDER", "Réservé aux prestataires");

  const emailCheck = await assertEmailVerified(auth.userId, auth.role);
  if (!emailCheck.ok) {
    return NextResponse.json(
      { error: emailCheck.error },
      { status: emailCheck.status }
    );
  }

  const json = await parseJsonBody(req);
  if (!json.ok) return json.response;

  const parsed = parseBody(featuredServiceSchema, json.body);
  if (!parsed.ok) return parsed.response;

  const { serviceId } = parsed.data;

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
});
