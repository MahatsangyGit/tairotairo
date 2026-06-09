import prisma from "@/lib/prisma";
import {
  buildRequestWhere,
  paginate,
  requestOrderBy,
  type ParsedListSearch,
} from "@/lib/advanced-search";
import { withCoverImageUrl } from "@/lib/listing-cover";

export async function searchPublicRequests(params: ParsedListSearch) {
  const where = buildRequestWhere(params);
  const orderBy = requestOrderBy(params.sort);
  const skip = (params.page - 1) * params.limit;

  if (params.sort === "rating") {
    const rows = await prisma.serviceRequest.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const { items, pagination } = paginate(rows, params.page, params.limit);
    return {
      requests: items.map((r) => withCoverImageUrl("request", r)),
      pagination,
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
