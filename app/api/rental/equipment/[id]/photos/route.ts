import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import {
  withApiHandler,
  throwForbidden,
  throwNotFound,
} from "@/lib/api-handler";
import { API_RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import {
  EQUIPMENT_MAX_PHOTOS,
  saveEquipmentPhoto,
  validateEquipmentPhotoFile,
} from "@/lib/storage/equipment-storage";
import { serializeEquipment } from "@/lib/rental/equipment";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(
  "POST /api/rental/equipment/[id]/photos",
  async (req, { params }) => {
    const user = await requireAuthOrThrow(req);
    const limited = await enforceRateLimit(
      req,
      "upload:equipment",
      API_RATE_LIMITS.upload,
      { userId: user.userId }
    );
    if (limited) return limited;

    const { id } = await params;
    const item = await prisma.equipmentItem.findUnique({ where: { id } });
    if (!item) throwNotFound("Matériel introuvable");
    if (item.ownerId !== user.userId && user.role !== "ADMIN") {
      throwForbidden("Accès refusé");
    }

    if (item.photoKeys.length >= EQUIPMENT_MAX_PHOTOS) {
      throw new AppError(
        `Maximum ${EQUIPMENT_MAX_PHOTOS} photos par matériel`,
        400
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new AppError("Fichier manquant", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const validated = validateEquipmentPhotoFile(file, buffer);
    if (!validated.ok) {
      throw new AppError(validated.error, 400);
    }

    const index = item.photoKeys.length;
    const key = await saveEquipmentPhoto(id, index, buffer);
    const updated = await prisma.equipmentItem.update({
      where: { id },
      data: { photoKeys: { push: key } },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(serializeEquipment(updated), { status: 201 });
  }
);
