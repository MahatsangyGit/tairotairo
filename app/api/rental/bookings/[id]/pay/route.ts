import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import {
  withApiHandler,
  throwForbidden,
  throwNotFound,
} from "@/lib/api-handler";
import {
  rentalPaySchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";
import { captureRentalToEscrow } from "@/lib/rental/payments";
import { notifyRentalPaid } from "@/lib/rental/notify";
import { serializeRental } from "@/lib/rental/serialize";
import { rentalBookingInclude } from "@/lib/rental/include";
import { PaymentError } from "@/lib/payments";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(
  "POST /api/rental/bookings/[id]/pay",
  async (req, { params }) => {
    const user = await requireAuthOrThrow(req);
    const { id } = await params;
    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;
    const parsed = parseBody(rentalPaySchema, json.body);
    if (!parsed.ok) return parsed.response;

    const rental = await prisma.rentalBooking.findUnique({
      where: { id },
      select: { id: true, renterId: true, status: true },
    });
    if (!rental) throwNotFound("Location introuvable");
    if (rental.renterId !== user.userId && user.role !== "ADMIN") {
      throwForbidden("Seul l'emprunteur peut payer");
    }

    try {
      await captureRentalToEscrow(id, parsed.data.paymentMethod);
      await notifyRentalPaid(id);
      const fresh = await prisma.rentalBooking.findUniqueOrThrow({
        where: { id },
        include: rentalBookingInclude,
      });
      return NextResponse.json(serializeRental(fresh));
    } catch (error) {
      if (error instanceof PaymentError) {
        throw new AppError(error.message, error.status);
      }
      throw error;
    }
  }
);
