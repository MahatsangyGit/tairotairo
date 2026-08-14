import { z } from "zod";
import {
  emailSchema,
  requiredPhoneInput,
  passwordFieldSchema,
} from "@/lib/schemas/shared";
import { FIELD_LIMITS } from "@/lib/field-limits";
import {
  optionalNifSchema,
  optionalRcsSchema,
  optionalStatSchema,
} from "@/lib/schemas/provider-legal";
import { parsePublicRegistrationRole } from "@/lib/roles";

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .max(
        FIELD_LIMITS.USER_NAME,
        `Nom trop long (max ${FIELD_LIMITS.USER_NAME} caractères)`
      )
      .optional(),
    email: emailSchema,
    password: passwordFieldSchema,
    phone: requiredPhoneInput,
    role: z.string().optional(),
    clientKind: z.enum(["INDIVIDUAL", "PROFESSIONAL"]).optional(),
    companyName: z
      .string()
      .trim()
      .max(
        FIELD_LIMITS.USER_NAME,
        `Nom de la société trop long (max ${FIELD_LIMITS.USER_NAME} caractères)`
      )
      .optional(),
    companyAddress: z
      .string()
      .trim()
      .max(
        FIELD_LIMITS.USER_COMPANY_ADDRESS,
        `Adresse trop longue (max ${FIELD_LIMITS.USER_COMPANY_ADDRESS} caractères)`
      )
      .optional(),
    nif: optionalNifSchema,
    stat: optionalStatSchema,
    rcs: optionalRcsSchema,
    turnstileToken: z.string().trim().max(2048).optional(),
  })
  .superRefine((data, ctx) => {
    const role = parsePublicRegistrationRole(data.role);
    const isPro =
      role === "CLIENT" && data.clientKind === "PROFESSIONAL";

    if (isPro) {
      const company = data.companyName || data.name;
      if (!company) {
        ctx.addIssue({
          code: "custom",
          path: ["companyName"],
          message: "Nom de la société obligatoire",
        });
      }
      if (!data.companyAddress) {
        ctx.addIssue({
          code: "custom",
          path: ["companyAddress"],
          message: "Adresse sociale obligatoire",
        });
      }
      if (!data.nif) {
        ctx.addIssue({
          code: "custom",
          path: ["nif"],
          message: "NIF obligatoire",
        });
      }
      if (!data.stat) {
        ctx.addIssue({
          code: "custom",
          path: ["stat"],
          message: "STAT obligatoire",
        });
      }
      if (!data.rcs) {
        ctx.addIssue({
          code: "custom",
          path: ["rcs"],
          message: "RCS obligatoire",
        });
      }
      return;
    }

    if (!data.name) {
      ctx.addIssue({
        code: "custom",
        path: ["name"],
        message: "Nom obligatoire",
      });
    }
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Mot de passe obligatoire")
    .max(128, "Mot de passe trop long"),
  turnstileToken: z.string().trim().max(2048).optional(),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Lien de réinitialisation invalide"),
  password: passwordFieldSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
  turnstileToken: z.string().trim().max(2048).optional(),
});

export const verifyOtpSchema = z.object({
  code: z.string().trim().length(6, "Code à 6 chiffres requis"),
});
