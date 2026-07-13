import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow, requireRole } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";
import { assertEmailVerified } from "@/lib/email-verification";
import {
  PORTFOLIO_MAX_DESCRIPTION_LENGTH,
  PORTFOLIO_MAX_ITEMS,
} from "@/lib/portfolio";
import {
  portfolioItemInclude,
  serializePortfolioItem,
} from "@/lib/portfolio-serialize";
import {
  savePortfolioImage,
  validatePortfolioImageFile,
} from "@/lib/portfolio-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler("GET /api/provider/portfolio", async (req) => {
  const auth = await requireAuthOrThrow(req);
  requireRole(auth, ["PROVIDER", "ADMIN"], "Réservé aux prestataires");

  const items = await prisma.providerPortfolioItem.findMany({
    where: { providerId: auth.userId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: portfolioItemInclude,
  });

  return NextResponse.json({
    items: items.map(serializePortfolioItem),
    maxItems: PORTFOLIO_MAX_ITEMS,
  });
});

export const POST = withApiHandler("POST /api/provider/portfolio", async (req) => {
  const auth = await requireAuthOrThrow(req);
  requireRole(auth, "PROVIDER", "Réservé aux prestataires");

  const emailCheck = await assertEmailVerified(auth.userId, auth.role);
  if (!emailCheck.ok) {
    return NextResponse.json(
      { error: emailCheck.error },
      { status: emailCheck.status }
    );
  }

  const count = await prisma.providerPortfolioItem.count({
    where: { providerId: auth.userId },
  });

  if (count >= PORTFOLIO_MAX_ITEMS) {
    return NextResponse.json(
      { error: `Maximum ${PORTFOLIO_MAX_ITEMS} réalisations dans le portfolio` },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const description = String(formData.get("description") ?? "").trim();

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

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image requise" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = validatePortfolioImageFile(file, buffer);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const item = await prisma.providerPortfolioItem.create({
    data: {
      providerId: auth.userId,
      description,
      storedName: "pending",
      mimeType: validation.mime,
      sizeBytes: file.size,
      sortOrder: count,
    },
  });

  let saved: Awaited<ReturnType<typeof savePortfolioImage>>;
  try {
    saved = await savePortfolioImage(item.id, buffer, validation.mime);
  } catch (saveError) {
    await prisma.providerPortfolioItem.delete({ where: { id: item.id } });
    throw saveError;
  }

  const updated = await prisma.providerPortfolioItem.update({
    where: { id: item.id },
    data: {
      storedName: saved.storedName,
      mimeType: saved.mime,
      sizeBytes: saved.sizeBytes,
    },
    include: portfolioItemInclude,
  });

  return NextResponse.json(
    {
      message: "Réalisation ajoutée au portfolio",
      item: serializePortfolioItem(updated),
    },
    { status: 201 }
  );
});
