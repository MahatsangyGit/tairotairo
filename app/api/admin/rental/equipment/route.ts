import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withApiHandler } from "@/lib/api-handler";
import { serializeEquipment } from "@/lib/rental/equipment";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  "GET /api/admin/rental/equipment",
  async (req) => {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "PENDING_REVIEW";
    const items = await prisma.equipmentItem.findMany({
      where: {
        status: status as "PENDING_REVIEW",
        isPlatformOwned: false,
      },
      orderBy: { updatedAt: "asc" },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
      },
      take: 100,
    });
    return NextResponse.json({ items: items.map(serializeEquipment) });
  }
);
