import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import {
  withApiHandler,
  throwForbidden,
  throwNotFound,
} from "@/lib/api-handler";
import {
  lessonProgressSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";
import { hasLearningVideoAccess } from "@/lib/learning/access";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(
  "POST /api/learning/progress",
  async (req) => {
    const user = await requireAuthOrThrow(req);
    const canWatch = await hasLearningVideoAccess(user.userId, user.role);
    if (!canWatch) {
      throwForbidden(
        "Réservé aux prestataires avec un abonnement Tairo ampio actif"
      );
    }

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;
    const parsed = parseBody(lessonProgressSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const lesson = await prisma.courseLesson.findUnique({
      where: { id: parsed.data.lessonId },
      select: {
        id: true,
        courseId: true,
        course: { select: { status: true } },
      },
    });
    if (!lesson || lesson.course.status !== "PUBLISHED") {
      throwNotFound("Leçon introuvable");
    }

    const completed = parsed.data.completed !== false;

    await prisma.$transaction(async (tx) => {
      await tx.courseEnrollment.upsert({
        where: {
          userId_courseId: {
            userId: user.userId,
            courseId: lesson.courseId,
          },
        },
        create: {
          userId: user.userId,
          courseId: lesson.courseId,
          lastLessonId: lesson.id,
        },
        update: { lastLessonId: lesson.id },
      });

      await tx.lessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId: user.userId,
            lessonId: lesson.id,
          },
        },
        create: {
          userId: user.userId,
          lessonId: lesson.id,
          completedAt: completed ? new Date() : null,
        },
        update: {
          completedAt: completed ? new Date() : null,
        },
      });
    });

    return NextResponse.json({ ok: true });
  }
);
