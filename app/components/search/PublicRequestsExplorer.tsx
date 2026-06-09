"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AdvancedSearchFilters from "@/components/search/AdvancedSearchFilters";
import {
  CATEGORY_META,
  requestsCategoryPath,
  type ServiceCategory,
} from "@/lib/categories";
import {
  listSearchToParams,
  parseSearchSort,
  priceFromInput,
  type SearchSort,
} from "@/lib/advanced-search";
import { formatSchedule } from "@/lib/datetime-slot";

interface Client {
  id: string;
  name: string;
  avatar: string | null;
}

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  location: string;
  coverImageUrl: string | null;
  desiredDate: string | null;
  desiredSlotStart: string | null;
  desiredSlotEnd: string | null;
  createdAt: string;
  client: Client;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PublicRequestsExplorerProps {
  lockedCategory?: ServiceCategory;
  listBasePath?: string;
  title?: string;
  subtitle?: string;
}

export default function PublicRequestsExplorer({
  lockedCategory,
  listBasePath = "/requests",
  title = "Demandes de clients",
  subtitle = "Trouvez des missions publiées par des particuliers",
}: PublicRequestsExplorerProps) {
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

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const effectiveCategory = lockedCategory ?? category;
  const effectiveSort = sort === "rating" ? "newest" : sort;

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = listSearchToParams({
        search,
        category: effectiveCategory,
        location,
        minPrice: priceFromInput(minPrice),
        maxPrice: priceFromInput(maxPrice),
        sort: effectiveSort,
        page,
      });

      const res = await fetch(`/api/requests?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur lors du chargement");
        return;
      }

      setRequests(data.requests);
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
    effectiveSort,
    page,
  ]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    const params = listSearchToParams({
      search,
      category: effectiveCategory,
      location,
      minPrice: priceFromInput(minPrice),
      maxPrice: priceFromInput(maxPrice),
      sort: effectiveSort,
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
    effectiveSort,
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <>
      <section className="bg-neutral-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground text-sm mb-5">{subtitle}</p>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Mots-clés, ville, client…"
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
              href="/requests"
              className="px-4 py-1.5 rounded-full text-sm font-medium border bg-card text-muted-foreground border-neutral-200 hover:border-neutral-400 transition-colors"
            >
              Tous
            </Link>
          ) : (
            <Link
              href="/requests"
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                category === ""
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-card text-muted-foreground border-neutral-200 hover:border-neutral-400"
              }`}
            >
              Tous
            </Link>
          )}
          {CATEGORY_META.map((cat) => (
            <Link
              key={cat.slug}
              href={requestsCategoryPath(cat.slug)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                effectiveCategory === cat.name
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-card text-muted-foreground border-neutral-200 hover:border-neutral-400"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        <AdvancedSearchFilters
          variant="amber"
          priceLabel="Budget (Ar)"
          showRatingSort={false}
          location={location}
          minPrice={minPrice}
          maxPrice={maxPrice}
          sort={effectiveSort}
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
            {pagination.total} demande{pagination.total !== 1 ? "s" : ""} trouvée
            {pagination.total !== 1 ? "s" : ""}
            {lockedCategory ? ` en ${lockedCategory}` : ""}
          </p>
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-border p-5 animate-pulse h-40"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchRequests}
              className="text-brand-600 font-medium hover:underline text-sm"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-2">Aucune demande trouvée</p>
            <p className="text-muted-foreground text-sm">
              Essayez avec d&apos;autres filtres
            </p>
          </div>
        )}

        {!loading && !error && requests.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests.map((request) => (
                <Link
                  key={request.id}
                  href={`/requests/${request.id}`}
                  className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md hover:border-neutral-300 transition-all"
                >
                  {request.coverImageUrl && (
                    <img
                      src={request.coverImageUrl}
                      alt=""
                      className="w-full h-36 object-cover bg-muted"
                    />
                  )}
                  <div className="p-5">
                  <span className="inline-block bg-neutral-100 text-foreground text-xs font-medium px-2.5 py-1 rounded-full mb-3">
                    {request.category}
                  </span>
                  <h3 className="font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-brand-700 transition-colors">
                    {request.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {request.description}
                  </p>
                  <div className="flex flex-col gap-1 mb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground font-bold text-sm">
                        Budget {request.budget.toLocaleString("fr-MG")} Ar
                      </span>
                      <span className="text-muted-foreground text-xs">
                        📍 {request.location}
                      </span>
                    </div>
                    {request.desiredDate && (
                      <span className="text-muted-foreground text-xs">
                        📅{" "}
                        {formatSchedule(
                          request.desiredDate,
                          request.desiredSlotStart,
                          request.desiredSlotEnd
                        )}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                    <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-muted-foreground font-semibold text-xs shrink-0">
                      {request.client.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-muted-foreground text-xs truncate">
                      {request.client.name}
                    </span>
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
                  className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:border-neutral-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                  className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:border-neutral-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
