"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import PublicListExplorerShell from "@/components/search/PublicListExplorerShell";
import { MapPinIcon } from "@/components/ui/app-icons";
import ProviderRatingBadge from "@/components/search/ProviderRatingBadge";
import SuggestedProvidersSection, {
  type SuggestedProvider,
} from "@/components/search/SuggestedProvidersSection";
import EntrepriseIndividuelleBadge from "@/components/profile/EntrepriseIndividuelleBadge";
import UserAvatar from "@/components/profile/UserAvatar";
import OptimizedImage from "@/components/ui/OptimizedImage";
import {
  servicesCategoryPath,
  type ServiceCategory,
} from "@/lib/categories";
import { usePublicListSearch } from "@/hooks/usePublicListSearch";

interface Provider {
  id: string;
  name: string;
  avatar: string | null;
  isEntrepriseIndividuelle?: boolean;
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
    handleCategoryClick,
    advancedFilterHandlers,
  } = usePublicListSearch({ lockedCategory, listBasePath });

  const [services, setServices] = useState<Service[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedProvider[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/services?${apiParams.toString()}`);
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
  }, [apiParams]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return (
    <PublicListExplorerShell
      title={title}
      titleIconSlug={titleIconSlug}
      searchPlaceholder="Mots-clés, ville, prestataire…"
      search={search}
      onSearchChange={setSearch}
      onSearchSubmit={handleSearchSubmit}
      categoryChips={{
        lockedCategory,
        activeCategory: effectiveCategory,
        category,
        allHref: "/services",
        getCategoryHref: servicesCategoryPath,
        style: "brand",
        tousIsButton: !lockedCategory,
        onCategoryToggle: handleCategoryClick,
      }}
      advancedFilters={{
        location,
        minPrice,
        maxPrice,
        sort: effectiveSort,
        ...advancedFilterHandlers,
      }}
      resultCount={
        pagination && !loading ? (
          <p className="text-sm text-muted-foreground mb-4 -mt-2">
            {pagination.total} service{pagination.total !== 1 ? "s" : ""} trouvé
            {pagination.total !== 1 ? "s" : ""}
            {lockedCategory ? ` en ${lockedCategory}` : ""}
          </p>
        ) : undefined
      }
      beforeResults={
        !loading && !error && suggestions.length > 0 ? (
          <SuggestedProvidersSection providers={suggestions} />
        ) : undefined
      }
      loading={loading}
      error={error}
      onRetry={fetchServices}
      emptyTitle="Aucun service trouvé"
      loadingSkeleton="detailed"
      pagination={pagination}
      page={page}
      onPageChange={setPage}
      paginationHoverClass="hover:border-brand-300"
    >
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
                  alt={`Image de couverture : ${service.title}`}
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
                  <span className="flex items-center gap-1 min-w-0">
                    <span className="text-muted-foreground text-xs truncate">
                      {service.provider.name}
                    </span>
                    {service.provider.isEntrepriseIndividuelle ? (
                      <EntrepriseIndividuelleBadge />
                    ) : null}
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
    </PublicListExplorerShell>
  );
}
