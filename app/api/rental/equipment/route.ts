import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";
import {
  createEquipmentSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";
import {
  searchEquipment,
  serializeEquipment,
} from "@/lib/rental/equipment";
import { jsonWithPublicCache } from "@/lib/cache";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const GET = withApiHandler("GET /api/rental/equipment", async (req) => {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10) || 12)
  );

  if (mine) {
    const user = await requireAuthOrThrow(req);
    const result = await searchEquipment({
      mine: true,
      ownerId: user.userId,
      search: searchParams.get("search") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      page,
      limit,
    });
    return NextResponse.json({
      ...result,
      items: result.items.map(serializeEquipment),
    });
  }

  const result = await searchEquipment({
    search: searchParams.get("search") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    location: searchParams.get("location") ?? undefined,
    page,
    limit,
  });

  return jsonWithPublicCache({
    ...result,
    items: result.items.map(serializeEquipment),
  });
});

export const POST = withApiHandler(
  "POST /api/rental/equipment",
  async (req) => {
    const user = await requireAuthOrThrow(req);
    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(createEquipmentSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const {
      title,
      description,
      category,
      location,
      dailyPrice,
      depositAmount,
      isPlatformOwned,
      submitForReview,
    } = parsed.data;

    if (dailyPrice < 0 || depositAmount < 0) {
      throw new AppError("Montants invalides", 400);
    }

    const platform =
      user.role === "ADMIN" && isPlatformOwned === true ? true : false;

    let status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" = "DRAFT";
    if (platform) {
      status = "PUBLISHED";
    } else if (submitForReview) {
      status = "PENDING_REVIEW";
    }

    const item = await prisma.equipmentItem.create({
      data: {
        title,
        description,
        category,
        location,
        dailyPrice,
        depositAmount,
        isPlatformOwned: platform,
        status,
        ownerId: user.userId,
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(serializeEquipment(item), { status: 201 });
  }
);
