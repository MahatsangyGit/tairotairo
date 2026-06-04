import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { SERVICE_CATEGORIES } from "@/lib/categories";
import { snapshotBookingsForRequest } from "@/lib/booking-snapshot";
import {
  parseScheduleInput,
  scheduleFieldsForDb,
} from "@/lib/datetime-slot";

// GET - Détail d'une demande
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    return NextResponse.json({ request });
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
    const user = requireAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.serviceRequest.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }

    if (existing.clientId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { title, description, budget, category, location, open } = body;

    let desiredPatch:
      | {
          desiredDate: Date | null;
          desiredSlotStart: string | null;
          desiredSlotEnd: string | null;
        }
      | undefined;

    if (
      body.desiredDate !== undefined ||
      body.desiredSlotStart !== undefined ||
      body.desiredSlotEnd !== undefined
    ) {
      const schedule = parseScheduleInput({
        desiredDate: body.desiredDate,
        desiredSlotStart: body.desiredSlotStart,
        desiredSlotEnd: body.desiredSlotEnd,
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

    if (
      category &&
      !(SERVICE_CATEGORIES as readonly string[]).includes(category)
    ) {
      return NextResponse.json({ error: "Catégorie invalide" }, { status: 400 });
    }

    if (budget !== undefined) {
      const parsedBudget = parseFloat(budget);
      if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
        return NextResponse.json({ error: "Budget invalide" }, { status: 400 });
      }
    }

    const updated = await prisma.serviceRequest.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: String(title).trim() }),
        ...(description !== undefined && {
          description: String(description).trim(),
        }),
        ...(budget !== undefined && { budget: parseFloat(budget) }),
        ...(category !== undefined && { category }),
        ...(location !== undefined && { location: String(location).trim() }),
        ...desiredPatch,
        ...(open !== undefined && { open: Boolean(open) }),
      },
    });

    return NextResponse.json({
      message: "Demande mise à jour",
      request: updated,
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
    const user = requireAuth(req);

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
    await prisma.serviceRequest.delete({ where: { id } });

    return NextResponse.json({ message: "Demande supprimée" });
  } catch (error) {
    console.error("[DELETE /api/requests/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
