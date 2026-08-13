import { NextResponse } from "next/server";
import type { RentalStatus } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import {
  withApiHandler,
  throwForbidden,
  throwNotFound,
  throwConflict,
} from "@/lib/api-handler";
import {
  rentalStatusPatchSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";
import {
  canTransitionRental,
  rentalActorForUser,
} from "@/lib/rental/status";
import {
  refundRental,
  settleRental,
} from "@/lib/rental/payments";
import {
  notifyRentalAccepted,
  notifyRentalCompleted,
  notifyRentalDisputed,
  notifyRentalReturnRequested,
} from "@/lib/rental/notify";
import { serializeRental } from "@/lib/rental/serialize";
import { rentalBookingInclude } from "@/lib/rental/include";
import { PaymentError } from "@/lib/payments";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const include = rentalBookingInclude;

export const GET = withApiHandler(
  "GET /api/rental/bookings/[id]",
  async (req, { params }) => {
    const user = await requireAuthOrThrow(req);
    const { id } = await params;
    const rental = await prisma.rentalBooking.findUnique({
      where: { id },
      include,
    });
    if (!rental) throwNotFound("Location introuvable");
    if (
      rental.renterId !== user.userId &&
      rental.ownerId !== user.userId &&
      user.role !== "ADMIN"
    ) {
      throwForbidden();
    }
    return NextResponse.json(serializeRental(rental));
  }
);

export const PATCH = withApiHandler(
  "PATCH /api/rental/bookings/[id]",
  async (req, { params }) => {
    const user = await requireAuthOrThrow(req);
    const { id } = await params;
    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;
    const parsed = parseBody(rentalStatusPatchSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const rental = await prisma.rentalBooking.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        renterId: true,
        ownerId: true,
      },
    });
    if (!rental) throwNotFound("Location introuvable");

    const actor = rentalActorForUser({
      userId: user.userId,
      role: user.role,
      renterId: rental.renterId,
      ownerId: rental.ownerId,
    });
    if (!actor) throwForbidden();

    const nextStatus = parsed.data.status as RentalStatus;
    const current = rental.status as RentalStatus;

    // PAID is set exclusively by the pay endpoint
    if (nextStatus === "PAID") {
      throw new AppError("Utilisez l'endpoint de paiement", 400);
    }

    if (!canTransitionRental(current, nextStatus, actor)) {
      throwConflict(
        `Transition ${current} → ${nextStatus} non autorisée pour votre rôle`
      );
    }

    try {
      await prisma.$transaction(async (tx) => {
        const locked = await tx.rentalBooking.updateMany({
          where: { id, status: current },
          data: { status: nextStatus },
        });
        if (locked.count !== 1) {
          throwConflict(
            "La location a déjà changé d'état. Actualisez et réessayez."
          );
        }
      });

      if (nextStatus === "ACCEPTED") {
        await notifyRentalAccepted(id);
      } else if (nextStatus === "RETURN_PENDING") {
        await notifyRentalReturnRequested(id);
      } else if (nextStatus === "DISPUTED") {
        await notifyRentalDisputed(id);
      } else if (nextStatus === "COMPLETED") {
        const retained = parsed.data.depositRetained ?? 0;
        await settleRental(id, retained);
        await notifyRentalCompleted(id);
      } else if (nextStatus === "CANCELLED") {
        await refundRental(id);
      }

      const fresh = await prisma.rentalBooking.findUniqueOrThrow({
        where: { id },
        include,
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
