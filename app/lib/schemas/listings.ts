import { z } from "zod";
import { FIELD_LIMITS } from "@/lib/field-limits";
import {
  nonNegativePriceSchema,
  optionalNonEmptyText,
  requiredText,
  serviceCategorySchema,
  strictBoolean,
} from "@/lib/schemas/shared";

export type { ListingKind } from "@/lib/listing-cover";

export const createServiceSchema = z.object({
  title: requiredText("Titre", FIELD_LIMITS.LISTING_TITLE),
  description: requiredText("Description", FIELD_LIMITS.LISTING_DESCRIPTION),
  category: serviceCategorySchema,
  location: requiredText("Ville", FIELD_LIMITS.LISTING_LOCATION),
  price: nonNegativePriceSchema,
});

export const patchServiceSchema = z.object({
  title: optionalNonEmptyText("Titre", FIELD_LIMITS.LISTING_TITLE),
  description: optionalNonEmptyText(
    "Description",
    FIELD_LIMITS.LISTING_DESCRIPTION
  ),
  category: serviceCategorySchema.optional(),
  location: optionalNonEmptyText("Ville", FIELD_LIMITS.LISTING_LOCATION),
  price: nonNegativePriceSchema.optional(),
  available: strictBoolean.optional(),
});

export const createRequestSchema = z.object({
  title: requiredText("Titre", FIELD_LIMITS.LISTING_TITLE),
  description: requiredText("Description", FIELD_LIMITS.LISTING_DESCRIPTION),
  category: serviceCategorySchema,
  location: requiredText("Ville", FIELD_LIMITS.LISTING_LOCATION),
  budget: nonNegativePriceSchema,
});

export const patchRequestSchema = z.object({
  title: optionalNonEmptyText("Titre", FIELD_LIMITS.LISTING_TITLE),
  description: optionalNonEmptyText(
    "Description",
    FIELD_LIMITS.LISTING_DESCRIPTION
  ),
  category: serviceCategorySchema.optional(),
  location: optionalNonEmptyText("Ville", FIELD_LIMITS.LISTING_LOCATION),
  budget: nonNegativePriceSchema.optional(),
  open: strictBoolean.optional(),
  desiredDate: z.unknown().optional(),
  desiredSlotStart: z.unknown().optional(),
  desiredSlotEnd: z.unknown().optional(),
});

export const responseStatusPatchSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED", "WITHDRAWN"], {
    error: "Statut invalide (ACCEPTED, REJECTED ou WITHDRAWN)",
  }),
});

export const requestResponseCreateSchema = z.object({
  message: requiredText("Message", FIELD_LIMITS.REQUEST_RESPONSE_MESSAGE),
  proposedPrice: z
    .union([nonNegativePriceSchema, z.null(), z.literal("")])
    .optional(),
});

export const featuredFlagSchema = z.object({
  featured: strictBoolean,
});

export const featuredServiceSchema = z.object({
  serviceId: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .superRefine((value, ctx) => {
      if (value === undefined || value === null) return;
      if (String(value).trim() === "") {
        ctx.addIssue({ code: "custom", message: "serviceId invalide" });
      }
    })
    .transform((value) => {
      if (value === undefined || value === null) return null;
      return String(value).trim();
    }),
});
