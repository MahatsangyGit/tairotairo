import prisma from "@/lib/prisma";
import {
  averageRating,
  buildServiceWhere,
  paginate,
  serviceOrderBy,
  type ParsedListSearch,
} from "@/lib/advanced-search";

const providerSelect = {
  id: true,
  name: true,
  avatar: true,
  reviewsReceived: { select: { rating: true } },
} as const;

function serializeService(
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    location: string;
    createdAt: Date;
    provider: {
      id: string;
      name: string;
      avatar: string | null;
      reviewsReceived: { rating: number }[];
    };
  }
) {
  const { reviewsReceived, ...provider } = service.provider;
  const rating = averageRating(reviewsReceived);
  return {
    id: service.id,
    title: service.title,
    description: service.description,
    price: service.price,
    category: service.category,
    location: service.location,
    createdAt: service.createdAt,
    provider,
    ...rating,
  };
}

export async function searchPublicServices(params: ParsedListSearch) {
  const where = buildServiceWhere(params);
  const orderBy = serviceOrderBy(params.sort);
  const skip = (params.page - 1) * params.limit;

  if (params.sort === "rating") {
    const rows = await prisma.service.findMany({
      where,
      include: { provider: { select: providerSelect } },
    });

    const enriched = rows
      .map(serializeService)
      .sort((a, b) => {
        const ra = a.averageRating ?? 0;
        const rb = b.averageRating ?? 0;
        if (rb !== ra) return rb - ra;
        return b.reviewCount - a.reviewCount;
      });

    const { items, pagination } = paginate(enriched, params.page, params.limit);
    return { services: items, pagination };
  }

  const [rows, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take: params.limit,
      orderBy: orderBy ?? { createdAt: "desc" },
      include: { provider: { select: providerSelect } },
    }),
    prisma.service.count({ where }),
  ]);

  return {
    services: rows.map(serializeService),
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.max(1, Math.ceil(total / params.limit)),
    },
  };
}
