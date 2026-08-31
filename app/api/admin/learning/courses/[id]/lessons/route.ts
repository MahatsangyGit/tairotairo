import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withApiHandler, throwNotFound } from "@/lib/api-handler";
import {
  createLessonSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";
import { AppError, isPrismaKnownError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(
  "POST /api/admin/learning/courses/[id]/lessons",
  async (req, { params }) => {
    await requireAdmin(req);
    const { id: courseId } = await params;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throwNotFound("Formation introuvable");

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;
    const parsed = parseBody(createLessonSchema, json.body);
    if (!parsed.ok) return parsed.response;

    try {
      const lesson = await prisma.courseLesson.create({
        data: {
          courseId,
          title: parsed.data.title,
          description: parsed.data.description ?? null,
          position: parsed.data.position,
          durationSec: parsed.data.durationSec ?? null,
        },
      });
      return NextResponse.json(
        {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          position: lesson.position,
          durationSec: lesson.durationSec,
          hasVideo: false,
          viewCount: 0,
        },
        { status: 201 }
      );
    } catch (error) {
      if (isPrismaKnownError(error) && error.code === "P2002") {
        throw new AppError("Position de leçon déjà utilisée", 409);
      }
      throw error;
    }
  }
);
