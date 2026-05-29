import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  BookingStatus,
  canTransitionStatus,
} from "@/lib/booking-status";

const VALID_STATUSES: BookingStatus[] = [
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
];

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
    const user = requireAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Statut invalide (CONFIRMED, CANCELLED ou COMPLETED)" },
        { status: 400 }
      );
    }

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

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: nextStatus },
      include: bookingInclude,
    });

    const messages: Record<BookingStatus, string> = {
      CONFIRMED: "Réservation confirmée",
      CANCELLED: "Réservation annulée",
      COMPLETED: "Prestation marquée comme terminée",
      PENDING: "",
    };

    return NextResponse.json({
      message: messages[nextStatus],
      booking: updated,
    });
  } catch (error) {
    console.error("[PATCH /api/bookings/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
