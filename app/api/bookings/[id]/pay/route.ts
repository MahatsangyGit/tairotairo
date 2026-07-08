import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  parseBody,
  parseJsonBody,
  bookingPaySchema,
} from "@/lib/api-schemas";
import { capturePaymentToEscrow, PaymentError } from "@/lib/payments";
import { prepareBookingForApi } from "@/lib/booking-status";

export const dynamic = "force-dynamic";

// POST - Client paie la réservation (fonds capturés sous séquestre Tairo ampio)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, clientId: true, providerId: true, status: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation introuvable" },
        { status: 404 }
      );
    }

    const isClient = booking.clientId === user.userId;
    const isAdmin = user.role === "ADMIN";

    if (!isClient && !isAdmin) {
      return NextResponse.json(
        { error: "Seul le client peut payer cette réservation" },
        { status: 403 }
      );
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
      },
    });

    return NextResponse.json({
      message: "Paiement capturé. La prestation peut démarrer.",
      booking: prepareBookingForApi(updated),
      transaction,
    });
  } catch (error) {
    if (error instanceof PaymentError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("[POST /api/bookings/[id]/pay]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
