import type { RentalStatus } from "@/generated/prisma/client";

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
  };
}
