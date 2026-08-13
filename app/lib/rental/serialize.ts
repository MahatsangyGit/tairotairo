import type { RentalStatus } from "@/generated/prisma/client";
import { formatSchedule } from "@/lib/datetime-slot";

export function serializeRental(rental: {
  id: string;
  status: string;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  depositAmount: number;
  displayTitle: string | null;
  displayCategory: string | null;
  displayLocation: string | null;
  displayDailyPrice: number | null;
  equipmentId: string;
  renterId: string;
  ownerId: string;
  serviceBookingId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  equipment?: {
    id: string;
    title: string;
    photoKeys: string[];
  } | null;
  transaction?: {
    id: string;
    status: string;
    amount: number;
    depositAmount: number;
  } | null;
  serviceBooking?: {
    id: string;
    status: string;
    date: Date | null;
    slotStart: string | null;
    slotEnd: string | null;
    displayTitle: string | null;
  } | null;
}) {
  return {
    id: rental.id,
    status: rental.status as RentalStatus,
    startDate: rental.startDate.toISOString(),
    endDate: rental.endDate.toISOString(),
    totalAmount: rental.totalAmount,
    depositAmount: rental.depositAmount,
    displayTitle: rental.displayTitle,
    displayCategory: rental.displayCategory,
    displayLocation: rental.displayLocation,
    displayDailyPrice: rental.displayDailyPrice,
    equipmentId: rental.equipmentId,
    renterId: rental.renterId,
    ownerId: rental.ownerId,
    serviceBookingId: rental.serviceBookingId ?? null,
    createdAt: rental.createdAt.toISOString(),
    updatedAt: rental.updatedAt.toISOString(),
    equipment: rental.equipment
      ? {
          id: rental.equipment.id,
          title: rental.equipment.title,
          photoUrl: rental.equipment.photoKeys[0]
            ? `/api/rental/equipment/${rental.equipment.id}/photos/0`
            : null,
        }
      : null,
    transaction: rental.transaction ?? null,
    serviceBooking: rental.serviceBooking
      ? {
          id: rental.serviceBooking.id,
          status: rental.serviceBooking.status,
          title: rental.serviceBooking.displayTitle,
          date: rental.serviceBooking.date
            ? rental.serviceBooking.date.toISOString()
            : null,
          dateLabel: formatSchedule(
            rental.serviceBooking.date,
            rental.serviceBooking.slotStart,
            rental.serviceBooking.slotEnd
          ),
        }
      : null,
  };
}
