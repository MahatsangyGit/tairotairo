"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import PublicListExplorerShell from "@/components/search/PublicListExplorerShell";
import { MapPinIcon } from "@/components/ui/app-icons";
import {
  requestsCategoryPath,
  type ServiceCategory,
} from "@/lib/categories";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { formatSchedule } from "@/lib/datetime-slot";
import { usePublicListSearch } from "@/hooks/usePublicListSearch";
import type { SearchSort } from "@/lib/advanced-search";

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
  titleIconSlug?: string;
}

function requestSort(sort: SearchSort): SearchSort {
  return sort === "rating" ? "newest" : sort;
}

export default function PublicRequestsExplorer({
  lockedCategory,
  listBasePath = "/requests",
  title = "Demandes de clients",
  subtitle = "Trouvez des missions publiées par des particuliers",
  titleIconSlug,
}: PublicRequestsExplorerProps) {
  const {
    search,
    setSearch,
    category,
    location,
    minPrice,
    maxPrice,
    sort,
    page,
    setPage,
    effectiveCategory,
    effectiveSort,
    apiParams,
    handleSearchSubmit,
    advancedFilterHandlers,
  } = usePublicListSearch({
    lockedCategory,
    listBasePath,
    mapSort: requestSort,
  });

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/requests?${apiParams.toString()}`);
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
  }, [apiParams]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <PublicListExplorerShell
      title={title}
      subtitle={subtitle}
      titleIconSlug={titleIconSlug}
      searchPlaceholder="Mots-clés, ville, client…"
      search={search}
      onSearchChange={setSearch}
      onSearchSubmit={handleSearchSubmit}
      categoryChips={{
        lockedCategory,
        activeCategory: effectiveCategory,
        category,
        allHref: "/requests",
        getCategoryHref: requestsCategoryPath,
        style: "neutral",
      }}
      advancedFilters={{
        variant: "amber",
        priceLabel: "Budget (Ar)",
        showRatingSort: false,
        location,
        minPrice,
        maxPrice,
        sort: effectiveSort,
        ...advancedFilterHandlers,
      }}
      resultCount={
        pagination && !loading ? (
          <p className="text-sm text-muted-foreground mb-4 -mt-2">
            {pagination.total} demande{pagination.total !== 1 ? "s" : ""} trouvée
            {pagination.total !== 1 ? "s" : ""}
            {lockedCategory ? ` en ${lockedCategory}` : ""}
          </p>
        ) : undefined
      }
      loading={loading}
      error={error}
      onRetry={fetchRequests}
      emptyTitle="Aucune demande trouvée"
      loadingSkeleton="simple"
      pagination={pagination}
      page={page}
      onPageChange={setPage}
      paginationHoverClass="hover:border-neutral-400"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {requests.map((request) => (
          <Link
            key={request.id}
            href={`/requests/${request.id}`}
            className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md hover:border-neutral-300 transition-all"
          >
            {request.coverImageUrl && (
              <div className="relative w-full h-36 bg-muted">
                <OptimizedImage
                  src={request.coverImageUrl}
                  alt={`Image de couverture : ${request.title}`}
                  fill
                />
              </div>
            )}
            <div className="p-5">
              <span className="inline-block bg-brand-50 text-brand-700 text-xs font-medium px-2.5 py-1 rounded-full mb-3">
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
                    <MapPinIcon /> {request.location}
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
    </PublicListExplorerShell>
  );
}
