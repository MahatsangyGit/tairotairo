import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  RequestResponseStatus,
  canTransitionResponseStatus,
} from "@/lib/request-response-status";
import {
  resolveBookingSchedule,
  snapshotFromRequest,
} from "@/lib/booking-display";
import { notifyBookingConfirmed } from "@/lib/notify-booking";
import { notifyRequestResponseAccepted } from "@/lib/notify-requests";

const VALID_STATUSES: RequestResponseStatus[] = [
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
];

const responseInclude = {
  provider: {
    select: { id: true, name: true, avatar: true, phone: true, bio: true },
  },
  request: {
    select: {
      id: true,
      title: true,
      clientId: true,
      open: true,
    },
  },
  booking: { select: { id: true, status: true } },
};

// PATCH - Accepter / refuser / retirer une proposition
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  try {
    const user = await requireAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id, responseId } = await params;
    const { status } = await req.json();

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Statut invalide (ACCEPTED, REJECTED ou WITHDRAWN)" },
        { status: 400 }
      );
    }

    const response = await prisma.requestResponse.findUnique({
      where: { id: responseId },
      include: {
        booking: { select: { id: true } },
        request: {
          select: {
            id: true,
            clientId: true,
            open: true,
            desiredDate: true,
            desiredSlotStart: true,
            desiredSlotEnd: true,
          },
        },
      },
    });

    if (!response || response.requestId !== id) {
      return NextResponse.json(
        { error: "Proposition introuvable" },
        { status: 404 }
      );
    }

    const isClientOwner = response.request.clientId === user.userId;
    const isProvider = response.providerId === user.userId;
    const currentStatus = response.status as RequestResponseStatus;
    const nextStatus = status as RequestResponseStatus;

    if (
      !canTransitionResponseStatus(
        currentStatus,
        nextStatus,
        user.role,
        isClientOwner,
        isProvider
      )
    ) {
      return NextResponse.json(
        { error: "Transition de statut non autorisée" },
        { status: 400 }
      );
    }

    if (nextStatus === "ACCEPTED") {
      if (response.booking) {
        return NextResponse.json(
          { error: "Une réservation existe déjà pour cette proposition" },
          { status: 400 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        await tx.requestResponse.updateMany({
          where: {
            requestId: id,
            id: { not: responseId },
            status: "PENDING",
          },
          data: { status: "REJECTED" },
        });

        const accepted = await tx.requestResponse.update({
          where: { id: responseId },
          data: { status: "ACCEPTED" },
          include: responseInclude,
        });

        await tx.serviceRequest.update({
          where: { id },
          data: { open: false },
        });

        const requestForSnapshot = await tx.serviceRequest.findUniqueOrThrow({
          where: { id },
          select: {
            id: true,
            title: true,
            budget: true,
            category: true,
            location: true,
          },
        });

        const schedule = resolveBookingSchedule({
          desiredDate: response.request.desiredDate,
          desiredSlotStart: response.request.desiredSlotStart,
          desiredSlotEnd: response.request.desiredSlotEnd,
        });

        const booking = await tx.booking.create({
          data: {
            clientId: response.request.clientId,
            providerId: response.providerId,
            requestResponseId: responseId,
            date: schedule.date,
            slotStart: schedule.slotStart,
            slotEnd: schedule.slotEnd,
            status: "CONFIRMED",
            ...snapshotFromRequest(
              requestForSnapshot,
              response.proposedPrice
            ),
          },
          include: {
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
          },
        });

        return { accepted, booking };
      });

      notifyBookingConfirmed(result.booking.id).catch(console.error);
      notifyRequestResponseAccepted(
        id,
        response.providerId,
        result.accepted.request.title
      ).catch(console.error);

      return NextResponse.json({
        message:
          "Proposition acceptée — une réservation a été créée et la demande est fermée",
        response: result.accepted,
        booking: result.booking,
      });
    }

    const updated = await prisma.requestResponse.update({
      where: { id: responseId },
      data: { status: nextStatus },
      include: responseInclude,
    });

    const messages: Record<RequestResponseStatus, string> = {
      REJECTED: "Proposition refusée",
      WITHDRAWN: "Proposition retirée",
      ACCEPTED: "",
      PENDING: "",
      COMPLETED: "",
    };

    return NextResponse.json({
      message: messages[nextStatus],
      response: updated,
    });
  } catch (error) {
    console.error("[PATCH /api/requests/[id]/responses/[responseId]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
