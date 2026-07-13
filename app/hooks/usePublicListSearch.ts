"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  listSearchToParams,
  parseSearchSort,
  priceFromInput,
  type SearchSort,
} from "@/lib/advanced-search";
import type { ServiceCategory } from "@/lib/categories";

export interface UsePublicListSearchOptions {
  lockedCategory?: ServiceCategory;
  listBasePath: string;
  /** Adjust sort before API calls and URL sync (e.g. requests map rating → newest). */
  mapSort?: (sort: SearchSort) => SearchSort;
}

export function usePublicListSearch({
  lockedCategory,
  listBasePath,
  mapSort = (s) => s,
}: UsePublicListSearchOptions) {
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

  const effectiveCategory = lockedCategory ?? category;
  const effectiveSort = mapSort(sort);

  const apiParams = useMemo(
    () =>
      listSearchToParams({
        search,
        category: effectiveCategory,
        location,
        minPrice: priceFromInput(minPrice),
        maxPrice: priceFromInput(maxPrice),
        sort: effectiveSort,
        page,
      }),
    [
      search,
      effectiveCategory,
      location,
      minPrice,
      maxPrice,
      effectiveSort,
      page,
    ]
  );

  useEffect(() => {
    const qs = apiParams.toString();
    router.replace(qs ? `${listBasePath}?${qs}` : listBasePath, {
      scroll: false,
    });
  }, [apiParams, listBasePath, router]);

  const resetPage = useCallback(() => setPage(1), []);

  const resetAdvancedFilters = useCallback(() => {
    setLocation("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    setPage(1);
  }, []);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  }, []);

  const handleCategoryClick = useCallback(
    (cat: string) => {
      if (lockedCategory) return;
      setCategory((prev) => (cat === prev ? "" : cat));
      setPage(1);
    },
    [lockedCategory]
  );

  const advancedFilterHandlers = useMemo(
    () => ({
      onLocationChange: (v: string) => {
        setLocation(v);
        resetPage();
      },
      onMinPriceChange: (v: string) => {
        setMinPrice(v);
        resetPage();
      },
      onMaxPriceChange: (v: string) => {
        setMaxPrice(v);
        resetPage();
      },
      onSortChange: (v: SearchSort) => {
        setSort(v);
        resetPage();
      },
      onReset: resetAdvancedFilters,
    }),
    [resetAdvancedFilters, resetPage]
  );

  return {
    search,
    setSearch,
    category,
    setCategory,
    location,
    minPrice,
    maxPrice,
    sort,
    setSort,
    page,
    setPage,
    effectiveCategory,
    effectiveSort,
    apiParams,
    resetAdvancedFilters,
    handleSearchSubmit,
    handleCategoryClick,
    advancedFilterHandlers,
  };
}
