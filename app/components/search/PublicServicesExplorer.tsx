"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AdvancedSearchFilters from "@/components/search/AdvancedSearchFilters";
import CategoryIcon from "@/components/categories/CategoryIcon";
import { MapPinIcon } from "@/components/ui/app-icons";
import ProviderRatingBadge from "@/components/search/ProviderRatingBadge";
import SuggestedProvidersSection, {
  type SuggestedProvider,
} from "@/components/search/SuggestedProvidersSection";
import UserAvatar from "@/components/profile/UserAvatar";
import OptimizedImage from "@/components/ui/OptimizedImage";
import {
  CATEGORY_META,
  servicesCategoryPath,
  type ServiceCategory,
} from "@/lib/categories";
import {
  listSearchToParams,
  parseSearchSort,
  priceFromInput,
  type SearchSort,
} from "@/lib/advanced-search";

interface Provider {
  id: string;
  name: string;
  avatar: string | null;
}

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  coverImageUrl: string | null;
  createdAt: string;
  provider: Provider;
  averageRating: number | null;
  reviewCount: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PublicServicesExplorerProps {
  lockedCategory?: ServiceCategory;
  listBasePath?: string;
  title?: string;
  titleIconSlug?: string;
}

export default function PublicServicesExplorer({
  lockedCategory,
  listBasePath = "/services",
  title = "Trouver un service",
  titleIconSlug,
}: PublicServicesExplorerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(
    lockedCategory ?? searchParams.get("category") ?? ""
  );
  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [sort, setSort] = useState<SearchSort>(
    parseSearchSort(searchParams.get("sort"))
  );
  const [page, setPage] = useState(
    Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)
  );

  const [services, setServices] = useState<Service[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedProvider[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const effectiveCategory = lockedCategory ?? category;

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = listSearchToParams({
        search,
        category: effectiveCategory,
        location,
        minPrice: priceFromInput(minPrice),
        maxPrice: priceFromInput(maxPrice),
        sort,
        page,
      });

      const res = await fetch(`/api/services?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur lors du chargement");
        return;
      }

      setServices(data.services);
      setSuggestions(data.suggestions ?? []);
      setPagination(data.pagination);
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, [
    search,
    effectiveCategory,
    location,
    minPrice,
    maxPrice,
    sort,
    page,
  ]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    const params = listSearchToParams({
      search,
      category: effectiveCategory,
      location,
      minPrice: priceFromInput(minPrice),
      maxPrice: priceFromInput(maxPrice),
      sort,
      page,
    });
    const qs = params.toString();
    router.replace(qs ? `${listBasePath}?${qs}` : listBasePath, {
      scroll: false,
    });
  }, [
    search,
    effectiveCategory,
    location,
    minPrice,
    maxPrice,
    sort,
    page,
    listBasePath,
    router,
  ]);

  const resetAdvancedFilters = () => {
    setLocation("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    setPage(1);
  };

  const handleCategoryClick = (cat: string) => {
    if (lockedCategory) return;
    setCategory(cat === category ? "" : cat);
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <>
      <section className="bg-neutral-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold mb-5 flex items-center gap-3">
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
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Mots-clés, ville, prestataire…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
        <div className="flex flex-wrap gap-2 mb-5">
          {lockedCategory ? (
            <Link
              href="/services"
              className="px-4 py-1.5 rounded-full text-sm font-medium border bg-card text-muted-foreground border-neutral-200 hover:border-brand-300 hover:text-brand-600 transition-colors"
            >
              Tous
            </Link>
          ) : (
            <button
              onClick={() => handleCategoryClick("")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                category === ""
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-card text-muted-foreground border-neutral-200 hover:border-brand-300 hover:text-brand-600"
              }`}
            >
              Tous
            </button>
          )}
          {CATEGORY_META.map((cat) =>
            lockedCategory ? (
              <Link
                key={cat.slug}
                href={servicesCategoryPath(cat.slug)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  lockedCategory === cat.name
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-card text-muted-foreground border-neutral-200 hover:border-brand-300 hover:text-brand-600"
                }`}
              >
                {cat.name}
              </Link>
            ) : (
              <Link
                key={cat.slug}
                href={servicesCategoryPath(cat.slug)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  category === cat.name
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-card text-muted-foreground border-neutral-200 hover:border-brand-300 hover:text-brand-600"
                }`}
              >
                {cat.name}
              </Link>
            )
          )}
        </div>

        <AdvancedSearchFilters
          location={location}
          minPrice={minPrice}
          maxPrice={maxPrice}
          sort={sort}
          onLocationChange={(v) => {
            setLocation(v);
            setPage(1);
          }}
          onMinPriceChange={(v) => {
            setMinPrice(v);
            setPage(1);
          }}
          onMaxPriceChange={(v) => {
            setMaxPrice(v);
            setPage(1);
          }}
          onSortChange={(v) => {
            setSort(v);
            setPage(1);
          }}
          onReset={resetAdvancedFilters}
        />

        {pagination && !loading && (
          <p className="text-sm text-muted-foreground mb-4 -mt-2">
            {pagination.total} service{pagination.total !== 1 ? "s" : ""} trouvé
            {pagination.total !== 1 ? "s" : ""}
            {lockedCategory ? ` en ${lockedCategory}` : ""}
          </p>
        )}

        {!loading && !error && suggestions.length > 0 && (
          <SuggestedProvidersSection providers={suggestions} />
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
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
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchServices}
              className="text-brand-600 font-medium hover:underline text-sm"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && services.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-2">Aucun service trouvé</p>
            <p className="text-muted-foreground text-sm">
              Essayez avec d&apos;autres filtres
            </p>
          </div>
        )}

        {!loading && !error && services.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <Link
                  key={service.id}
                  href={`/services/${service.id}`}
                  className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md hover:border-brand-200 transition-all"
                >
                  {service.coverImageUrl && (
                    <div className="relative w-full h-36 bg-muted">
                      <OptimizedImage
                        src={service.coverImageUrl}
                        alt=""
                        fill
                      />
                    </div>
                  )}
                  <div className="p-5">
                  <span className="inline-block bg-brand-50 text-brand-700 text-xs font-medium px-2.5 py-1 rounded-full mb-3">
                    {service.category}
                  </span>
                  <h3 className="font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-brand-700 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-brand-600 font-bold text-sm">
                      {service.price.toLocaleString("fr-MG")} Ar
                    </span>
                    <span className="text-muted-foreground text-xs">
                      <MapPinIcon /> {service.location}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatar
                        name={service.provider.name}
                        avatar={service.provider.avatar}
                        size="xs"
                      />
                      <span className="text-muted-foreground text-xs truncate">
                        {service.provider.name}
                      </span>
                    </div>
                    <ProviderRatingBadge
                      averageRating={service.averageRating}
                      reviewCount={service.reviewCount}
                    />
                  </div>
                  </div>
                </Link>
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:border-brand-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Précédent
                </button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:border-brand-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
