import prisma from "@/lib/prisma";
import { withApiHandler } from "@/lib/api-handler";
import { serializeCourse } from "@/lib/learning/access";
import { jsonWithPublicCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export const GET = withApiHandler("GET /api/learning/courses", async (req) => {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10) || 12)
  );

  const where = {
    status: "PUBLISHED" as const,
    ...(category
      ? {
          category: category as
            | "DIY"
            | "HANDYWORK"
            | "ELECTRICAL"
            | "PLUMBING"
            | "PAINTING"
            | "SAFETY"
            | "OTHER",
        }
      : {}),
  };

  const [total, courses] = await Promise.all([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { lessons: true } } },
    }),
  ]);

  return jsonWithPublicCache({
    courses: courses.map(serializeCourse),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});
