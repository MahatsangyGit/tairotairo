"use client";

import GuestBrowseTrigger from "@/components/auth/GuestBrowseTrigger";
import CategoryIcon from "@/components/categories/CategoryIcon";
import { CATEGORY_META } from "@/lib/categories";

const HERO_CATEGORY_SLUGS = [
  "bricolage",
  "jardinage",
  "demenagement",
  "menage",
  "animaux",
  "informatique",
  "plomberie",
  "electricite",
  "transport",
] as const;

const HERO_CATEGORIES = HERO_CATEGORY_SLUGS.map((slug) =>
  CATEGORY_META.find((cat) => cat.slug === slug)
).filter((cat): cat is (typeof CATEGORY_META)[number] => Boolean(cat));

export default function HomeCategoryChips() {
  return (
    <div
      className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible"
      role="list"
      aria-label="Catégories populaires"
    >
      {HERO_CATEGORIES.map((cat) => (
        <GuestBrowseTrigger
          key={cat.slug}
          browse="services"
          href={`/services/categorie/${cat.slug}`}
          className="group flex min-w-[4.75rem] shrink-0 flex-col items-center gap-2 rounded-2xl px-1 py-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <span
            className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-100 dark:bg-brand-900/40 dark:text-brand-300"
            aria-hidden
          >
            <CategoryIcon slug={cat.slug} size={26} />
          </span>
          <span className="text-center text-xs font-medium text-foreground">
            {cat.name}
          </span>
        </GuestBrowseTrigger>
      ))}
    </div>
  );
}
