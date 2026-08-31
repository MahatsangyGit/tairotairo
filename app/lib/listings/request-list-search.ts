import prisma from "@/lib/prisma";
import {
  buildRequestWhere,
  requestOrderBy,
  type ParsedListSearch,
} from "@/lib/advanced-search";
import { withCoverImageUrl } from "@/lib/listing-cover";
import { findRequestIdsByClientRating } from "@/lib/rating-sort-search";

export async function searchPublicRequests(params: ParsedListSearch) {
  const where = buildRequestWhere(params);
  const orderBy = requestOrderBy(params.sort);
  const skip = (params.page - 1) * params.limit;

  if (params.sort === "rating") {
    const { ids, total } = await findRequestIdsByClientRating(params);

    if (ids.length === 0) {
      return {
        requests: [],
        pagination: {
          total,
          page: params.page,
          limit: params.limit,
          totalPages: Math.max(1, Math.ceil(total / params.limit)),
        },
      };
    }

    const rows = await prisma.serviceRequest.findMany({
      where: { id: { in: ids } },
      include: {
        client: { select: { id: true, name: true, avatar: true } },
      },
    });

    const order = new Map(ids.map((id, index) => [id, index]));
    rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

    return {
      requests: rows.map((r) => withCoverImageUrl("request", r)),
      pagination: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.max(1, Math.ceil(total / params.limit)),
      },
    };
  }

  const [requests, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      skip,
      take: params.limit,
      orderBy: orderBy ?? { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true, avatar: true } },
      },
    }),
    prisma.serviceRequest.count({ where }),
  ]);

  return {
    requests: requests.map((r) => withCoverImageUrl("request", r)),
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.max(1, Math.ceil(total / params.limit)),
    },
  };
}
