import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET - Lister les avis d'un prestataire
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get("providerId");

    if (!providerId) {
      return NextResponse.json(
        { error: "providerId est obligatoire" },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: { targetId: providerId },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return NextResponse.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      total: reviews.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer un avis
export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);

    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const { bookingId, rating, comment } = await req.json();

    if (!bookingId || !rating) {
      return NextResponse.json(
        { error: "bookingId et rating sont obligatoires" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "La note doit être entre 1 et 5" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation introuvable" },
        { status: 404 }
      );
    }

    if (booking.clientId !== user.userId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas noter cette réservation" },
        { status: 403 }
      );
    }

    if (booking.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "La prestation doit être terminée avant de laisser un avis" },
        { status: 400 }
      );
    }

    const existingReview = await prisma.review.findUnique({
      where: { bookingId },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "Vous avez déjà laissé un avis pour cette réservation" },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        authorId: user.userId,
        targetId: booking.providerId,
        bookingId,
        rating,
        comment,
      },
    });

    return NextResponse.json(
      { message: "Avis publié avec succès", review },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}