import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { prepareBookingForApi, normalizeBookingStatus } from "@/lib/booking-status";
import {
  parseScheduleInput,
  scheduleFieldsForDb,
} from "@/lib/datetime-slot";
import {
  bookingSchedulePatchSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";

export const dynamic = "force-dynamic";

const bookingInclude = {
  service: {
    select: {
      id: true,
      title: true,
      price: true,
      category: true,
      location: true,
    },
  },
  requestResponse: {
    select: {
      proposedPrice: true,
      status: true,
      request: {
        select: {
          id: true,
          title: true,
          budget: true,
          category: true,
          location: true,
        },
      },
    },
  },
  client: {
    select: { id: true, name: true, phone: true, email: true },
  },
  provider: {
    select: { id: true, name: true, phone: true },
  },
  transaction: {
    select: {
      id: true,
      amount: true,
      status: true,
      paymentMethod: true,
      escrowedAt: true,
      releasedAt: true,
      refundedAt: true,
    },
  },
  review: {
    select: { id: true, rating: true },
  },
};

/** PATCH — Client définit ou modifie la date/créneau de la prestation. */
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

    const parsed = parseBody(bookingSchedulePatchSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, status: true, clientId: true, providerId: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation introuvable" },
        { status: 404 }
      );
    }

    const isClient = booking.clientId === user.userId;
    if (!isClient && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Seul le client peut définir la date de prestation" },
        { status: 403 }
      );
    }

    const status = normalizeBookingStatus(booking.status);
    if (status === "COMPLETED" || status === "CANCELLED") {
      return NextResponse.json(
        { error: "Impossible de modifier la date d'une réservation terminée ou annulée" },
        { status: 400 }
      );
    }

    const schedule = parseScheduleInput({
      date: parsed.data.date,
      slotStart: parsed.data.slotStart,
      slotEnd: parsed.data.slotEnd,
    });

    if (schedule.error) {
      return NextResponse.json({ error: schedule.error }, { status: 400 });
    }

    // Exiger une date réelle (pas de clear volontaire pour l'instant).
    if (!schedule.date) {
      return NextResponse.json(
        { error: "Indiquez une date de prestation" },
        { status: 400 }
      );
    }

    const fields = scheduleFieldsForDb(schedule);

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        date: fields.date,
        slotStart: fields.slotStart,
        slotEnd: fields.slotEnd,
      },
      include: bookingInclude,
    });

    return NextResponse.json({
      message: "Date de prestation mise à jour",
      booking: prepareBookingForApi(updated),
    });
  } catch (error) {
    console.error("[PATCH /api/bookings/[id]/schedule]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
