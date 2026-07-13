import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import { withApiHandler, throwForbidden, throwNotFound } from "@/lib/api-handler";
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
import { bookingMutationInclude } from "@/lib/booking-include";

export const dynamic = "force-dynamic";

const bookingInclude = {
  ...bookingMutationInclude,
  review: {
    select: { id: true, rating: true },
  },
};

/** PATCH — Client définit ou modifie la date/créneau de la prestation. */
export const PATCH = withApiHandler(
  "PATCH /api/bookings/[id]/schedule",
  async (req, { params }) => {
    const user = await requireAuthOrThrow(req);

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
      throwNotFound("Réservation introuvable");
    }

    const isClient = booking.clientId === user.userId;
    if (!isClient && user.role !== "ADMIN") {
      throwForbidden("Seul le client peut définir la date de prestation");
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
  }
);
