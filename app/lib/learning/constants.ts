/** Constantes formation — sûres côté client (pas de Prisma / Zod). */

export const COURSE_CATEGORIES = [
  "DIY",
  "HANDYWORK",
  "ELECTRICAL",
  "PLUMBING",
  "PAINTING",
  "SAFETY",
  "OTHER",
] as const;

export type CourseCategoryValue = (typeof COURSE_CATEGORIES)[number];

export const COURSE_CATEGORY_LABELS: Record<CourseCategoryValue, string> = {
  DIY: "DIY",
  HANDYWORK: "Bricolage",
  ELECTRICAL: "Électricité",
  PLUMBING: "Plomberie",
  PAINTING: "Peinture",
  SAFETY: "Sécurité",
  OTHER: "Autre",
};
