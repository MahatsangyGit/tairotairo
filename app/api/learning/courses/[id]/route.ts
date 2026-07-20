import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { withApiHandler, throwNotFound } from "@/lib/api-handler";
import {
  hasLearningVideoAccess,
  serializeCourse,
} from "@/lib/learning/access";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  "GET /api/learning/courses/[id]",
  async (req, { params }) => {
    const { id } = await params;
    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        status: "PUBLISHED",
      },
      include: {
        lessons: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            position: true,
            durationSec: true,
            videoKey: true,
          },
        },
      },
    });
    if (!course) throwNotFound("Formation introuvable");

    let canWatch = false;
    let enrollment: {
      lastLessonId: string | null;
      completedLessonIds: string[];
    } | null = null;

    const user = await getAuthUser(req);
    if (user) {
      canWatch = await hasLearningVideoAccess(user.userId, user.role);
      if (canWatch) {
        const [enroll, progress] = await Promise.all([
          prisma.courseEnrollment.findUnique({
            where: {
              userId_courseId: {
                userId: user.userId,
                courseId: course.id,
              },
            },
          }),
          prisma.lessonProgress.findMany({
            where: {
              userId: user.userId,
              lessonId: { in: course.lessons.map((l) => l.id) },
              completedAt: { not: null },
            },
            select: { lessonId: true },
          }),
        ]);
        enrollment = {
          lastLessonId: enroll?.lastLessonId ?? null,
          completedLessonIds: progress.map((p) => p.lessonId),
        };
      }
    }

    return NextResponse.json({
      ...serializeCourse(course),
      canWatch,
      enrollment,
      lessons: course.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        position: l.position,
        durationSec: l.durationSec,
        hasVideo: Boolean(l.videoKey),
      })),
    });
  }
);
