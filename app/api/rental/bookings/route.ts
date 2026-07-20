import { NextResponse } from "next/server";
import type { RentalStatus } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import { withApiHandler, throwNotFound } from "@/lib/api-handler";
import {
  createRentalBookingSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";
import {
  ACTIVE_RENTAL_STATUSES,
  computeRentalTotalAmount,
  parseRentalDate,
} from "@/lib/rental/status";
import { notifyRentalRequested } from "@/lib/rental/notify";
import { serializeRental } from "@/lib/rental/serialize";
import { AppError, isPrismaKnownError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  "GET /api/rental/bookings",
  async (req) => {
    const user = await requireAuthOrThrow(req);
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("as") === "owner" ? "owner" : "renter";

    const where =
      role === "owner"
        ? { ownerId: user.userId }
        : { renterId: user.userId };

    const bookings = await prisma.rentalBooking.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        equipment: { select: { id: true, title: true, photoKeys: true } },
        transaction: {
          select: {
            id: true,
            status: true,
            amount: true,
            depositAmount: true,
          },
        },
      },
    });

    return NextResponse.json({
      bookings: bookings.map(serializeRental),
    });
  }
);

export const POST = withApiHandler(
  "POST /api/rental/bookings",
  async (req) => {
    const user = await requireAuthOrThrow(req);
    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;
    const parsed = parseBody(createRentalBookingSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const startDate = parseRentalDate(parsed.data.startDate);
    const endDate = parseRentalDate(parsed.data.endDate);
    if (!startDate || !endDate || endDate <= startDate) {
      throw new AppError("Période de location invalide", 400);
    }

    const equipment = await prisma.equipmentItem.findUnique({
      where: { id: parsed.data.equipmentId },
    });
    if (!equipment || equipment.status !== "PUBLISHED") {
      throwNotFound("Matériel introuvable ou non publié");
    }
    if (equipment.ownerId === user.userId) {
      throw new AppError("Vous ne pouvez pas louer votre propre matériel", 400);
    }

    const overlap = await prisma.rentalBooking.findFirst({
      where: {
        equipmentId: equipment.id,
        status: { in: ACTIVE_RENTAL_STATUSES as RentalStatus[] },
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
      select: { id: true },
    });
    if (overlap) {
      throw new AppError(
        "Ce matériel n'est pas disponible sur la période demandée",
        409
      );
    }

    const totalAmount = computeRentalTotalAmount(
      equipment.dailyPrice,
      startDate,
      endDate
    );

    try {
      const rental = await prisma.rentalBooking.create({
        data: {
          equipmentId: equipment.id,
          renterId: user.userId,
          ownerId: equipment.ownerId,
          startDate,
          endDate,
          totalAmount,
          depositAmount: equipment.depositAmount,
          displayTitle: equipment.title,
          displayCategory: equipment.category,
          displayLocation: equipment.location,
          displayDailyPrice: equipment.dailyPrice,
          status: "REQUESTED",
        },
        include: {
          equipment: { select: { id: true, title: true, photoKeys: true } },
          transaction: true,
        },
      });

      await notifyRentalRequested(rental.id);
      return NextResponse.json(serializeRental(rental), { status: 201 });
    } catch (error) {
      if (isPrismaKnownError(error) && error.code === "P2002") {
        throw new AppError(
          "Ce matériel n'est pas disponible sur la période demandée",
          409
        );
      }
      const message =
        error instanceof Error ? error.message : String(error);
      if (message.includes("RentalBooking_no_overlap")) {
        throw new AppError(
          "Ce matériel n'est pas disponible sur la période demandée",
          409
        );
      }
      throw error;
    }
  }
);
