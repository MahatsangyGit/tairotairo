import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withApiHandler, throwNotFound } from "@/lib/api-handler";

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

    const reviews = await prisma.review.findMany({
      where: { targetId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    const averageRating =
      reviews.length > 0
        ? Math.round(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) *
              10
          ) / 10
        : 0;

    const { phone: _phone, ...publicProvider } = provider;

    return NextResponse.json({
      provider: publicProvider,
      reviews,
      averageRating,
      totalReviews: reviews.length,
    });
  }
);
