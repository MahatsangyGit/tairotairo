import prisma from "@/lib/prisma";
import {
  averageRating,
  buildServiceWhere,
  serviceOrderBy,
  type ParsedListSearch,
} from "@/lib/advanced-search";
import { getSubscribedProviderSuggestions } from "@/lib/provider-list-search";
import { withCoverImageUrl } from "@/lib/listing-cover";
import {
  findServiceIdsByProviderRating,
  getProviderRatingMap,
} from "@/lib/rating-sort-search";
import { withEiFlag } from "@/lib/provider-legal";

const providerSelect = {
  id: true,
  name: true,
  avatar: true,
  nif: true,
  stat: true,
  rcs: true,
} as const;

function serializeService(
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    location: string;
    coverImageMime: string | null;
    updatedAt: Date;
    createdAt: Date;
    provider: {
      id: string;
      name: string;
      avatar: string | null;
      nif: string | null;
      stat: string | null;
      rcs: string | null;
    };
  },
  rating: { averageRating: number | null; reviewCount: number }
) {
  return withCoverImageUrl("service", {
    id: service.id,
    title: service.title,
    description: service.description,
    price: service.price,
    category: service.category,
    location: service.location,
    coverImageMime: service.coverImageMime,
    updatedAt: service.updatedAt,
    createdAt: service.createdAt,
    provider: withEiFlag(service.provider),
    ...rating,
  });
}

export async function searchPublicServices(params: ParsedListSearch) {
  const where = buildServiceWhere(params);
  const orderBy = serviceOrderBy(params.sort);
  const skip = (params.page - 1) * params.limit;

  const suggestionsPromise = getSubscribedProviderSuggestions();

  if (params.sort === "rating") {
    const [{ ids, total }, suggestions] = await Promise.all([
      findServiceIdsByProviderRating(params),
      suggestionsPromise,
    ]);

    if (ids.length === 0) {
      return {
        services: [],
        suggestions,
        pagination: {
          total,
          page: params.page,
          limit: params.limit,
          totalPages: Math.max(1, Math.ceil(total / params.limit)),
        },
      };
    }

    const rows = await prisma.service.findMany({
      where: { id: { in: ids } },
      include: { provider: { select: providerSelect } },
    });

    const order = new Map(ids.map((id, index) => [id, index]));
    rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

    const ratingMap = await getProviderRatingMap(
      rows.map((r) => r.provider.id)
    );

    return {
      services: rows.map((row) =>
        serializeService(
          row,
          ratingMap.get(row.provider.id) ?? {
            averageRating: null,
            reviewCount: 0,
          }
        )
      ),
      suggestions,
      pagination: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.max(1, Math.ceil(total / params.limit)),
      },
    };
  }

  const [rows, total, suggestions] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take: params.limit,
      orderBy: orderBy ?? { createdAt: "desc" },
      include: { provider: { select: providerSelect } },
    }),
    prisma.service.count({ where }),
    suggestionsPromise,
  ]);

  const ratingMap = await getProviderRatingMap(rows.map((r) => r.provider.id));

  return {
    services: rows.map((row) =>
      serializeService(
        row,
        ratingMap.get(row.provider.id) ?? { averageRating: null, reviewCount: 0 }
      )
    ),
    suggestions,
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.max(1, Math.ceil(total / params.limit)),
    },
  };
}

// Re-export for tests
export { averageRating };
