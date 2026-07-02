import type { Prisma } from "@/generated/prisma/client";
import {
  categoryDbValues,
  normalizeCategoryName,
} from "@/lib/categories";

function buildCategoryFilter(category: string) {
  const normalized = normalizeCategoryName(category);
  if (normalized) {
    return { category: { in: categoryDbValues(normalized) } };
  }
  if (category) {
    return { category };
  }
  return {};
}

export const SEARCH_SORT_OPTIONS = [
  { value: "newest", label: "Plus récents" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "location", label: "Localisation (A → Z)" },
  { value: "rating", label: "Meilleures notes" },
] as const;

export type SearchSort = (typeof SEARCH_SORT_OPTIONS)[number]["value"];

const VALID_SORTS = new Set<string>(SEARCH_SORT_OPTIONS.map((o) => o.value));

export interface ParsedListSearch {
  search: string;
  category: string;
  location: string;
  minPrice: number | null;
  maxPrice: number | null;
  sort: SearchSort;
  page: number;
  limit: number;
}

export function priceFromInput(value: string): number | null {
  if (!value.trim()) return null;
  const n = parseFloat(value);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

export function parseOptionalFloat(value: string | null): number | null {
  if (value == null || value.trim() === "") return null;
  const n = parseFloat(value);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

export function parseSearchSort(value: string | null): SearchSort {
  if (value && VALID_SORTS.has(value)) {
    return value as SearchSort;
  }
  return "newest";
}

export function parseListSearchParams(
  searchParams: URLSearchParams,
  defaultLimit = 10
): ParsedListSearch {
  let minPrice = parseOptionalFloat(searchParams.get("minPrice"));
  let maxPrice = parseOptionalFloat(searchParams.get("maxPrice"));

  if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") ?? String(defaultLimit), 10) ||
      defaultLimit)
  );

  return {
    search: (searchParams.get("search") ?? "").trim(),
    category: (searchParams.get("category") ?? "").trim(),
    location: (searchParams.get("location") ?? "").trim(),
    minPrice,
    maxPrice,
    sort: parseSearchSort(searchParams.get("sort")),
    page,
    limit,
  };
}

function keywordMode() {
  return "insensitive" as const;
}

export function buildServiceKeywordOr(
  search: string
): Prisma.ServiceWhereInput {
  const mode = keywordMode();
  return {
    OR: [
      { title: { contains: search, mode } },
      { description: { contains: search, mode } },
      { category: { contains: search, mode } },
      { location: { contains: search, mode } },
      { provider: { name: { contains: search, mode } } },
    ],
  };
}

export function buildRequestKeywordOr(
  search: string
): Prisma.ServiceRequestWhereInput {
  const mode = keywordMode();
  return {
    OR: [
      { title: { contains: search, mode } },
      { description: { contains: search, mode } },
      { category: { contains: search, mode } },
      { location: { contains: search, mode } },
      { client: { name: { contains: search, mode } } },
    ],
  };
}

export function buildServiceWhere(
  params: Pick<
    ParsedListSearch,
    "search" | "category" | "location" | "minPrice" | "maxPrice"
  >
): Prisma.ServiceWhereInput {
  const where: Prisma.ServiceWhereInput = {
    available: true,
    provider: { kycStatus: "APPROVED" },
    ...buildCategoryFilter(params.category),
    ...(params.location && {
      location: { contains: params.location, mode: "insensitive" },
    }),
    ...(params.search && buildServiceKeywordOr(params.search)),
  };

  if (params.minPrice != null || params.maxPrice != null) {
    where.price = {
      ...(params.minPrice != null && { gte: params.minPrice }),
      ...(params.maxPrice != null && { lte: params.maxPrice }),
    };
  }

  return where;
}

export function buildRequestWhere(
  params: Pick<
    ParsedListSearch,
    "search" | "category" | "location" | "minPrice" | "maxPrice"
  >
): Prisma.ServiceRequestWhereInput {
  const where: Prisma.ServiceRequestWhereInput = {
    open: true,
    ...buildCategoryFilter(params.category),
    ...(params.location && {
      location: { contains: params.location, mode: "insensitive" },
    }),
    ...(params.search && buildRequestKeywordOr(params.search)),
  };

  if (params.minPrice != null || params.maxPrice != null) {
    where.budget = {
      ...(params.minPrice != null && { gte: params.minPrice }),
      ...(params.maxPrice != null && { lte: params.maxPrice }),
    };
  }

  return where;
}

export function serviceOrderBy(
  sort: SearchSort
): Prisma.ServiceOrderByWithRelationInput | null {
  switch (sort) {
    case "price_asc":
      return { price: "asc" };
    case "price_desc":
      return { price: "desc" };
    case "location":
      return { location: "asc" };
    case "rating":
      return null;
    default:
      return { createdAt: "desc" };
  }
}

export function requestOrderBy(
  sort: SearchSort
): Prisma.ServiceRequestOrderByWithRelationInput | null {
  switch (sort) {
    case "price_asc":
      return { budget: "asc" };
    case "price_desc":
      return { budget: "desc" };
    case "location":
      return { location: "asc" };
    case "rating":
      return null;
    default:
      return { createdAt: "desc" };
  }
}

export function averageRating(
  ratings: { rating: number }[]
): { averageRating: number | null; reviewCount: number } {
  if (ratings.length === 0) {
    return { averageRating: null, reviewCount: 0 };
  }
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  const averageRating =
    Math.round((sum / ratings.length) * 10) / 10;
  return { averageRating, reviewCount: ratings.length };
}

export function paginate<T>(items: T[], page: number, limit: number) {
  const total = items.length;
  const skip = (page - 1) * limit;
  return {
    items: items.slice(skip, skip + limit),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export function listSearchToParams(
  filters: Omit<ParsedListSearch, "page" | "limit"> & { page?: number }
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.location) params.set("location", filters.location);
  if (filters.minPrice != null) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice != null) params.set("maxPrice", String(filters.maxPrice));
  if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  return params;
}
