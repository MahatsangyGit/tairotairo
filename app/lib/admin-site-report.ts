import prisma from "@/lib/prisma";
import { fillDailySeries } from "@/lib/learning/views";
import { COURSE_CATEGORY_LABELS } from "@/lib/learning/constants";

type DayCountRow = { day: Date; count: bigint | number };

function toNumber(value: bigint | number): number {
  return typeof value === "bigint" ? Number(value) : value;
}

async function dailyCounts(
  table: "LessonVideoView" | "Booking" | "User",
  from: Date
): Promise<DayCountRow[]> {
  if (table === "LessonVideoView") {
    return prisma.$queryRaw<DayCountRow[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
      FROM "LessonVideoView"
      WHERE "createdAt" >= ${from}
      GROUP BY 1
      ORDER BY 1
    `;
  }
  if (table === "Booking") {
    return prisma.$queryRaw<DayCountRow[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
      FROM "Booking"
      WHERE "createdAt" >= ${from}
      GROUP BY 1
      ORDER BY 1
    `;
  }
  return prisma.$queryRaw<DayCountRow[]>`
    SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
    FROM "User"
    WHERE "createdAt" >= ${from}
    GROUP BY 1
    ORDER BY 1
  `;
}

export async function getAdminSiteReport() {
  const now = new Date();
  const from = new Date(now);
  from.setUTCDate(from.getUTCDate() - 29);
  from.setUTCHours(0, 0, 0, 0);

  const [
    videoViewsTotal,
    uniqueViewers,
    viewsLast30,
    enrollments,
    lessonsWithVideo,
    completions,
    coursesPublished,
    [viewsByDay, uniqueByDay, bookingsByDay, usersByDay],
    topLessons,
    courses,
  ] = await Promise.all([
    prisma.lessonVideoView.count(),
    prisma.$queryRaw<[{ count: number }]>`
      SELECT COUNT(DISTINCT "userId")::int AS count FROM "LessonVideoView"
    `.then((rows) => Number(rows[0]?.count ?? 0)),
    prisma.lessonVideoView.count({ where: { createdAt: { gte: from } } }),
    prisma.courseEnrollment.count(),
    prisma.courseLesson.count({ where: { videoKey: { not: null } } }),
    prisma.lessonProgress.count({ where: { completedAt: { not: null } } }),
    prisma.course.count({ where: { status: "PUBLISHED" } }),
    Promise.all([
      dailyCounts("LessonVideoView", from),
      prisma.$queryRaw<DayCountRow[]>`
        SELECT date_trunc('day', "createdAt") AS day,
               COUNT(DISTINCT "userId")::int AS count
        FROM "LessonVideoView"
        WHERE "createdAt" >= ${from}
        GROUP BY 1
        ORDER BY 1
      `,
      dailyCounts("Booking", from),
      dailyCounts("User", from),
    ]),
    prisma.courseLesson.findMany({
      where: { viewCount: { gt: 0 } },
      orderBy: { viewCount: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        viewCount: true,
        course: { select: { title: true, slug: true, category: true } },
      },
    }),
    prisma.course.findMany({
      where: { status: { in: ["PUBLISHED", "DRAFT"] } },
      select: {
        id: true,
        title: true,
        category: true,
        lessons: { select: { viewCount: true } },
      },
    }),
  ]);

  const viewsByCourse = courses
    .map((c) => ({
      id: c.id,
      title: c.title,
      category:
        COURSE_CATEGORY_LABELS[
          c.category as keyof typeof COURSE_CATEGORY_LABELS
        ] ?? c.category,
      views: c.lessons.reduce((sum, l) => sum + l.viewCount, 0),
    }))
    .filter((c) => c.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  const viewsSeries = fillDailySeries(
    from,
    now,
    viewsByDay.map((r) => ({ day: r.day, count: toNumber(r.count) }))
  );
  const uniqueSeries = fillDailySeries(
    from,
    now,
    uniqueByDay.map((r) => ({ day: r.day, count: toNumber(r.count) }))
  );
  const bookingsSeries = fillDailySeries(
    from,
    now,
    bookingsByDay.map((r) => ({ day: r.day, count: toNumber(r.count) }))
  );
  const usersSeries = fillDailySeries(
    from,
    now,
    usersByDay.map((r) => ({ day: r.day, count: toNumber(r.count) }))
  );

  return {
    generatedAt: now.toISOString(),
    rangeDays: 30,
    kpis: {
      videoViewsTotal,
      uniqueViewers,
      viewsLast30,
      enrollments,
      lessonsWithVideo,
      completions,
      coursesPublished,
    },
    charts: {
      labels: viewsSeries.labels,
      views: viewsSeries.values,
      uniqueViewers: uniqueSeries.values,
      bookings: bookingsSeries.values,
      newUsers: usersSeries.values,
      topLessons: topLessons.map((l) => ({
        id: l.id,
        title: l.title,
        courseTitle: l.course.title,
        views: l.viewCount,
      })),
      viewsByCourse,
    },
  };
}

export type AdminSiteReport = Awaited<ReturnType<typeof getAdminSiteReport>>;
