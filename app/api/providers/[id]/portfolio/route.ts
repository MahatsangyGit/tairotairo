import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withApiHandler, throwNotFound } from "@/lib/api-handler";
import {
  portfolioItemInclude,
  serializePortfolioItem,
} from "@/lib/portfolio-serialize";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  "GET /api/providers/[id]/portfolio",
  async (_req, { params }) => {
    const { id } = await params;

    const provider = await prisma.user.findUnique({
      where: { id, role: { in: ["PROVIDER", "ADMIN"] } },
      select: { id: true },
    });

    if (!provider) {
      throwNotFound("Prestataire introuvable");
    }

    const items = await prisma.providerPortfolioItem.findMany({
      where: { providerId: id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: portfolioItemInclude,
    });

    return NextResponse.json({
      items: items.map(serializePortfolioItem),
    });
  }
);
