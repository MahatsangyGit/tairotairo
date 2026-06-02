import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET - Propositions envoyées par le prestataire connecté
export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (user.role !== "PROVIDER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Réservé aux prestataires" },
        { status: 403 }
      );
    }

    const responses = await prisma.requestResponse.findMany({
      where: { providerId: user.userId },
      orderBy: { createdAt: "desc" },
      include: {
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
  } catch (error) {
    console.error("[GET /api/responses]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
