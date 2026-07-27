export const SERVICE_CATEGORIES = [
  "Plomberie",
  "Mécanique",
  "Électricité",
  "Jardinage",
  "Ménage",
  "Informatique",
  "Cuisine",
  "Transport",
  "Irakiraka",
  "Evénementiel",
  "Animaux",
  "Bricolage",
  "Déménagement",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

/**
 * Les icônes de catégories sont définies dans
 * `app/components/categories/CategoryIcon.tsx` (Tabler Icons, rendu 2 tons).
 */
export interface CategoryMeta {
  name: ServiceCategory;
  slug: string;
  description: string;
}

/**
 * « Cours Particuliers » retiré du catalogue marketplace (Ampianaro couvre
 * l’apprentissage). Les listings encore en base sont reclassés vers cette
 * catégorie (migration SQL) pour rester éditables / valides côté Zod.
 */
export const RETIRED_COURS_PARTICULIERS_FALLBACK =
  "Informatique" as const satisfies ServiceCategory;

/** Anciens libellés encore présents en base (avant migration / résidus). */
export const LEGACY_CATEGORY_NAMES: Record<string, ServiceCategory> = {
  Iraka: "Irakiraka",
  /** Anciennes valeurs tutoring → reclassement marketplace. */
  Cours: RETIRED_COURS_PARTICULIERS_FALLBACK,
  "Cours Particuliers": RETIRED_COURS_PARTICULIERS_FALLBACK,
};

/** Anciens slugs d’URL à rediriger vers un slug de catégorie encore actif. */
export const LEGACY_CATEGORY_SLUGS: Record<string, string> = {
  iraka: "irakiraka",
  /** Tutoring retiré → page catégorie de reclassement. */
  cours: "informatique",
  "cours-particuliers": "informatique",
};

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
    description:
      "Plombiers et réparations sanitaires à Madagascar. Fuites, installations et dépannage près de chez vous.",
  },
  {
    name: "Mécanique",
    slug: "mecanique",
    description:
      "Mécaniciens auto et moto à Madagascar. Entretien, réparation et diagnostic de véhicules.",
  },
  {
    name: "Électricité",
    slug: "electricite",
    description:
      "Électriciens qualifiés à Madagascar. Installations, dépannage et mise aux normes.",
  },
  {
    name: "Jardinage",
    slug: "jardinage",
    description:
      "Jardiniers et entretien d'espaces verts à Madagascar. Tonte, taille et aménagement.",
  },
  {
    name: "Ménage",
    slug: "menage",
    description:
      "Services de ménage et nettoyage à domicile à Madagascar. Régulier ou ponctuel.",
  },
  {
    name: "Informatique",
    slug: "informatique",
    description:
      "Techniciens informatiques à Madagascar. Dépannage PC, réseau et assistance numérique.",
  },
  {
    name: "Cuisine",
    slug: "cuisine",
    description:
      "Chefs et traiteurs à Madagascar. Cuisine à domicile, événements et prestations culinaires.",
  },
  {
    name: "Transport",
    slug: "transport",
    description:
      "Chauffeurs et services de transport à Madagascar. Déplacements, livraison et courses.",
  },
  {
    name: "Irakiraka",
    slug: "irakiraka",
    description:
      "Artisans du bâtiment et travaux Irakiraka à Madagascar. Maçonnerie, finitions et rénovation.",
  },
  {
    name: "Evénementiel",
    slug: "evenementiel",
    description:
      "Organisation d'événements à Madagascar. Mariages, fêtes, décoration et animation.",
  },
  {
    name: "Animaux",
    slug: "animaux",
    description:
      "Services pour animaux à Madagascar. Garde, promenade, toilettage et soins à domicile.",
  },
  {
    name: "Bricolage",
    slug: "bricolage",
    description:
      "Bricoleurs et petits travaux à Madagascar. Montage, réparations et aménagements légers.",
  },
  {
    name: "Déménagement",
    slug: "demenagement",
    description:
      "Aide au déménagement à Madagascar. Transport de meubles, emballage et manutention.",
  },
];

const slugToMeta = new Map(CATEGORY_META.map((c) => [c.slug, c]));
const nameToMeta = new Map(CATEGORY_META.map((c) => [c.name, c]));

export function resolveCategorySlug(slug: string): string {
  return LEGACY_CATEGORY_SLUGS[slug] ?? slug;
}

export function normalizeCategoryName(name: string): ServiceCategory | null {
  const canonical =
    LEGACY_CATEGORY_NAMES[name] ?? (name as ServiceCategory);
  return nameToMeta.has(canonical) ? canonical : null;
}

/** Valeurs à matcher en base (nom actuel + anciens libellés). */
export function categoryDbValues(name: ServiceCategory): string[] {
  const values = new Set<string>([name]);
  for (const [legacy, canonical] of Object.entries(LEGACY_CATEGORY_NAMES)) {
    if (canonical === name) values.add(legacy);
  }
  return [...values];
}

export function categorySlug(name: ServiceCategory): string {
  return nameToMeta.get(name)?.slug ?? slugifyCategory(name);
}

export function slugToCategory(slug: string): ServiceCategory | null {
  return slugToMeta.get(resolveCategorySlug(slug))?.name ?? null;
}

export function getCategoryMeta(
  slugOrName: string
): CategoryMeta | null {
  const bySlug = slugToMeta.get(resolveCategorySlug(slugOrName));
  if (bySlug) return bySlug;

  const normalized = normalizeCategoryName(slugOrName);
  return normalized ? nameToMeta.get(normalized) ?? null : null;
}

export function isValidCategorySlug(slug: string): boolean {
  const resolved = resolveCategorySlug(slug);
  return slugToMeta.has(resolved);
}

export function isLegacyCategorySlug(slug: string): boolean {
  return slug in LEGACY_CATEGORY_SLUGS;
}

export function servicesCategoryPath(slug: string): string {
  return `/services/categorie/${resolveCategorySlug(slug)}`;
}

export function requestsCategoryPath(slug: string): string {
  return `/requests/categorie/${resolveCategorySlug(slug)}`;
}
