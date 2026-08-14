import { z } from "zod";
import { cuidSchema, requiredPhoneInput } from "@/lib/schemas/shared";

export const bookingStatusPatchSchema = z.object({
  status: z.enum(
    ["CONFIRMED", "CANCELLED", "COMPLETED", "IN_PROGRESS", "DONE_PENDING_VALIDATION"],
    {
      error:
        "Statut invalide (CONFIRMED, CANCELLED, COMPLETED, IN_PROGRESS ou DONE_PENDING_VALIDATION)",
    }
  ),
});

export const bookingSchedulePatchSchema = z.object({
  date: z.union([z.string().min(1, "Date requise"), z.null()]),
  slotStart: z.string().optional().nullable(),
  slotEnd: z.string().optional().nullable(),
});

export const bookingPaySchema = z.object({
  paymentMethod: z.enum(["ORANGE_MONEY", "MVOLA", "AIRTEL_MONEY"], {
    error: "Mode de paiement invalide",
  }),
  phone: requiredPhoneInput,
});

export const createBookingSchema = z.object({
  serviceId: cuidSchema,
  date: z.union([z.string(), z.number(), z.date()]),
  slotStart: z.string().trim().max(32).optional().nullable(),
  slotEnd: z.string().trim().max(32).optional().nullable(),
});
