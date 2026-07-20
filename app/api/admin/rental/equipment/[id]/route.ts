import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withApiHandler, throwNotFound } from "@/lib/api-handler";
import {
  adminEquipmentReviewSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";
import { serializeEquipment } from "@/lib/rental/equipment";
import {
  notifyEquipmentApproved,
  notifyEquipmentRejected,
} from "@/lib/rental/notify";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const PATCH = withApiHandler(
  "PATCH /api/admin/rental/equipment/[id]",
  async (req, { params }) => {
    await requireAdmin(req);
    const { id } = await params;
    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;
    const parsed = parseBody(adminEquipmentReviewSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const item = await prisma.equipmentItem.findUnique({ where: { id } });
    if (!item) throwNotFound("Matériel introuvable");
    if (item.status !== "PENDING_REVIEW") {
      throw new AppError("Cette annonce n'est pas en attente de revue", 409);
    }

    if (parsed.data.action === "approve") {
      const updated = await prisma.equipmentItem.update({
        where: { id },
        data: { status: "PUBLISHED", rejectionReason: null },
        include: {
          owner: { select: { id: true, name: true, avatar: true } },
        },
      });
      await notifyEquipmentApproved(id, item.ownerId);
      return NextResponse.json(serializeEquipment(updated));
    }

    const updated = await prisma.equipmentItem.update({
      where: { id },
      data: {
        status: "DRAFT",
        rejectionReason:
          parsed.data.reason?.trim() || "Refusé par la modération",
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
      },
    });
    await notifyEquipmentRejected(id, item.ownerId, parsed.data.reason);
    return NextResponse.json(serializeEquipment(updated));
  }
);
