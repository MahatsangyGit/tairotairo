"use client";

import {
  SEARCH_SORT_OPTIONS,
  type SearchSort,
} from "@/lib/advanced-search";

interface AdvancedSearchFiltersProps {
  variant?: "brand" | "amber";
  location: string;
  minPrice: string;
  maxPrice: string;
  sort: SearchSort;
  onLocationChange: (value: string) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onSortChange: (value: SearchSort) => void;
  onReset: () => void;
  showRatingSort?: boolean;
  priceLabel?: string;
}

export default function AdvancedSearchFilters({
  variant = "brand",
  location,
  minPrice,
  maxPrice,
  sort,
  onLocationChange,
  onMinPriceChange,
  onMaxPriceChange,
  onSortChange,
  onReset,
  showRatingSort = true,
  priceLabel = "Prix (Ar)",
}: AdvancedSearchFiltersProps) {
  const focusClass =
    variant === "amber"
      ? "focus:border-amber-500"
      : "focus:border-brand-500";
  const sortOptions = showRatingSort
    ? SEARCH_SORT_OPTIONS
    : SEARCH_SORT_OPTIONS.filter((o) => o.value !== "rating");

  const hasActiveFilters =
    location.trim() !== "" ||
    minPrice.trim() !== "" ||
    maxPrice.trim() !== "" ||
    sort !== "newest";

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-sm font-semibold text-foreground">
          Recherche avancée
        </h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <label className="block sm:col-span-2 lg:col-span-1">
          <span className="text-xs font-medium text-muted-foreground mb-1 block">
            Localisation
          </span>
          <input
            type="text"
            placeholder="Ville (ex: Antananarivo)"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className={`w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none ${focusClass}`}
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground mb-1 block">
            {priceLabel} min
          </span>
          <input
            type="number"
            min={0}
            step={1000}
            placeholder="0"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            className={`w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none ${focusClass}`}
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground mb-1 block">
            {priceLabel} max
          </span>
          <input
            type="number"
            min={0}
            step={1000}
            placeholder="Illimité"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            className={`w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none ${focusClass}`}
          />
        </label>

        <label className="block sm:col-span-2 lg:col-span-1">
          <span className="text-xs font-medium text-muted-foreground mb-1 block">
            Tri
          </span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SearchSort)}
            className={`w-full px-3 py-2 border border-border rounded-lg text-sm bg-card focus:outline-none ${focusClass}`}
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Les mots-clés recherchent dans le titre, la description, la catégorie et
        la localisation.
        {showRatingSort
          ? " Le tri par note classe les prestataires les mieux notés en premier."
          : ""}
      </p>
    </div>
  );
}
