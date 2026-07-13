import { z } from "zod";

export const createReviewSchema = z.object({
  bookingId: z.string().trim().min(1, "bookingId est obligatoire"),
  rating: z.coerce
    .number({ error: "La note doit être un nombre" })
    .int("La note doit être un entier entre 1 et 5")
    .min(1, "La note doit être entre 1 et 5")
    .max(5, "La note doit être entre 1 et 5"),
  comment: z.union([z.string(), z.null(), z.undefined()]).optional(),
});
