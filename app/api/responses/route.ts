import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow, requireRole } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";

// GET - Propositions envoyées par le prestataire connecté
export const GET = withApiHandler("GET /api/responses", async (req) => {
  const user = await requireAuthOrThrow(req);
  requireRole(user, ["PROVIDER", "ADMIN"], "Réservé aux prestataires");

  const responses = await prisma.requestResponse.findMany({
    where: { providerId: user.userId },
    orderBy: { createdAt: "desc" },
    include: {
      booking: { select: { id: true, status: true } },
      request: {
        select: {
          id: true,
          title: true,
          category: true,
          location: true,
          budget: true,
          open: true,
          client: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  return NextResponse.json({ responses });
});
