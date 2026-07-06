import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import {
  buildServiceWhere,
  buildRequestWhere,
  type ParsedListSearch,
} from "@/lib/advanced-search";

type RatingSortIds = { ids: string[]; total: number };

function serviceRatingWhereSql(
  params: Pick<
    ParsedListSearch,
    "search" | "category" | "location" | "minPrice" | "maxPrice"
  >
): Prisma.Sql {
  const clauses: Prisma.Sql[] = [
    Prisma.sql`s.available = true`,
    Prisma.sql`u."kycStatus" = 'APPROVED'::"KycStatus"`,
  ];

  if (params.category) {
    const where = buildServiceWhere({ ...params, search: "", location: "" });
    const cat = (where as { category?: unknown }).category;
    if (cat && typeof cat === "object" && cat !== null && "in" in cat) {
      const values = (cat as { in: string[] }).in;
      clauses.push(
        Prisma.sql`s.category IN (${Prisma.join(values.map((v) => Prisma.sql`${v}`))})`
      );
    } else if (params.category) {
      clauses.push(Prisma.sql`s.category = ${params.category}`);
    }
  }

  if (params.location) {
    clauses.push(
      Prisma.sql`s.location ILIKE ${`%${params.location}%`}`
    );
  }

  if (params.minPrice != null) {
    clauses.push(Prisma.sql`s.price >= ${params.minPrice}`);
  }
  if (params.maxPrice != null) {
    clauses.push(Prisma.sql`s.price <= ${params.maxPrice}`);
  }

  if (params.search) {
    const term = `%${params.search}%`;
    clauses.push(Prisma.sql`(
      s.title ILIKE ${term}
      OR s.description ILIKE ${term}
      OR s.category ILIKE ${term}
      OR s.location ILIKE ${term}
      OR u.name ILIKE ${term}
    )`);
  }

  return Prisma.join(clauses, " AND ");
}

export async function findServiceIdsByProviderRating(
  params: ParsedListSearch
): Promise<RatingSortIds> {
  const whereSql = serviceRatingWhereSql(params);
  const skip = (params.page - 1) * params.limit;

  const [rows, countRow] = await Promise.all([
    prisma.$queryRaw<{ id: string }[]>`
      WITH filtered AS (
        SELECT s.id, s."providerId", s."createdAt"
        FROM "Service" s
        INNER JOIN "User" u ON u.id = s."providerId"
        WHERE ${whereSql}
      ),
      rated AS (
        SELECT f.id,
          COALESCE(AVG(r.rating), 0)::float AS avg_rating,
          COUNT(r.id)::int AS review_count,
          f."createdAt"
        FROM filtered f
        LEFT JOIN "Review" r ON r."targetId" = f."providerId"
        GROUP BY f.id, f."createdAt"
      )
      SELECT id FROM rated
      ORDER BY avg_rating DESC, review_count DESC, "createdAt" DESC
      LIMIT ${params.limit} OFFSET ${skip}
    `,
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "Service" s
      INNER JOIN "User" u ON u.id = s."providerId"
      WHERE ${whereSql}
    `,
  ]);

  return {
    ids: rows.map((r) => r.id),
    total: Number(countRow[0]?.count ?? 0),
  };
}

function requestRatingWhereSql(
  params: Pick<
    ParsedListSearch,
    "search" | "category" | "location" | "minPrice" | "maxPrice"
  >
): Prisma.Sql {
  const clauses: Prisma.Sql[] = [Prisma.sql`sr.open = true`];

  if (params.category) {
    const where = buildRequestWhere({ ...params, search: "", location: "" });
    const cat = (where as { category?: unknown }).category;
    if (cat && typeof cat === "object" && cat !== null && "in" in cat) {
      const values = (cat as { in: string[] }).in;
      clauses.push(
        Prisma.sql`sr.category IN (${Prisma.join(values.map((v) => Prisma.sql`${v}`))})`
      );
    } else if (params.category) {
      clauses.push(Prisma.sql`sr.category = ${params.category}`);
    }
  }

  if (params.location) {
    clauses.push(Prisma.sql`sr.location ILIKE ${`%${params.location}%`}`);
  }

  if (params.minPrice != null) {
    clauses.push(Prisma.sql`sr.budget >= ${params.minPrice}`);
  }
  if (params.maxPrice != null) {
    clauses.push(Prisma.sql`sr.budget <= ${params.maxPrice}`);
  }

  if (params.search) {
    const term = `%${params.search}%`;
    clauses.push(Prisma.sql`(
      sr.title ILIKE ${term}
      OR sr.description ILIKE ${term}
      OR sr.category ILIKE ${term}
      OR sr.location ILIKE ${term}
      OR u.name ILIKE ${term}
    )`);
  }

  return Prisma.join(clauses, " AND ");
}

export async function findRequestIdsByClientRating(
  params: ParsedListSearch
): Promise<RatingSortIds> {
  const whereSql = requestRatingWhereSql(params);
  const skip = (params.page - 1) * params.limit;

  const [rows, countRow] = await Promise.all([
    prisma.$queryRaw<{ id: string }[]>`
      WITH filtered AS (
        SELECT sr.id, sr."clientId", sr."createdAt"
        FROM "ServiceRequest" sr
        INNER JOIN "User" u ON u.id = sr."clientId"
        WHERE ${whereSql}
      ),
      rated AS (
        SELECT f.id,
          COALESCE(AVG(r.rating), 0)::float AS avg_rating,
          COUNT(r.id)::int AS review_count,
          f."createdAt"
        FROM filtered f
        LEFT JOIN "Review" r ON r."targetId" = f."clientId"
        GROUP BY f.id, f."createdAt"
      )
      SELECT id FROM rated
      ORDER BY avg_rating DESC, review_count DESC, "createdAt" DESC
      LIMIT ${params.limit} OFFSET ${skip}
    `,
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "ServiceRequest" sr
      INNER JOIN "User" u ON u.id = sr."clientId"
      WHERE ${whereSql}
    `,
  ]);

  return {
    ids: rows.map((r) => r.id),
    total: Number(countRow[0]?.count ?? 0),
  };
}

/** Provider review aggregates for serialization (replaces loading all ratings). */
export async function getProviderRatingMap(providerIds: string[]) {
  if (providerIds.length === 0) return new Map<string, { averageRating: number | null; reviewCount: number }>();

  const rows = await prisma.review.groupBy({
    by: ["targetId"],
    where: { targetId: { in: providerIds } },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return new Map(
    rows.map((r) => [
      r.targetId,
      {
        averageRating:
          r._avg.rating != null
            ? Math.round(r._avg.rating * 10) / 10
            : null,
        reviewCount: r._count.rating,
      },
    ])
  );
}
