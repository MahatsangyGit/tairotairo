import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withApiHandler, throwNotFound } from "@/lib/api-handler";
import { paidReviewWhere } from "@/lib/paid-reviews";
import { withEiFlag } from "@/lib/provider-legal";

export const GET = withApiHandler(
  "GET /api/providers/[id]",
  async (_req, { params }) => {
    const { id } = await params;

    const provider = await prisma.user.findUnique({
      where: { id, role: { in: ["PROVIDER", "ADMIN"] } },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        phone: true,
        emailVerified: true,
        nif: true,
        stat: true,
        rcs: true,
        createdAt: true,
        services: {
          where: { available: true },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            category: true,
            location: true,
          },
        },
      },
    });

    if (!provider) {
      throwNotFound("Prestataire introuvable");
    }

    const where = paidReviewWhere(id);

    const [reviews, totalReviews, aggregate] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
        },
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({
        where,
        _avg: { rating: true },
      }),
    ]);

    const averageRating = aggregate._avg.rating
      ? Math.round(aggregate._avg.rating * 10) / 10
      : 0;

    const { phone: _phone, ...publicProvider } = provider;

    return NextResponse.json({
      provider: withEiFlag(publicProvider),
      reviews,
      averageRating,
      totalReviews,
    });
  }
);
