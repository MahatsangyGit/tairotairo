import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import {
  withApiHandler,
  throwForbidden,
  throwNotFound,
  throwConflict,
} from "@/lib/api-handler";
import {
  BookingStatus,
  canTransitionStatus,
  prepareBookingForApi,
  normalizeBookingStatus,
} from "@/lib/booking-status";
import {
  notifyBookingCancelled,
  notifyBookingCompleted,
  notifyBookingConfirmed,
} from "@/lib/notify-booking";
import {
  refundEscrowToClient,
  releaseEscrowToProvider,
} from "@/lib/payments";
import {
  bookingStatusPatchSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";
import { bookingMutationInclude } from "@/lib/booking-include";

export const dynamic = "force-dynamic";

const bookingInclude = bookingMutationInclude;

async function transitionBookingStatus(params: {
  id: string;
  expectedStatus: BookingStatus;
  nextStatus: BookingStatus;
  requestResponseId: string | null;
  requestResponseStatus?: "COMPLETED" | "REJECTED";
}) {
  const {
    id,
    expectedStatus,
    nextStatus,
    requestResponseId,
    requestResponseStatus,
  } = params;

  return prisma.$transaction(async (tx) => {
    const locked = await tx.booking.updateMany({
      where: { id, status: expectedStatus },
      data: { status: nextStatus },
    });

    if (locked.count !== 1) {
      throwConflict(
        "La réservation a déjà changé d'état. Actualisez et réessayez."
      );
    }

    if (requestResponseId && requestResponseStatus) {
      await tx.requestResponse
        .update({
          where: { id: requestResponseId },
          data: { status: requestResponseStatus },
        })
        .catch(() => {
          // la proposition peut avoir déjà changé de statut
        });
    }

    return tx.booking.findUniqueOrThrow({
      where: { id },
      include: bookingInclude,
    });
  });
}

// PATCH - Mettre à jour le statut d'une réservation (workflow paiement inclus)
export const PATCH = withApiHandler(
  "PATCH /api/bookings/[id]",
  async (req, { params }) => {
    const user = await requireAuthOrThrow(req);

    const { id } = await params;

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(bookingStatusPatchSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const nextStatus = parsed.data.status as BookingStatus;

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        providerId: true,
        clientId: true,
        requestResponseId: true,
      },
    });

    if (!booking) {
      throwNotFound("Réservation introuvable");
    }

    const isProvider = booking.providerId === user.userId;
    const isClient = booking.clientId === user.userId;

    if (!isProvider && !isClient && user.role !== "ADMIN") {
      throwForbidden("Vous ne pouvez pas modifier cette réservation");
    }

    const currentStatus = normalizeBookingStatus(booking.status);

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
        { error: "Transition de statut non autorisée", code: "INVALID_TRANSITION" },
        { status: 400 }
      );
    }

    // Validation client -> COMPLETED : libérer les fonds vers le prestataire.
    if (nextStatus === "COMPLETED") {
      if (currentStatus !== "DONE_PENDING_VALIDATION" && user.role !== "ADMIN") {
        return NextResponse.json(
          {
            error:
              "La prestation doit être marquée terminée par le prestataire avant validation",
          },
          { status: 400 }
        );
      }

      const result = await transitionBookingStatus({
        id,
        expectedStatus: currentStatus,
        nextStatus,
        requestResponseId: booking.requestResponseId,
        requestResponseStatus: "COMPLETED",
      });

      // Libérer le séquestre vers le prestataire (hors transaction Prisma pour
      // éviter les conflits de connexion RLS). On fait remonter l'erreur pour
      // ne pas laisser la réservation COMPLETED avec un paiement bloqué.
      if (result.transaction?.status === "ESCROWED") {
        await releaseEscrowToProvider(id);
      }

      notifyBookingCompleted(id).catch(console.error);

      return NextResponse.json({
        message: "Prestation validée. Versement au prestataire déclenché.",
        booking: prepareBookingForApi(result),
      });
    }

    // Annulation : rembourser le client si les fonds étaient sous séquestre.
    if (nextStatus === "CANCELLED") {
      const result = await transitionBookingStatus({
        id,
        expectedStatus: currentStatus,
        nextStatus,
        requestResponseId: booking.requestResponseId,
        requestResponseStatus: "REJECTED",
      });

      // Rembourser le séquestre (hors transaction Prisma).
      await refundEscrowToClient(id).catch((err) => {
        console.error("[refundEscrowToClient]", err);
      });

      notifyBookingCancelled(id).catch(console.error);

      return NextResponse.json({
        message: "Réservation annulée",
        booking: prepareBookingForApi(result),
      });
    }

    // Transitions simples (CONFIRMED, IN_PROGRESS, DONE_PENDING_VALIDATION)
    const updated = await transitionBookingStatus({
      id,
      expectedStatus: currentStatus,
      nextStatus,
      requestResponseId: null,
    });

    if (nextStatus === "CONFIRMED") {
      notifyBookingConfirmed(id).catch(console.error);
    }

    const messages: Partial<Record<BookingStatus, string>> = {
      CONFIRMED: "Réservation confirmée",
      IN_PROGRESS: "Prestation démarrée",
      DONE_PENDING_VALIDATION:
        "Prestation marquée terminée — en attente de validation client",
    };

    return NextResponse.json({
      message: messages[nextStatus] ?? "Réservation mise à jour",
      booking: prepareBookingForApi(updated),
    });
  }
);
