import { z } from "zod";
import {
  cuidSchema,
  optionalNonEmptyText,
  requiredText,
} from "@/lib/schemas/shared";
import { FIELD_LIMITS } from "@/lib/field-limits";

export const COURSE_CATEGORIES = [
  "DIY",
  "HANDYWORK",
  "ELECTRICAL",
  "PLUMBING",
  "PAINTING",
  "SAFETY",
  "OTHER",
] as const;

export const courseCategorySchema = z.enum(COURSE_CATEGORIES, {
  error: "Catégorie de formation invalide",
});

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug trop court")
  .max(120, "Slug trop long")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug invalide (a-z, 0-9, tirets)");

export const createCourseSchema = z.object({
  title: requiredText("Titre", FIELD_LIMITS.LISTING_TITLE),
  slug: slugSchema,
  description: requiredText("Description", FIELD_LIMITS.LISTING_DESCRIPTION),
  category: courseCategorySchema,
});

export const patchCourseSchema = z.object({
  title: optionalNonEmptyText("Titre", FIELD_LIMITS.LISTING_TITLE),
  slug: slugSchema.optional(),
  description: optionalNonEmptyText(
    "Description",
    FIELD_LIMITS.LISTING_DESCRIPTION
  ),
  category: courseCategorySchema.optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export const createLessonSchema = z.object({
  title: requiredText("Titre", FIELD_LIMITS.LISTING_TITLE),
  description: z
    .string()
    .trim()
    .max(FIELD_LIMITS.LISTING_DESCRIPTION)
    .optional()
    .nullable(),
  position: z.coerce.number().int().min(0).max(999),
  durationSec: z.coerce.number().int().min(0).max(86400).optional().nullable(),
});

export const patchLessonSchema = z.object({
  title: optionalNonEmptyText("Titre", FIELD_LIMITS.LISTING_TITLE),
  description: z
    .string()
    .trim()
    .max(FIELD_LIMITS.LISTING_DESCRIPTION)
    .optional()
    .nullable(),
  position: z.coerce.number().int().min(0).max(999).optional(),
  durationSec: z.coerce.number().int().min(0).max(86400).optional().nullable(),
});

export const lessonProgressSchema = z.object({
  lessonId: cuidSchema,
  completed: z.boolean().optional(),
});
