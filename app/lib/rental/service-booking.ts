import type { BookingStatus } from "@/lib/booking-status";
import { BOOKING_STATUS_LABEL_PROVIDER } from "@/lib/booking-status";
import { getBookingDisplayInfo } from "@/lib/booking-display";
import { formatSchedule } from "@/lib/datetime-slot";
import { AppError } from "@/lib/errors";
import prisma from "@/lib/prisma";
import {
  RENTAL_ELIGIBLE_BOOKING_ERROR,
  RENTAL_ELIGIBLE_BOOKING_STATUSES,
  rentalPeriodFromServiceDate,
} from "@/lib/rental/service-booking-rules";

export {
  isRentalEligibleBookingStatus,
  RENTAL_ELIGIBLE_BOOKING_ERROR,
  RENTAL_ELIGIBLE_BOOKING_STATUSES,
  rentalPeriodFromServiceDate,
} from "@/lib/rental/service-booking-rules";

const eligibleBookingSelect = {
  id: true,
  status: true,
  date: true,
  slotStart: true,
  slotEnd: true,
  displayTitle: true,
  displayPrice: true,
  displayCategory: true,
  displayLocation: true,
  displaySource: true,
  displayTargetId: true,
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
  client: { select: { name: true } },
} as const;

type EligibleBookingRow = {
  id: string;
  status: string;
  date: Date | null;
  slotStart: string | null;
  slotEnd: string | null;
  displayTitle: string | null;
  displayPrice: number | null;
  displayCategory: string | null;
  displayLocation: string | null;
  displaySource: string | null;
  displayTargetId: string | null;
  service: {
    id: string;
    title: string;
    price: number;
    category: string;
    location: string;
  } | null;
  requestResponse: {
    proposedPrice: number | null;
    request: {
      id: string;
      title: string;
      budget: number;
      category: string;
      location: string;
    } | null;
  } | null;
  client: { name: string };
};

export function serializeEligibleServiceBooking(booking: EligibleBookingRow) {
  const display = getBookingDisplayInfo(booking, { viewer: "provider" });
  const status = booking.status as BookingStatus;
  return {
    id: booking.id,
    title: display.title,
    date: booking.date ? booking.date.toISOString() : null,
    dateLabel: formatSchedule(booking.date, booking.slotStart, booking.slotEnd),
    status,
    statusLabel: BOOKING_STATUS_LABEL_PROVIDER[status] ?? status,
    clientName: booking.client.name,
  };
}

export async function listEligibleServiceBookingsForProvider(providerId: string) {
  const bookings = await prisma.booking.findMany({
    where: {
      providerId,
      status: { in: RENTAL_ELIGIBLE_BOOKING_STATUSES },
      date: { not: null },
    },
    orderBy: { date: "asc" },
    select: eligibleBookingSelect,
  });

  return bookings.map(serializeEligibleServiceBooking);
}

export async function requireEligibleServiceBookingForRental(params: {
  serviceBookingId: string;
  providerId: string;
}) {
  const booking = await prisma.booking.findFirst({
    where: {
      id: params.serviceBookingId,
      providerId: params.providerId,
      status: { in: RENTAL_ELIGIBLE_BOOKING_STATUSES },
      date: { not: null },
    },
    select: { id: true, date: true },
  });

  if (!booking?.date) {
    throw new AppError(RENTAL_ELIGIBLE_BOOKING_ERROR, 400);
  }

  const { startDate, endDate } = rentalPeriodFromServiceDate(booking.date);
  return { bookingId: booking.id, startDate, endDate };
}
