import { z } from "zod";
import {
  cuidSchema,
  nonNegativePriceSchema,
  optionalNonEmptyText,
  requiredText,
} from "@/lib/schemas/shared";
import { FIELD_LIMITS } from "@/lib/field-limits";
import { EQUIPMENT_CATEGORIES } from "@/lib/rental/constants";

export { EQUIPMENT_CATEGORIES } from "@/lib/rental/constants";

export const equipmentCategorySchema = z.enum(EQUIPMENT_CATEGORIES, {
  error: "Catégorie de matériel invalide",
});

export const createEquipmentSchema = z.object({
  title: requiredText("Titre", FIELD_LIMITS.LISTING_TITLE),
  description: requiredText("Description", FIELD_LIMITS.LISTING_DESCRIPTION),
  category: equipmentCategorySchema,
  location: requiredText("Ville", FIELD_LIMITS.LISTING_LOCATION),
  dailyPrice: nonNegativePriceSchema,
  depositAmount: nonNegativePriceSchema,
  /** Admin only — matériel catalogue Tairo */
  isPlatformOwned: z.boolean().optional(),
  submitForReview: z.boolean().optional(),
});

export const patchEquipmentSchema = z.object({
  title: optionalNonEmptyText("Titre", FIELD_LIMITS.LISTING_TITLE),
  description: optionalNonEmptyText(
    "Description",
    FIELD_LIMITS.LISTING_DESCRIPTION
  ),
  category: equipmentCategorySchema.optional(),
  location: optionalNonEmptyText("Ville", FIELD_LIMITS.LISTING_LOCATION),
  dailyPrice: nonNegativePriceSchema.optional(),
  depositAmount: nonNegativePriceSchema.optional(),
  status: z
    .enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "SUSPENDED", "ARCHIVED"])
    .optional(),
});

export const adminEquipmentReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z
    .string()
    .trim()
    .max(500, "Motif trop long")
    .optional()
    .nullable(),
});

export const createRentalBookingSchema = z.object({
  equipmentId: cuidSchema,
  startDate: z.union([z.string(), z.number(), z.date()]),
  endDate: z.union([z.string(), z.number(), z.date()]),
});

export const rentalStatusPatchSchema = z.object({
  status: z.enum([
    "ACCEPTED",
    "CANCELLED",
    "ONGOING",
    "RETURN_PENDING",
    "COMPLETED",
    "DISPUTED",
  ]),
  /** Admin dispute resolution: portion of deposit retained (MGA) */
  depositRetained: z.coerce.number().finite().nonnegative().optional(),
});

export const rentalPaySchema = z.object({
  paymentMethod: z.enum(["ORANGE_MONEY", "MVOLA", "AIRTEL_MONEY"], {
    error: "Moyen de paiement invalide",
  }),
});
