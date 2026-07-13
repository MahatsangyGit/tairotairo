import { z } from "zod";
import {
  emailSchema,
  optionalPhoneInput,
  passwordFieldSchema,
  requiredText,
} from "@/lib/schemas/shared";
import { FIELD_LIMITS } from "@/lib/field-limits";

export const registerSchema = z.object({
  name: requiredText("Nom", FIELD_LIMITS.USER_NAME),
  email: emailSchema,
  password: passwordFieldSchema,
  phone: optionalPhoneInput,
  role: z.string().optional(),
  turnstileToken: z.string().trim().max(2048).optional(),
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
