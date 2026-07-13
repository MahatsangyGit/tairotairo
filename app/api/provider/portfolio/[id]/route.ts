import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow, requireRole } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";
import { PORTFOLIO_MAX_DESCRIPTION_LENGTH } from "@/lib/portfolio";
import {
  portfolioItemInclude,
  serializePortfolioItem,
} from "@/lib/portfolio-serialize";
import {
  deletePortfolioItemFiles,
  savePortfolioImage,
  validatePortfolioImageFile,
} from "@/lib/portfolio-storage";
import {
  parseBody,
  parseJsonBody,
  portfolioDescriptionPatchSchema,
} from "@/lib/api-schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getOwnedItem(itemId: string, providerId: string) {
  return prisma.providerPortfolioItem.findFirst({
    where: { id: itemId, providerId },
  });
}

export const PATCH = withApiHandler(
  "PATCH /api/provider/portfolio/[id]",
  async (req, ctx) => {
    const auth = await requireAuthOrThrow(req);
    requireRole(auth, ["PROVIDER", "ADMIN"], "Réservé aux prestataires");

    const { id } = await ctx.params;
    const existing = await getOwnedItem(id, auth.userId);

    if (!existing) {
      return NextResponse.json({ error: "Réalisation introuvable" }, { status: 404 });
    }

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const descriptionRaw = formData.get("description");
      const file = formData.get("file");

      const data: {
        description?: string;
        storedName?: string;
        mimeType?: string;
        sizeBytes?: number;
      } = {};

      if (descriptionRaw != null) {
        const description = String(descriptionRaw).trim();
        if (!description) {
          return NextResponse.json(
            { error: "La description est obligatoire" },
            { status: 400 }
          );
        }
        if (description.length > PORTFOLIO_MAX_DESCRIPTION_LENGTH) {
          return NextResponse.json(
            { error: `Description trop longue (max ${PORTFOLIO_MAX_DESCRIPTION_LENGTH} caractères)` },
            { status: 400 }
          );
        }
        data.description = description;
      }

      if (file instanceof File && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const validation = validatePortfolioImageFile(file, buffer);
        if (!validation.ok) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        const saved = await savePortfolioImage(id, buffer, validation.mime);
        data.storedName = saved.storedName;
        data.mimeType = saved.mime;
        data.sizeBytes = saved.sizeBytes;
      }

      const updated = await prisma.providerPortfolioItem.update({
        where: { id },
        data,
        include: portfolioItemInclude,
      });

      return NextResponse.json({
        message: "Réalisation mise à jour",
        item: serializePortfolioItem(updated),
      });
    }

    const bodyJson = await parseJsonBody(req);
    if (!bodyJson.ok) return bodyJson.response;

    const parsed = parseBody(portfolioDescriptionPatchSchema, bodyJson.body);
    if (!parsed.ok) return parsed.response;

    const { description } = parsed.data;

    if (description !== undefined) {
      if (!description) {
        return NextResponse.json(
          { error: "La description est obligatoire" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.providerPortfolioItem.update({
      where: { id },
      data: {
        ...(description !== undefined && { description }),
      },
      include: portfolioItemInclude,
    });

    return NextResponse.json({
      message: "Réalisation mise à jour",
      item: serializePortfolioItem(updated),
    });
  }
);

export const DELETE = withApiHandler(
  "DELETE /api/provider/portfolio/[id]",
  async (req, ctx) => {
    const auth = await requireAuthOrThrow(req);
    requireRole(auth, ["PROVIDER", "ADMIN"], "Réservé aux prestataires");

    const { id } = await ctx.params;
    const existing = await getOwnedItem(id, auth.userId);

    if (!existing) {
      return NextResponse.json({ error: "Réalisation introuvable" }, { status: 404 });
    }

    await prisma.providerPortfolioItem.delete({ where: { id } });
    await deletePortfolioItemFiles(id);

    return NextResponse.json({ message: "Réalisation supprimée" });
  }
);
