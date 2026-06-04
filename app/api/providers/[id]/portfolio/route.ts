import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  portfolioItemInclude,
  serializePortfolioItem,
} from "@/lib/portfolio-serialize";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const provider = await prisma.user.findUnique({
      where: { id, role: { in: ["PROVIDER", "ADMIN"] } },
      select: { id: true },
    });

    if (!provider) {
      return NextResponse.json({ error: "Prestataire introuvable" }, { status: 404 });
    }

    const items = await prisma.providerPortfolioItem.findMany({
      where: { providerId: id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: portfolioItemInclude,
    });

    return NextResponse.json({
      items: items.map(serializePortfolioItem),
    });
  } catch (error) {
    console.error("[GET /api/providers/[id]/portfolio]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
