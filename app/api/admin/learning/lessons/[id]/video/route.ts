import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withApiHandler, throwNotFound } from "@/lib/api-handler";
import { API_RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import {
  deleteCourseLessonVideo,
  saveCourseLessonVideo,
  validateCourseVideoMeta,
} from "@/lib/storage/course-storage";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(
  "POST /api/admin/learning/lessons/[id]/video",
  async (req, { params }) => {
    const admin = await requireAdmin(req);
    const limited = await enforceRateLimit(
      req,
      "upload:course-video",
      API_RATE_LIMITS.upload,
      { userId: admin.userId }
    );
    if (limited) return limited;

    const { id } = await params;
    const lesson = await prisma.courseLesson.findUnique({
      where: { id },
      select: { id: true, courseId: true, videoKey: true },
    });
    if (!lesson) throwNotFound("Leçon introuvable");

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new AppError("Fichier vidéo manquant", 400);
    }

    const validated = validateCourseVideoMeta(file.type, file.size);
    if (!validated.ok) {
      throw new AppError(validated.error, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await deleteCourseLessonVideo(lesson.videoKey);
    const saved = await saveCourseLessonVideo(
      lesson.courseId,
      lesson.id,
      buffer,
      validated.mime
    );

    const updated = await prisma.courseLesson.update({
      where: { id },
      data: {
        videoKey: saved.key,
        videoMime: saved.mime,
      },
    });

    return NextResponse.json({
      id: updated.id,
      hasVideo: true,
      sizeBytes: saved.sizeBytes,
    });
  }
);
