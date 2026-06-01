import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET - Lister les réservations de l'utilisateur connecté
export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);

    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const bookings = await prisma.booking.findMany({
      where: {
        ...(user.role === "CLIENT"
          ? { clientId: user.userId }
          : { providerId: user.userId }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            price: true,
            category: true,
            location: true,
          },
        },
        requestResponse: {
          select: {
            proposedPrice: true,
            request: {
              select: {
                id: true,
                title: true,
                budget: true,
                category: true,
                location: true,
              },
            },
          },
        },
        client: {
          select: { id: true, name: true, phone: true, email: true },
        },
        provider: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    return NextResponse.json({ bookings, role: user.role });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer une réservation
export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);

    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    if (user.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Seuls les clients peuvent faire une réservation" },
        { status: 403 }
      );
    }

    const { serviceId, date } = await req.json();

    if (!serviceId || !date) {
      return NextResponse.json(
        { error: "serviceId et date sont obligatoires" },
        { status: 400 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || !service.available) {
      return NextResponse.json(
        { error: "Service introuvable ou indisponible" },
        { status: 404 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        clientId: user.userId,
        providerId: service.providerId,
        serviceId,
        date: new Date(date),
      },
      include: {
        service: {
          select: { title: true, price: true },
        },
      },
    });

    return NextResponse.json(
      { message: "Réservation créée avec succès", booking },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}