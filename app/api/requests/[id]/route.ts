import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, requireAuth } from "@/lib/auth";
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
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
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
  } catch (error) {
    console.error("[GET /api/requests/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Modifier une demande (propriétaire client)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(patchRequestSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const existing = await prisma.serviceRequest.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }

    if (existing.clientId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
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
  } catch (error) {
    console.error("[PATCH /api/requests/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une demande
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.serviceRequest.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }

    if (existing.clientId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    await snapshotBookingsForRequest(id);
    await deleteListingCoverFiles("request", id);
    await prisma.serviceRequest.delete({ where: { id } });

    return NextResponse.json({ message: "Demande supprimée" });
  } catch (error) {
    console.error("[DELETE /api/requests/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
