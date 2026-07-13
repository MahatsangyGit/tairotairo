"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import AdvancedSearchFilters, {
  type AdvancedSearchFiltersProps,
} from "@/components/search/AdvancedSearchFilters";
import CategoryIcon from "@/components/categories/CategoryIcon";
import { CATEGORY_META, type ServiceCategory } from "@/lib/categories";

export interface PublicListPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type CategoryChipStyle = "brand" | "neutral";

interface CategoryChipsConfig {
  lockedCategory?: ServiceCategory;
  activeCategory: string;
  category: string;
  allHref: string;
  getCategoryHref: (slug: string) => string;
  style: CategoryChipStyle;
  /** When true, "Tous" is a button that toggles category instead of a link. */
  tousIsButton?: boolean;
  onCategoryToggle?: (category: string) => void;
}

interface PublicListExplorerShellProps {
  title: string;
  subtitle?: string;
  titleIconSlug?: string;
  searchPlaceholder: string;
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  categoryChips: CategoryChipsConfig;
  advancedFilters: AdvancedSearchFiltersProps;
  resultCount?: ReactNode;
  beforeResults?: ReactNode;
  loading: boolean;
  error: string;
  onRetry: () => void;
  emptyTitle: string;
  loadingSkeleton?: "detailed" | "simple";
  pagination: PublicListPagination | null;
  page: number;
  onPageChange: (page: number) => void;
  paginationHoverClass?: string;
  children: ReactNode;
}

function activeChipClass(style: CategoryChipStyle, active: boolean): string {
  if (style === "brand") {
    return active
      ? "bg-brand-600 text-white border-brand-600"
      : "bg-card text-muted-foreground border-neutral-200 hover:border-brand-300 hover:text-brand-600";
  }
  return active
    ? "bg-neutral-900 text-white border-neutral-900"
    : "bg-card text-muted-foreground border-neutral-200 hover:border-neutral-400";
}

function inactiveTousClass(style: CategoryChipStyle): string {
  return style === "brand"
    ? "bg-card text-muted-foreground border-neutral-200 hover:border-brand-300 hover:text-brand-600"
    : "bg-card text-muted-foreground border-neutral-200 hover:border-neutral-400";
}

function CategoryChips({
  lockedCategory,
  activeCategory,
  category,
  allHref,
  getCategoryHref,
  style,
  tousIsButton,
  onCategoryToggle,
}: CategoryChipsConfig) {
  const tousActive = category === "";

  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {tousIsButton ? (
        <button
          type="button"
          onClick={() => onCategoryToggle?.("")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            tousActive ? activeChipClass(style, true) : inactiveTousClass(style)
          }`}
        >
          Tous
        </button>
      ) : (
        <Link
          href={allHref}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            tousActive ? activeChipClass(style, true) : inactiveTousClass(style)
          }`}
        >
          Tous
        </Link>
      )}
      {CATEGORY_META.map((cat) => (
        <Link
          key={cat.slug}
          href={getCategoryHref(cat.slug)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${activeChipClass(
            style,
            lockedCategory
              ? lockedCategory === cat.name
              : activeCategory === cat.name
          )}`}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}

function LoadingSkeleton({ variant }: { variant: "detailed" | "simple" }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) =>
        variant === "detailed" ? (
          <div
            key={i}
            className="bg-card rounded-2xl border border-border p-5 animate-pulse"
          >
            <div className="h-3 bg-neutral-100 rounded-full w-1/4 mb-4" />
            <div className="h-4 bg-neutral-100 rounded-full w-3/4 mb-3" />
            <div className="h-3 bg-neutral-100 rounded-full w-full mb-2" />
            <div className="h-3 bg-neutral-100 rounded-full w-2/3 mb-6" />
            <div className="h-4 bg-neutral-100 rounded-full w-1/4" />
          </div>
        ) : (
          <div
            key={i}
            className="bg-card rounded-2xl border border-border p-5 animate-pulse h-40"
          />
        )
      )}
    </div>
  );
}

export default function PublicListExplorerShell({
  title,
  subtitle,
  titleIconSlug,
  searchPlaceholder,
  search,
  onSearchChange,
  onSearchSubmit,
  categoryChips,
  advancedFilters,
  resultCount,
  beforeResults,
  loading,
  error,
  onRetry,
  emptyTitle,
  loadingSkeleton = "detailed",
  pagination,
  page,
  onPageChange,
  paginationHoverClass = "hover:border-brand-300",
  children,
}: PublicListExplorerShellProps) {
  const hasResults = !loading && !error && pagination !== null;

  return (
    <>
      <section className="bg-neutral-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1
            className={`text-3xl font-bold flex items-center gap-3 ${
              subtitle ? "mb-2" : "mb-5"
            }`}
          >
            {titleIconSlug && (
              <span
                className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-brand-500/15 text-brand-400 shrink-0"
                aria-hidden
              >
                <CategoryIcon slug={titleIconSlug} size={26} />
              </span>
            )}
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground text-sm mb-5">{subtitle}</p>
          )}
          <form onSubmit={onSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-neutral-400 text-sm focus:outline-none focus:border-brand-400 focus:bg-white/15 transition-all"
            />
            <button
              type="submit"
              className="bg-brand-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-brand-500 transition-colors shrink-0"
            >
              Rechercher
            </button>
          </form>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CategoryChips {...categoryChips} />

        <AdvancedSearchFilters {...advancedFilters} />

        {resultCount}

        {beforeResults}

        {loading && <LoadingSkeleton variant={loadingSkeleton} />}

        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="text-brand-600 font-medium hover:underline text-sm"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && pagination?.total === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-2">{emptyTitle}</p>
            <p className="text-muted-foreground text-sm">
              Essayez avec d&apos;autres filtres
            </p>
          </div>
        )}

        {hasResults && pagination.total > 0 && (
          <>
            {children}

            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  type="button"
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className={`px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground ${paginationHoverClass} disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
                >
                  ← Précédent
                </button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onPageChange(Math.min(pagination.totalPages, page + 1))
                  }
                  disabled={page === pagination.totalPages}
                  className={`px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground ${paginationHoverClass} disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
                >
                  Suivant →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
