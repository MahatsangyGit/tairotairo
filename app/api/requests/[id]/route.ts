import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, requireAuthOrThrow } from "@/lib/auth";
import {
  withApiHandler,
  throwForbidden,
  throwNotFound,
} from "@/lib/api-handler";
import { canViewRequestClientPhone } from "@/lib/contact-privacy";
import { snapshotBookingsForRequest } from "@/lib/booking-snapshot";
import { withCoverImageUrl } from "@/lib/listing-cover";
import { deleteListingCoverFiles } from "@/lib/listing-cover-storage";
import {
  parseScheduleInput,
  scheduleFieldsForDb,
} from "@/lib/datetime-slot";
import {
  parseBody,
  parseJsonBody,
  patchRequestSchema,
} from "@/lib/api-schemas";

// GET - Détail d'une demande
export const GET = withApiHandler(
  "GET /api/requests/[id]",
  async (req, { params }) => {
    const { id } = await params;
    const viewer = await getAuthUser(req);

    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
          },
        },
      },
    });

    if (!request) {
      throwNotFound("Demande introuvable");
    }

    const showClientPhone = await canViewRequestClientPhone(
      id,
      request.clientId,
      viewer
    );

    const client = {
      id: request.client.id,
      name: request.client.name,
      avatar: request.client.avatar,
      phone: showClientPhone ? request.client.phone : null,
    };

    const { client: _client, ...requestFields } = request;

    return NextResponse.json({
      request: withCoverImageUrl("request", { ...requestFields, client }),
    });
  }
);

// PATCH - Modifier une demande (propriétaire client)
export const PATCH = withApiHandler(
  "PATCH /api/requests/[id]",
  async (req, { params }) => {
    const user = await requireAuthOrThrow(req);
    const { id } = await params;

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(patchRequestSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const existing = await prisma.serviceRequest.findUnique({ where: { id } });

    if (!existing) {
      throwNotFound("Demande introuvable");
    }

    if (existing.clientId !== user.userId && user.role !== "ADMIN") {
      throwForbidden("Accès refusé");
    }

    const {
      title,
      description,
      budget,
      category,
      location,
      open,
      desiredDate,
      desiredSlotStart,
      desiredSlotEnd,
    } = parsed.data;

    let desiredPatch:
      | {
          desiredDate: Date | null;
          desiredSlotStart: string | null;
          desiredSlotEnd: string | null;
        }
      | undefined;

    if (
      desiredDate !== undefined ||
      desiredSlotStart !== undefined ||
      desiredSlotEnd !== undefined
    ) {
      const schedule = parseScheduleInput({
        desiredDate,
        desiredSlotStart,
        desiredSlotEnd,
      });

      if (schedule.error) {
        return NextResponse.json({ error: schedule.error }, { status: 400 });
      }

      const desired = scheduleFieldsForDb(schedule);
      desiredPatch = {
        desiredDate: desired.date,
        desiredSlotStart: desired.slotStart,
        desiredSlotEnd: desired.slotEnd,
      };
    }

    const updated = await prisma.serviceRequest.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(budget !== undefined && { budget }),
        ...(category !== undefined && { category }),
        ...(location !== undefined && { location }),
        ...desiredPatch,
        ...(open !== undefined && { open }),
      },
    });

    return NextResponse.json({
      message: "Demande mise à jour",
      request: withCoverImageUrl("request", updated),
    });
  }
);

// DELETE - Supprimer une demande
export const DELETE = withApiHandler(
  "DELETE /api/requests/[id]",
  async (req, { params }) => {
    const user = await requireAuthOrThrow(req);
    const { id } = await params;

    const existing = await prisma.serviceRequest.findUnique({ where: { id } });

    if (!existing) {
      throwNotFound("Demande introuvable");
    }

    if (existing.clientId !== user.userId && user.role !== "ADMIN") {
      throwForbidden("Accès refusé");
    }

    await snapshotBookingsForRequest(id);
    await deleteListingCoverFiles("request", id);
    await prisma.serviceRequest.delete({ where: { id } });

    return NextResponse.json({ message: "Demande supprimée" });
  }
);
