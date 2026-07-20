import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withApiHandler, throwNotFound } from "@/lib/api-handler";
import { readEquipmentPhotoByKey } from "@/lib/storage/equipment-storage";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  "GET /api/rental/equipment/[id]/photos/[index]",
  async (_req, { params }) => {
    const { id, index: indexRaw } = await params;
    const index = parseInt(indexRaw, 10);
    if (!Number.isFinite(index) || index < 0) {
      throwNotFound("Photo introuvable");
    }

    const item = await prisma.equipmentItem.findUnique({
      where: { id },
      select: { photoKeys: true, status: true },
    });
    if (!item) throwNotFound("Matériel introuvable");

    const key = item.photoKeys[index];
    if (!key) throwNotFound("Photo introuvable");

    const file = await readEquipmentPhotoByKey(key);
    if (!file) throwNotFound("Photo introuvable");

    return new NextResponse(new Uint8Array(file.buffer), {
      headers: {
        "Content-Type": file.mime,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  }
);
