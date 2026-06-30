import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  BookingStatus,
  canTransitionStatus,
  prepareBookingForApi,
} from "@/lib/booking-status";
import {
  notifyBookingCancelled,
  notifyBookingCompleted,
  notifyBookingConfirmed,
} from "@/lib/notify-booking";
import {
  bookingStatusPatchSchema,
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
};

// PATCH - Mettre à jour le statut d'une réservation
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

    const parsed = parseBody(bookingStatusPatchSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const { status } = parsed.data;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation introuvable" },
        { status: 404 }
      );
    }

    const isProvider = booking.providerId === user.userId;
    const isClient = booking.clientId === user.userId;

    if (!isProvider && !isClient && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier cette réservation" },
        { status: 403 }
      );
    }

    const currentStatus = booking.status as BookingStatus;
    const nextStatus = status as BookingStatus;

    if (
      !canTransitionStatus(
        currentStatus,
        nextStatus,
        user.role,
        isProvider,
        isClient
      )
    ) {
      return NextResponse.json(
        { error: "Transition de statut non autorisée" },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const bookingRow = await tx.booking.update({
        where: { id },
        data: { status: nextStatus },
        include: bookingInclude,
      });

      if (nextStatus === "COMPLETED" && booking.requestResponseId) {
        await tx.requestResponse.update({
          where: { id: booking.requestResponseId },
          data: { status: "COMPLETED" },
        });
      }

      return bookingRow;
    });

    if (nextStatus === "CONFIRMED") {
      notifyBookingConfirmed(id).catch(console.error);
    } else if (nextStatus === "COMPLETED") {
      notifyBookingCompleted(id).catch(console.error);
    } else if (nextStatus === "CANCELLED") {
      notifyBookingCancelled(id).catch(console.error);
    }

    const messages: Record<BookingStatus, string> = {
      CONFIRMED: "Réservation confirmée",
      CANCELLED: "Réservation annulée",
      COMPLETED: "Prestation marquée comme terminée",
      PENDING: "",
    };

    return NextResponse.json({
      message: messages[nextStatus],
      booking: prepareBookingForApi(updated),
    });
  } catch (error) {
    console.error("[PATCH /api/bookings/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
