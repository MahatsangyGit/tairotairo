import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow, requireRole } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";
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

export const POST = withApiHandler(
  "POST /api/provider/portfolio/[id]/comments",
  async (req, ctx) => {
    const auth = await requireAuthOrThrow(req);
    requireRole(
      auth,
      ["CLIENT", "ADMIN"],
      "Seuls les clients connectés peuvent commenter le portfolio"
    );

    const { id } = await ctx.params;

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
  }
);
