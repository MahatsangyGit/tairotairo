import prisma from "@/lib/prisma";
import { withBypassRls } from "@/lib/rls";
import {
  LESSON_VIEW_COOLDOWN_MS,
  shouldCountLessonView,
} from "@/lib/learning/views";

export type RecordLessonViewResult = {
  counted: boolean;
  viewCount: number;
};

export async function recordQualifiedLessonView(input: {
  userId: string;
  lessonId: string;
  courseId: string;
}): Promise<RecordLessonViewResult> {
  return withBypassRls(async () => {
    const [lesson, last] = await Promise.all([
      prisma.courseLesson.findUnique({
        where: { id: input.lessonId },
        select: { id: true, viewCount: true },
      }),
      prisma.lessonVideoView.findFirst({
        where: { userId: input.userId, lessonId: input.lessonId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const currentCount = lesson?.viewCount ?? 0;
    if (!shouldCountLessonView(last?.createdAt)) {
      return { counted: false, viewCount: currentCount };
    }

    const [, updated] = await prisma.$transaction([
      prisma.lessonVideoView.create({
        data: {
          userId: input.userId,
          lessonId: input.lessonId,
          courseId: input.courseId,
        },
      }),
      prisma.courseLesson.update({
        where: { id: input.lessonId },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      }),
    ]);

    return { counted: true, viewCount: updated.viewCount };
  });
}

export { LESSON_VIEW_COOLDOWN_MS };
