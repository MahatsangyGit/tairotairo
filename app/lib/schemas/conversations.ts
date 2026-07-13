import { z } from "zod";
import { FIELD_LIMITS } from "@/lib/field-limits";
import {
  cuidSchema,
  nonNegativePriceSchema,
  requiredText,
} from "@/lib/schemas/shared";

export const messageBodySchema = z.object({
  body: requiredText("Message", FIELD_LIMITS.MESSAGE_BODY),
});

export const priceOfferSchema = z
  .object({
    price: nonNegativePriceSchema,
    requestResponseId: z.string().trim().min(1).optional(),
    serviceId: z.string().trim().min(1).optional(),
  })
  .refine((data) => Boolean(data.requestResponseId || data.serviceId), {
    message: "requestResponseId ou serviceId requis",
  });

export const openConversationSchema = z
  .object({
    bookingId: cuidSchema.optional(),
    providerId: cuidSchema.optional(),
    clientId: cuidSchema.optional(),
    requestResponseId: cuidSchema.optional(),
    serviceId: cuidSchema.optional(),
  })
  .refine(
    (data) =>
      Boolean(
        data.bookingId ||
          data.providerId ||
          data.clientId ||
          data.requestResponseId ||
          data.serviceId
      ),
    { message: "Au moins un identifiant est requis" }
  );
