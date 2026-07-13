import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import { withApiHandler, throwForbidden, throwNotFound } from "@/lib/api-handler";
import {
  parseBody,
  parseJsonBody,
  bookingPaySchema,
} from "@/lib/api-schemas";
import { bookingMutationInclude } from "@/lib/booking-include";
import { capturePaymentToEscrow } from "@/lib/payments";
import { prepareBookingForApi } from "@/lib/booking-status";

export const dynamic = "force-dynamic";

// POST - Client paie la réservation (fonds capturés sous séquestre Tairo ampio)
export const POST = withApiHandler(
  "POST /api/bookings/[id]/pay",
  async (req, { params }) => {
    const user = await requireAuthOrThrow(req);

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, clientId: true, providerId: true, status: true },
    });

    if (!booking) {
      throwNotFound("Réservation introuvable");
    }

    const isClient = booking.clientId === user.userId;
    const isAdmin = user.role === "ADMIN";

    if (!isClient && !isAdmin) {
      throwForbidden("Seul le client peut payer cette réservation");
    }

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(bookingPaySchema, json.body);
    if (!parsed.ok) return parsed.response;

    const { paymentMethod } = parsed.data;

    const transaction = await capturePaymentToEscrow(id, paymentMethod);

    // La réservation passe à PAID : prestation en cours dès paiement.
    const updated = await prisma.booking.update({
      where: { id },
      data: { status: "PAID" },
      include: bookingMutationInclude,
    });

    return NextResponse.json({
      message: "Paiement capturé. La prestation peut démarrer.",
      booking: prepareBookingForApi(updated),
      transaction,
    });
  }
);
