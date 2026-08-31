import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withApiHandler, throwNotFound } from "@/lib/api-handler";
import {
  patchLessonSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";
import { AppError, isPrismaKnownError } from "@/lib/errors";
import { deleteCourseLessonVideo } from "@/lib/storage/course-storage";

export const dynamic = "force-dynamic";

export const PATCH = withApiHandler(
  "PATCH /api/admin/learning/lessons/[id]",
  async (req, { params }) => {
    await requireAdmin(req);
    const { id } = await params;
    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;
    const parsed = parseBody(patchLessonSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const existing = await prisma.courseLesson.findUnique({ where: { id } });
    if (!existing) throwNotFound("Leçon introuvable");

    try {
      const lesson = await prisma.courseLesson.update({
        where: { id },
        data: {
          ...(parsed.data.title !== undefined
            ? { title: parsed.data.title }
            : {}),
          ...(parsed.data.description !== undefined
            ? { description: parsed.data.description }
            : {}),
          ...(parsed.data.position !== undefined
            ? { position: parsed.data.position }
            : {}),
          ...(parsed.data.durationSec !== undefined
            ? { durationSec: parsed.data.durationSec }
            : {}),
        },
      });
      return NextResponse.json({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        position: lesson.position,
        durationSec: lesson.durationSec,
        hasVideo: Boolean(lesson.videoKey),
        viewCount: lesson.viewCount,
      });
    } catch (error) {
      if (isPrismaKnownError(error) && error.code === "P2002") {
        throw new AppError("Position de leçon déjà utilisée", 409);
      }
      throw error;
    }
  }
);

export const DELETE = withApiHandler(
  "DELETE /api/admin/learning/lessons/[id]",
  async (req, { params }) => {
    await requireAdmin(req);
    const { id } = await params;
    const existing = await prisma.courseLesson.findUnique({ where: { id } });
    if (!existing) throwNotFound("Leçon introuvable");
    await deleteCourseLessonVideo(existing.videoKey);
    await prisma.courseLesson.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }
);
