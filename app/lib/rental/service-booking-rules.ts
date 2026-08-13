import type { BookingStatus } from "@/lib/booking-status";
import { calendarDayRangeInBusinessTz } from "@/lib/datetime-slot";

/**
 * Statuts de prestation qui autorisent une location de matériel :
 * acceptée (confirmée), payée, en cours, en finition.
 */
export const RENTAL_ELIGIBLE_BOOKING_STATUSES: BookingStatus[] = [
  "CONFIRMED",
  "PAID",
  "IN_PROGRESS",
  "DONE_PENDING_VALIDATION",
];

export const RENTAL_ELIGIBLE_BOOKING_ERROR =
  "Choisissez une de vos réservations confirmées (acceptée, payée, en cours ou en finition) avec une date de prestation.";

export function isRentalEligibleBookingStatus(
  status: string
): status is BookingStatus {
  return (RENTAL_ELIGIBLE_BOOKING_STATUSES as string[]).includes(status);
}

export function rentalPeriodFromServiceDate(date: Date): {
  startDate: Date;
  endDate: Date;
} {
  const { start, end } = calendarDayRangeInBusinessTz(date);
  return { startDate: start, endDate: end };
}
