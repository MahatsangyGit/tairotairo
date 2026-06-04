import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { parseListSearchParams } from "@/lib/advanced-search";
import { searchPublicServices } from "@/lib/service-list-search";

// GET - Lister et rechercher les services (?mine=true pour le prestataire connecté)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mine = searchParams.get("mine") === "true";

    if (mine) {
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

      const services = await prisma.service.findMany({
        where: { providerId: user.userId },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ services });
    }

    const params = parseListSearchParams(searchParams);
    const result = await searchPublicServices(params);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer un service
export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);

    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    if (user.role !== "PROVIDER") {
      return NextResponse.json(
        { error: "Seuls les prestataires peuvent créer un service" },
        { status: 403 }
      );
    }

    const { title, description, price, category, location } = await req.json();

    if (!title || !description || !price || !category || !location) {
      return NextResponse.json(
        { error: "Tous les champs sont obligatoires" },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        category,
        location,
        providerId: user.userId,
      },
    });

    return NextResponse.json(
      { message: "Service créé avec succès", service },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}