import prisma from "@/lib/prisma";

export async function loadLearningAdminStats(last30: Date) {
  const [videoViewsTotal, videoViewsLast30] = await Promise.all([
    prisma.lessonVideoView.count(),
    prisma.lessonVideoView.count({ where: { createdAt: { gte: last30 } } }),
  ]);

  return {
    learning: {
      videoViewsTotal,
      videoViewsLast30,
    },
  };
}
