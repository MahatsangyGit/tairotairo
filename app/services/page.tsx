"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AdvancedSearchFilters from "@/components/search/AdvancedSearchFilters";
import ProviderRatingBadge from "@/components/search/ProviderRatingBadge";
import SuggestedProvidersSection, {
  type SuggestedProvider,
} from "@/components/search/SuggestedProvidersSection";
import UserAvatar from "@/components/profile/UserAvatar";
import { SERVICE_CATEGORIES } from "@/lib/categories";
import {
  listSearchToParams,
  parseSearchSort,
  priceFromInput,
  type SearchSort,
} from "@/lib/advanced-search";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Provider {
  id:     string;
  name:   string;
  avatar: string | null;
}

interface Service {
  id:          string;
  title:       string;
  description: string;
  price:       number;
  category:    string;
  location:    string;
  createdAt:   string;
  provider:    Provider;
  averageRating: number | null;
  reviewCount: number;
}

interface Pagination {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

function ServicesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
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
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = listSearchToParams({
        search,
        category,
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
  }, [search, category, location, minPrice, maxPrice, sort, page]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    const params = listSearchToParams({
      search,
      category,
      location,
      minPrice: priceFromInput(minPrice),
      maxPrice: priceFromInput(maxPrice),
      sort,
      page,
    });
    const qs = params.toString();
    router.replace(qs ? `/services?${qs}` : "/services", { scroll: false });
  }, [search, category, location, minPrice, maxPrice, sort, page, router]);

  const resetAdvancedFilters = () => {
    setLocation("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    setPage(1);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCategoryClick = (cat: string) => {
    setCategory(cat === category ? "" : cat);
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* ── Header + recherche ── */}
      <section className="bg-brand-600 text-white py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-center">
            Trouvez le bon prestataire
          </h1>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Mots-clés (titre, description, ville, prestataire…)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              className="bg-white text-brand-600 px-6 py-3 rounded-lg font-semibold hover:bg-brand-50 transition-colors"
            >
              Rechercher
            </button>
          </form>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── Pills catégories ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => handleCategoryClick("")}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              category === ""
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-brand-400"
            }`}
          >
            Tous
          </button>
          {SERVICE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                category === cat
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-brand-400"
              }`}
            >
              {cat}
            </button>
          ))}
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
          <p className="text-sm text-gray-500 mb-4 -mt-2">
            {pagination.total} service{pagination.total !== 1 ? "s" : ""}{" "}
            trouvé{pagination.total !== 1 ? "s" : ""}
          </p>
        )}

        {!loading && !error && suggestions.length > 0 && (
          <SuggestedProvidersSection providers={suggestions} />
        )}

        {/* ── Skeleton loading ── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-6" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        )}

        {/* ── Erreur ── */}
        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={fetchServices} className="text-brand-600 font-medium hover:underline">
              Réessayer
            </button>
          </div>
        )}

        {/* ── Vide ── */}
        {!loading && !error && services.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-2">Aucun service trouvé</p>
            <p className="text-gray-400 text-sm">Essayez avec d'autres filtres</p>
          </div>
        )}

        {/* ── Grille ── */}
        {!loading && !error && services.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <Link
                  key={service.id}
                  href={`/services/${service.id}`}
                  className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-brand-200 transition-all"
                >
                  <span className="inline-block bg-brand-50 text-brand-700 text-xs font-medium px-2.5 py-1 rounded-full mb-3">
                    {service.category}
                  </span>

                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-1">
                    {service.title}
                  </h3>

                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                    {service.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-brand-600 font-bold">
                      {service.price.toLocaleString("fr-MG")} Ar
                    </span>
                    <span className="text-gray-400 text-xs">
                      📍 {service.location}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatar
                        name={service.provider.name}
                        avatar={service.provider.avatar}
                        size="xs"
                      />
                      <span className="text-gray-600 text-sm truncate">
                        {service.provider.name}
                      </span>
                    </div>
                    <ProviderRatingBadge
                      averageRating={service.averageRating}
                      reviewCount={service.reviewCount}
                    />
                  </div>
                </Link>
              ))}
            </div>

            {/* ── Pagination ── */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-brand-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Précédent
                </button>
                <span className="text-sm text-gray-500 px-2">
                  Page {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-brand-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500">Chargement...</p>
        </div>
      }
    >
      <ServicesPageContent />
    </Suspense>
  );
}