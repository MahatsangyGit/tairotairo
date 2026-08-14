import { z } from "zod";
import { SERVICE_CATEGORIES } from "@/lib/categories";
import { FIELD_LIMITS } from "@/lib/field-limits";
import { validatePassword } from "@/lib/password-policy";
import {
  MG_PHONE_ERROR,
  MG_PHONE_REQUIRED,
  parseMgPhone,
} from "@/lib/phone";

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

export function requiredText(label: string, maxLength: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} est obligatoire`)
    .max(maxLength, `${label} trop long (max ${maxLength} caractères)`);
}

export function optionalNonEmptyText(label: string, maxLength: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} ne peut pas être vide`)
    .max(maxLength, `${label} trop long (max ${maxLength} caractères)`)
    .optional();
}

export const optionalPhoneInput = z
  .union([z.string(), z.null(), z.undefined()])
  .optional()
  .transform((value, ctx) => {
    if (value == null || String(value).trim() === "") return null;
    const parsed = parseMgPhone(String(value));
    if (!parsed) {
      ctx.addIssue({ code: "custom", message: MG_PHONE_ERROR });
      return z.NEVER;
    }
    return parsed;
  });

export const requiredPhoneInput = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value == null || String(value).trim() === "") {
      ctx.addIssue({ code: "custom", message: MG_PHONE_REQUIRED });
      return z.NEVER;
    }
    const parsed = parseMgPhone(String(value));
    if (!parsed) {
      ctx.addIssue({ code: "custom", message: MG_PHONE_ERROR });
      return z.NEVER;
    }
    return parsed;
  });

/** PATCH profil : omis = inchangé ; vide/null = refusé. */
export const profilePhoneInput = z
  .union([z.string(), z.null(), z.undefined()])
  .optional()
  .transform((value, ctx) => {
    if (value === undefined) return undefined;
    if (value === null || String(value).trim() === "") {
      ctx.addIssue({ code: "custom", message: MG_PHONE_REQUIRED });
      return z.NEVER;
    }
    const parsed = parseMgPhone(String(value));
    if (!parsed) {
      ctx.addIssue({ code: "custom", message: MG_PHONE_ERROR });
      return z.NEVER;
    }
    return parsed;
  });

export const cuidSchema = z
  .string()
  .trim()
  .regex(/^c[a-z0-9]{24,}$/, "Identifiant invalide");

export const passwordFieldSchema = z.string().superRefine((value, ctx) => {
  const result = validatePassword(value);
  if (!result.ok) {
    ctx.addIssue({ code: "custom", message: result.error });
  }
});

export const optionalNullableText = (label: string, maxLength: number) =>
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
