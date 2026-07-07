import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { notifyBookingCreated } from "@/lib/notify-booking";
import { prepareBookingForApi } from "@/lib/booking-status";
import { snapshotFromService } from "@/lib/booking-display";
import { assertEmailVerified } from "@/lib/email-verification";
import {
  parseScheduleInput,
  scheduleFieldsForDb,
} from "@/lib/datetime-slot";
import { parseJsonBody, parseBody, createBookingSchema } from "@/lib/api-schemas";

export const dynamic = "force-dynamic";

// GET - Lister les réservations de l'utilisateur connecté
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10) || 20));
    const skip = (page - 1) * limit;
    const withTotal = req.nextUrl.searchParams.get("withTotal") === "1";

    const where = {
      ...(user.role === "CLIENT"
        ? { clientId: user.userId }
        : { providerId: user.userId }),
    };

    const bookingInclude =
      user.role === "CLIENT"
        ? {
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
            provider: {
              select: { id: true, name: true, phone: true },
            },
            // review only needed on client/admin pages showing rating state
            review: {
              select: { id: true, rating: true },
            },
          }
        : {
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
          };

    const bookings = await prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      include: bookingInclude,
    });

    const total = withTotal ? await prisma.booking.count({ where }) : null;

    return NextResponse.json({
      bookings: bookings.map(prepareBookingForApi),
      role: user.role,
      pagination: withTotal
        ? {
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil((total ?? 0) / limit)),
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer une réservation
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    if (user.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Seuls les clients peuvent faire une réservation" },
        { status: 403 }
      );
    }

    const emailCheck = await assertEmailVerified(user.userId, user.role);
    if (!emailCheck.ok) {
      return NextResponse.json(
        { error: emailCheck.error },
        { status: emailCheck.status }
      );
    }

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(createBookingSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const { serviceId, date, slotStart, slotEnd } = parsed.data;
    const schedule = parseScheduleInput({ date, slotStart, slotEnd });

    if (schedule.error) {
      return NextResponse.json({ error: schedule.error }, { status: 400 });
    }

    if (!schedule.date) {
      return NextResponse.json(
        { error: "date est obligatoire" },
        { status: 400 }
      );
    }

    const { date: bookingDate, slotStart: dbSlotStart, slotEnd: dbSlotEnd } =
      scheduleFieldsForDb(schedule);

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || !service.available) {
      return NextResponse.json(
        { error: "Service introuvable ou indisponible" },
        { status: 404 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        clientId: user.userId,
        providerId: service.providerId,
        serviceId,
        date: bookingDate!,
        slotStart: dbSlotStart,
        slotEnd: dbSlotEnd,
        ...snapshotFromService({
          id: service.id,
          title: service.title,
          price: service.price,
          category: service.category,
          location: service.location,
        }),
      },
      include: {
        service: {
          select: { title: true, price: true },
        },
      },
    });

    notifyBookingCreated(booking.id).catch(console.error);

    return NextResponse.json(
      { message: "Réservation créée avec succès", booking },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}