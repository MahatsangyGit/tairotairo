import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  portfolioItemInclude,
  serializePortfolioItem,
} from "@/lib/portfolio-serialize";
import {
  parseBody,
  parseJsonBody,
  portfolioCommentSchema,
} from "@/lib/api-schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (auth.role !== "CLIENT" && auth.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Seuls les clients connectés peuvent commenter le portfolio" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(portfolioCommentSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const text = parsed.data.body;

    const item = await prisma.providerPortfolioItem.findUnique({
      where: { id },
      select: { id: true, providerId: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Réalisation introuvable" }, { status: 404 });
    }

    if (item.providerId === auth.userId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas commenter votre propre portfolio" },
        { status: 400 }
      );
    }

    await prisma.portfolioItemComment.create({
      data: {
        itemId: id,
        authorId: auth.userId,
        body: text,
      },
    });

    const updated = await prisma.providerPortfolioItem.findUnique({
      where: { id },
      include: portfolioItemInclude,
    });

    if (!updated) {
      return NextResponse.json({ error: "Réalisation introuvable" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Commentaire publié",
        item: serializePortfolioItem(updated),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/provider/portfolio/[id]/comments]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
