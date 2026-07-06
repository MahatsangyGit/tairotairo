import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertEmailVerified } from "@/lib/email-verification";
import { FIELD_LIMITS, validateOptionalText } from "@/lib/field-limits";
import {
  createReviewSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";

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

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
    const skip = (page - 1) * limit;

    const where = { targetId: providerId };

    const [reviews, total, aggregate] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: { id: true, name: true, avatar: true },
          },
        },
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    const averageRating = aggregate._avg.rating ?? 0;

    return NextResponse.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
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
    const user = await requireAuth(req);

    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const emailCheck = await assertEmailVerified(user.userId, user.role);
    if (!emailCheck.ok) {
      return NextResponse.json(
        { error: emailCheck.error },
        { status: emailCheck.status }
      );
    }

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(createReviewSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const { bookingId, rating, comment } = parsed.data;

    const commentCheck = validateOptionalText(
      comment,
      "Commentaire",
      FIELD_LIMITS.REVIEW_COMMENT
    );
    if (!commentCheck.ok) {
      return NextResponse.json({ error: commentCheck.error }, { status: 400 });
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
        comment: commentCheck.value,
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