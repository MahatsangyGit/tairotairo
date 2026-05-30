export const SERVICE_CATEGORIES = [
  "Plomberie",
  "Mécanique",
  "Électricité",
  "Jardinage",
  "Ménage",
  "Cours",
  "Informatique",
  "Cuisine",
  "Transport",
  "Iraka",
  "Evénementiel",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
