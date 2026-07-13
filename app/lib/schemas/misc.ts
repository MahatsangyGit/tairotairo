import { z } from "zod";
import { FIELD_LIMITS } from "@/lib/field-limits";
import { PORTFOLIO_MAX_COMMENT_LENGTH, PORTFOLIO_MAX_DESCRIPTION_LENGTH } from "@/lib/portfolio";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/subscription-plans";
import {
  optionalNonEmptyText,
  optionalNullableText,
  requiredText,
  strictBoolean,
} from "@/lib/schemas/shared";

export const notificationPreferencesSchema = z.object({
  notifyEmail: strictBoolean.optional(),
  notifyPush: strictBoolean.optional(),
});

export const pushSubscribeSchema = z.object({
  endpoint: z
    .string()
    .url("Endpoint push invalide")
    .max(2048, "Endpoint trop long"),
  keys: z.object({
    p256dh: z.string().min(1).max(512, "Clé p256dh trop longue"),
    auth: z.string().min(1).max(256, "Clé auth trop longue"),
  }),
});

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().max(2048, "Endpoint trop long").optional(),
});

export const patchUserProfileSchema = z.object({
  name: optionalNonEmptyText("Nom", FIELD_LIMITS.USER_NAME),
  phone: optionalNullableText("Téléphone", FIELD_LIMITS.USER_PHONE),
  bio: optionalNullableText("Bio", FIELD_LIMITS.USER_BIO),
});

export const portfolioCommentSchema = z.object({
  body: requiredText("Commentaire", PORTFOLIO_MAX_COMMENT_LENGTH),
});

export const adminUserActionSchema = z
  .object({
    action: z.enum(["suspend", "unsuspend", "unlockLogin", "setRole"], {
      error: "Action requise : suspend, unsuspend, unlockLogin ou setRole",
    }),
    role: z.enum(["CLIENT", "PROVIDER", "ADMIN"]).optional(),
  })
  .refine((data) => data.action !== "setRole" || data.role !== undefined, {
    message: "Rôle requis : CLIENT, PROVIDER ou ADMIN",
  });

export const adminKycActionSchema = z.object({
  action: z.enum(["approve", "reject"], {
    error: "Action requise : approve ou reject",
  }),
});

const paymentMethodIds = PAYMENT_METHOD_OPTIONS.map((m) => m.id) as [
  "ORANGE_MONEY",
  "MVOLA",
  "AIRTEL_MONEY",
];

export const subscriptionPurchaseSchema = z.object({
  months: z.coerce.number().int().min(1).max(12).optional().default(1),
  paymentMethod: z.enum(paymentMethodIds, {
    error: "Mode de paiement invalide",
  }),
  phone: z.string().trim().min(1, "Numéro de téléphone requis"),
});

export const adminSubscriptionSchema = z.object({
  months: z.coerce.number().int().min(1).max(12).optional().default(1),
  notes: z.string().max(500, "Notes trop longues").optional(),
});

export const portfolioDescriptionPatchSchema = z.object({
  description: optionalNonEmptyText(
    "Description",
    PORTFOLIO_MAX_DESCRIPTION_LENGTH
  ),
});
