import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
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
  PaymentError,
} from "@/lib/payments";
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
};

// PATCH - Mettre à jour le statut d'une réservation (workflow paiement inclus)
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
        { error: "Transition de statut non autorisée" },
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

      try {
        const result = await prisma.$transaction(async (tx) => {
          const updated = await tx.booking.update({
            where: { id },
            data: { status: nextStatus },
            include: bookingInclude,
          });

          if (booking.requestResponseId) {
            await tx.requestResponse.update({
              where: { id: booking.requestResponseId },
              data: { status: "COMPLETED" },
            });
          }

          return updated;
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
      } catch (err) {
        if (err instanceof PaymentError) {
          return NextResponse.json({ error: err.message }, { status: err.status });
        }
        throw err;
      }
    }

    // Annulation : rembourser le client si les fonds étaient sous séquestre.
    if (nextStatus === "CANCELLED") {
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.booking.update({
          where: { id },
          data: { status: nextStatus },
          include: bookingInclude,
        });

        if (booking.requestResponseId) {
          await tx.requestResponse.update({
            where: { id: booking.requestResponseId },
            data: { status: "REJECTED" },
          }).catch(() => {
            // la proposition peut avoir déjà changé de statut
          });
        }

        return updated;
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
    const updated = await prisma.booking.update({
      where: { id },
      data: { status: nextStatus },
      include: bookingInclude,
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
  } catch (error) {
    console.error("[PATCH /api/bookings/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
