import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { parseListSearchParams } from "@/lib/advanced-search";
import { searchPublicRequests } from "@/lib/request-list-search";

// GET - Lister les demandes (?mine=true pour le client connecté)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mine = searchParams.get("mine") === "true";

    if (mine) {
      const user = requireAuth(req);

      if (!user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }

      if (user.role !== "CLIENT" && user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Réservé aux clients" },
          { status: 403 }
        );
      }

      const requests = await prisma.serviceRequest.findMany({
        where: { clientId: user.userId },
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { responses: true } },
        },
      });

      return NextResponse.json({ requests });
    }

    const params = parseListSearchParams(searchParams);
    const result = await searchPublicRequests(params);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/requests]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Publier une demande de service (client)
export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (user.role !== "CLIENT" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Seuls les clients peuvent publier une demande" },
        { status: 403 }
      );
    }

    const { title, description, budget, category, location, desiredDate } =
      await req.json();

    if (!title || !description || !budget || !category || !location) {
      return NextResponse.json(
        { error: "Titre, description, budget, catégorie et ville sont obligatoires" },
        { status: 400 }
      );
    }

    const parsedBudget = parseFloat(budget);
    if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
      return NextResponse.json({ error: "Budget invalide" }, { status: 400 });
    }

    const request = await prisma.serviceRequest.create({
      data: {
        title: String(title).trim(),
        description: String(description).trim(),
        budget: parsedBudget,
        category,
        location: String(location).trim(),
        desiredDate: desiredDate ? new Date(desiredDate) : null,
        clientId: user.userId,
      },
    });

    return NextResponse.json(
      { message: "Demande publiée avec succès", request },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/requests]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
