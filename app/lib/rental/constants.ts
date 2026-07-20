/** Constantes location — sûres côté client (pas de Prisma / Zod). */

export const EQUIPMENT_CATEGORIES = [
  "POWER_TOOLS",
  "HAND_TOOLS",
  "ELECTRICAL",
  "PLUMBING",
  "PAINTING",
  "GARDENING",
  "CONSTRUCTION",
  "OTHER",
] as const;

export type EquipmentCategoryValue = (typeof EQUIPMENT_CATEGORIES)[number];

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategoryValue, string> = {
  POWER_TOOLS: "Outillage électroportatif",
  HAND_TOOLS: "Outillage à main",
  ELECTRICAL: "Électricité",
  PLUMBING: "Plomberie",
  PAINTING: "Peinture",
  GARDENING: "Jardinage",
  CONSTRUCTION: "Construction",
  OTHER: "Autre",
};
