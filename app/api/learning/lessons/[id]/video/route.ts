import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthOrThrow } from "@/lib/auth";
import {
  withApiHandler,
  throwForbidden,
  throwNotFound,
} from "@/lib/api-handler";
import { hasLearningVideoAccess } from "@/lib/learning/access";
import { openCourseVideoStream } from "@/lib/storage/course-storage";
import { Readable } from "stream";

export const dynamic = "force-dynamic";

function parseRange(
  header: string | null,
  size: number
): { start: number; end: number } | null {
  if (!header || !header.startsWith("bytes=")) return null;
  const part = header.slice("bytes=".length).split(",")[0]?.trim();
  if (!part) return null;
  const [startStr, endStr] = part.split("-");
  const start = startStr ? parseInt(startStr, 10) : 0;
  const end = endStr ? parseInt(endStr, 10) : size - 1;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
    return null;
  }
  return {
    start: Math.max(0, start),
    end: Math.min(size - 1, end),
  };
}

export const GET = withApiHandler(
  "GET /api/learning/lessons/[id]/video",
  async (req, { params }) => {
    const user = await requireAuthOrThrow(req);
    const canWatch = await hasLearningVideoAccess(user.userId, user.role);
    if (!canWatch) {
      throwForbidden(
        "Réservé aux prestataires avec un abonnement Tairo ampio actif"
      );
    }

    const { id } = await params;
    const lesson = await prisma.courseLesson.findUnique({
      where: { id },
      select: {
        id: true,
        videoKey: true,
        videoMime: true,
        course: { select: { id: true, status: true } },
      },
    });
    if (!lesson?.videoKey || lesson.course.status !== "PUBLISHED") {
      throwNotFound("Vidéo introuvable");
    }

    const rangeHeader = req.headers.get("range");
    const opened = await openCourseVideoStream(lesson.videoKey);
    if (!opened) throwNotFound("Vidéo introuvable");

    const size = opened.size;
    const range = parseRange(rangeHeader, size);
    const mime = lesson.videoMime || "video/mp4";

    if (range) {
      const chunk = await openCourseVideoStream(lesson.videoKey, range);
      if (!chunk) throwNotFound("Vidéo introuvable");

      const headers = {
        "Content-Type": mime,
        "Content-Length": String(range.end - range.start + 1),
        "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=3600",
      };

      if (chunk.kind === "local") {
        return new NextResponse(Readable.toWeb(chunk.stream) as ReadableStream, {
          status: 206,
          headers,
        });
      }
      return new NextResponse(new Uint8Array(chunk.buffer), {
        status: 206,
        headers,
      });
    }

    const headers = {
      "Content-Type": mime,
      "Content-Length": String(size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
    };

    if (opened.kind === "local") {
      return new NextResponse(Readable.toWeb(opened.stream) as ReadableStream, {
        status: 200,
        headers,
      });
    }
    return new NextResponse(new Uint8Array(opened.buffer), {
      status: 200,
      headers,
    });
  }
);
