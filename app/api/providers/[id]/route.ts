import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      return NextResponse.json(
        { error: "Prestataire introuvable" },
        { status: 404 }
      );
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
            (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10
          ) / 10
        : 0;

    const { phone: _phone, ...publicProvider } = provider;

    return NextResponse.json({
      provider: publicProvider,
      reviews,
      averageRating,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("[GET /api/providers/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
