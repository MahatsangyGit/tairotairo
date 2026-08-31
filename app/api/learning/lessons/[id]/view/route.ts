import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import {
  withApiHandler,
  throwForbidden,
  throwNotFound,
} from "@/lib/api-handler";
import { hasLearningVideoAccess } from "@/lib/learning/access";
import { recordQualifiedLessonView } from "@/lib/learning/record-view";
import { API_RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(
  "POST /api/learning/lessons/[id]/view",
  async (req, { params }) => {
    const user = await requireAuthOrThrow(req);
    const limited = await enforceRateLimit(
      req,
      "lesson-view",
      API_RATE_LIMITS.lessonView,
      { userId: user.userId }
    );
    if (limited) return limited;

    const canWatch = await hasLearningVideoAccess(user.userId, user.role);
    if (!canWatch) {
      throwForbidden(
        "Connectez-vous avec un compte client ou prestataire pour regarder les vidéos"
      );
    }

    const { id } = await params;
    const lesson = await prisma.courseLesson.findUnique({
      where: { id },
      select: {
        id: true,
        videoKey: true,
        courseId: true,
        course: { select: { status: true } },
      },
    });
    if (!lesson?.videoKey || lesson.course.status !== "PUBLISHED") {
      throwNotFound("Vidéo introuvable");
    }

    const result = await recordQualifiedLessonView({
      userId: user.userId,
      lessonId: lesson.id,
      courseId: lesson.courseId,
    });

    return NextResponse.json(result);
  }
);
