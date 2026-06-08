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

export interface CategoryMeta {
  name: ServiceCategory;
  slug: string;
  icon: string;
  description: string;
}

function slugifyCategory(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const CATEGORY_META: CategoryMeta[] = [
  {
    name: "Plomberie",
    slug: "plomberie",
    icon: "🔧",
    description:
      "Plombiers et réparations sanitaires à Madagascar. Fuites, installations et dépannage près de chez vous.",
  },
  {
    name: "Mécanique",
    slug: "mecanique",
    icon: "🛠️",
    description:
      "Mécaniciens auto et moto à Madagascar. Entretien, réparation et diagnostic de véhicules.",
  },
  {
    name: "Électricité",
    slug: "electricite",
    icon: "⚡",
    description:
      "Électriciens qualifiés à Madagascar. Installations, dépannage et mise aux normes.",
  },
  {
    name: "Jardinage",
    slug: "jardinage",
    icon: "🌿",
    description:
      "Jardiniers et entretien d'espaces verts à Madagascar. Tonte, taille et aménagement.",
  },
  {
    name: "Ménage",
    slug: "menage",
    icon: "🧹",
    description:
      "Services de ménage et nettoyage à domicile à Madagascar. Régulier ou ponctuel.",
  },
  {
    name: "Cours",
    slug: "cours",
    icon: "📚",
    description:
      "Cours particuliers et soutien scolaire à Madagascar. Toutes matières et niveaux.",
  },
  {
    name: "Informatique",
    slug: "informatique",
    icon: "💻",
    description:
      "Techniciens informatiques à Madagascar. Dépannage PC, réseau et assistance numérique.",
  },
  {
    name: "Cuisine",
    slug: "cuisine",
    icon: "🍳",
    description:
      "Chefs et traiteurs à Madagascar. Cuisine à domicile, événements et prestations culinaires.",
  },
  {
    name: "Transport",
    slug: "transport",
    icon: "🚗",
    description:
      "Chauffeurs et services de transport à Madagascar. Déplacements, livraison et courses.",
  },
  {
    name: "Iraka",
    slug: "iraka",
    icon: "🏠",
    description:
      "Artisans du bâtiment et travaux Iraka à Madagascar. Maçonnerie, finitions et rénovation.",
  },
  {
    name: "Evénementiel",
    slug: "evenementiel",
    icon: "🎉",
    description:
      "Organisation d'événements à Madagascar. Mariages, fêtes, décoration et animation.",
  },
];

const slugToMeta = new Map(CATEGORY_META.map((c) => [c.slug, c]));
const nameToMeta = new Map(CATEGORY_META.map((c) => [c.name, c]));

export function categorySlug(name: ServiceCategory): string {
  return nameToMeta.get(name)?.slug ?? slugifyCategory(name);
}

export function slugToCategory(slug: string): ServiceCategory | null {
  return slugToMeta.get(slug)?.name ?? null;
}

export function getCategoryMeta(
  slugOrName: string
): CategoryMeta | null {
  return (
    slugToMeta.get(slugOrName) ??
    nameToMeta.get(slugOrName as ServiceCategory) ??
    null
  );
}

export function isValidCategorySlug(slug: string): boolean {
  return slugToMeta.has(slug);
}

export function servicesCategoryPath(slug: string): string {
  return `/services/categorie/${slug}`;
}

export function requestsCategoryPath(slug: string): string {
  return `/requests/categorie/${slug}`;
}
