import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import {
  withApiHandler,
  throwForbidden,
  throwNotFound,
} from "@/lib/api-handler";
import {
  patchEquipmentSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";
import { serializeEquipment } from "@/lib/rental/equipment";
import { deleteAllEquipmentPhotos } from "@/lib/storage/equipment-storage";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  "GET /api/rental/equipment/[id]",
  async (_req, { params }) => {
    const { id } = await params;
    const item = await prisma.equipmentItem.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
      },
    });
    if (!item) throwNotFound("Matériel introuvable");
    return NextResponse.json(serializeEquipment(item));
  }
);

export const PATCH = withApiHandler(
  "PATCH /api/rental/equipment/[id]",
  async (req, { params }) => {
    const user = await requireAuthOrThrow(req);
    const { id } = await params;
    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;
    const parsed = parseBody(patchEquipmentSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const item = await prisma.equipmentItem.findUnique({ where: { id } });
    if (!item) throwNotFound("Matériel introuvable");

    const isOwner = item.ownerId === user.userId;
    const isAdmin = user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      throwForbidden("Vous ne pouvez pas modifier ce matériel");
    }

    const data = parsed.data;
    if (data.status && !isAdmin) {
      // Owners may only move DRAFT ↔ PENDING_REVIEW or archive their own
      const allowedOwner = new Set(["DRAFT", "PENDING_REVIEW", "ARCHIVED"]);
      if (!allowedOwner.has(data.status)) {
        throw new AppError(
          "Seule la modération peut publier ou suspendre une annonce",
          403
        );
      }
      if (
        data.status === "PENDING_REVIEW" &&
        item.status !== "DRAFT" &&
        item.status !== "PENDING_REVIEW"
      ) {
        throw new AppError("Soumission pour revue non autorisée", 409);
      }
    }

    const updated = await prisma.equipmentItem.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.location !== undefined ? { location: data.location } : {}),
        ...(data.dailyPrice !== undefined
          ? { dailyPrice: data.dailyPrice }
          : {}),
        ...(data.depositAmount !== undefined
          ? { depositAmount: data.depositAmount }
          : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(serializeEquipment(updated));
  }
);

export const DELETE = withApiHandler(
  "DELETE /api/rental/equipment/[id]",
  async (req, { params }) => {
    const user = await requireAuthOrThrow(req);
    const { id } = await params;
    const item = await prisma.equipmentItem.findUnique({ where: { id } });
    if (!item) throwNotFound("Matériel introuvable");
    if (item.ownerId !== user.userId && user.role !== "ADMIN") {
      throwForbidden("Vous ne pouvez pas supprimer ce matériel");
    }

    const active = await prisma.rentalBooking.count({
      where: {
        equipmentId: id,
        status: {
          in: [
            "REQUESTED",
            "ACCEPTED",
            "PAID",
            "ONGOING",
            "RETURN_PENDING",
            "DISPUTED",
          ],
        },
      },
    });
    if (active > 0) {
      throw new AppError(
        "Impossible de supprimer : des locations actives existent",
        409
      );
    }

    await prisma.equipmentItem.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    await deleteAllEquipmentPhotos(id).catch(() => undefined);

    return NextResponse.json({ ok: true });
  }
);
