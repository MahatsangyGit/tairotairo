import { z } from "zod";
import { NextResponse } from "next/server";
import { SERVICE_CATEGORIES } from "@/lib/categories";
import { FIELD_LIMITS } from "@/lib/field-limits";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-policy";
import { PORTFOLIO_MAX_COMMENT_LENGTH, PORTFOLIO_MAX_DESCRIPTION_LENGTH } from "@/lib/portfolio";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/subscription-plans";

/** Rejette les chaînes "false" / "true" — uniquement des booléens JSON natifs. */
export const strictBoolean = z.boolean();

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email obligatoire")
  .max(254, "Email trop long")
  .email("Adresse email invalide");

export const nonNegativePriceSchema = z.coerce
  .number({ error: "Prix invalide" })
  .finite("Prix invalide")
  .nonnegative("Le montant ne peut pas être négatif");

export const serviceCategorySchema = z.enum(SERVICE_CATEGORIES, {
  error: "Catégorie invalide",
});

function requiredText(label: string, maxLength: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} est obligatoire`)
    .max(maxLength, `${label} trop long (max ${maxLength} caractères)`);
}

function optionalNonEmptyText(label: string, maxLength: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} ne peut pas être vide`)
    .max(maxLength, `${label} trop long (max ${maxLength} caractères)`)
    .optional();
}

const optionalPhoneInput = z
  .union([z.string(), z.null(), z.undefined()])
  .optional()
  .transform((value) => {
    if (value == null || value === "") return null;
    return String(value).trim();
  })
  .pipe(
    z.union([
      z.null(),
      z
        .string()
        .max(
          FIELD_LIMITS.USER_PHONE,
          `Téléphone trop long (max ${FIELD_LIMITS.USER_PHONE} caractères)`
        ),
    ])
  );

export const registerSchema = z.object({
  name: requiredText("Nom", FIELD_LIMITS.USER_NAME),
  email: emailSchema,
  password: z
    .string()
    .min(
      MIN_PASSWORD_LENGTH,
      `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`
    ),
  phone: optionalPhoneInput,
  role: z.string().optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Mot de passe obligatoire")
    .max(128, "Mot de passe trop long"),
});

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

export const createReviewSchema = z.object({
  bookingId: z.string().trim().min(1, "bookingId est obligatoire"),
  rating: z.coerce
    .number({ error: "La note doit être un nombre" })
    .int("La note doit être un entier entre 1 et 5")
    .min(1, "La note doit être entre 1 et 5")
    .max(5, "La note doit être entre 1 et 5"),
  comment: z.union([z.string(), z.null(), z.undefined()]).optional(),
});

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

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Lien de réinitialisation invalide"),
  password: z
    .string()
    .min(
      MIN_PASSWORD_LENGTH,
      `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`
    ),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const verifyOtpSchema = z.object({
  code: z.string().trim().length(6, "Code à 6 chiffres requis"),
});

const optionalNullableText = (label: string, maxLength: number) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      if (value === null || value === "") return null;
      return String(value).trim();
    })
    .pipe(
      z.union([
        z.undefined(),
        z.null(),
        z
          .string()
          .max(maxLength, `${label} trop long (max ${maxLength} caractères)`),
      ])
    );

export const patchUserProfileSchema = z.object({
  name: optionalNonEmptyText("Nom", FIELD_LIMITS.USER_NAME),
  phone: optionalNullableText("Téléphone", FIELD_LIMITS.USER_PHONE),
  bio: optionalNullableText("Bio", FIELD_LIMITS.USER_BIO),
});

export const bookingStatusPatchSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"], {
    error: "Statut invalide (CONFIRMED, CANCELLED ou COMPLETED)",
  }),
});

export const responseStatusPatchSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED", "WITHDRAWN"], {
    error: "Statut invalide (ACCEPTED, REJECTED ou WITHDRAWN)",
  }),
});

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

export const requestResponseCreateSchema = z.object({
  message: requiredText("Message", FIELD_LIMITS.REQUEST_RESPONSE_MESSAGE),
  proposedPrice: z
    .union([nonNegativePriceSchema, z.null(), z.literal("")])
    .optional(),
});

export const portfolioCommentSchema = z.object({
  body: requiredText("Commentaire", PORTFOLIO_MAX_COMMENT_LENGTH),
});

export const featuredFlagSchema = z.object({
  featured: strictBoolean,
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

export const portfolioDescriptionPatchSchema = z.object({
  description: optionalNonEmptyText(
    "Description",
    PORTFOLIO_MAX_DESCRIPTION_LENGTH
  ),
});

export async function parseJsonBody(
  req: Request
): Promise<
  { ok: true; body: unknown } | { ok: false; response: NextResponse }
> {
  try {
    return { ok: true, body: await req.json() };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Corps JSON invalide" },
        { status: 400 }
      ),
    };
  }
}

export function parseBody<T extends z.ZodType>(
  schema: T,
  body: unknown
): { ok: true; data: z.infer<T> } | { ok: false; response: NextResponse } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issue = result.error.issues[0];
    return {
      ok: false,
      response: NextResponse.json(
        { error: issue?.message ?? "Données invalides" },
        { status: 400 }
      ),
    };
  }
  return { ok: true, data: result.data };
}
