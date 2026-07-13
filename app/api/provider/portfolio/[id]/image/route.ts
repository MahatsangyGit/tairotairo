import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { readPortfolioImage } from "@/lib/portfolio-storage";
import {
  createImageResponse,
  isVersionedImageRequest,
} from "@/lib/image-response";
import { withApiHandler } from "@/lib/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  "GET /api/provider/portfolio/[id]/image",
  async (req, ctx) => {
    const { id } = await ctx.params;

    const item = await prisma.providerPortfolioItem.findUnique({
      where: { id },
      select: { storedName: true },
    });

    if (!item || item.storedName === "pending") {
      return NextResponse.json({ error: "Image introuvable" }, { status: 404 });
    }

    const file = await readPortfolioImage(id, item.storedName);
    if (!file) {
      return NextResponse.json({ error: "Image introuvable" }, { status: 404 });
    }

    return createImageResponse(req, file.buffer, file.mime, {
      versioned: isVersionedImageRequest(req),
    });
  }
);
