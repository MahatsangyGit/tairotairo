import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withApiHandler, throwNotFound } from "@/lib/api-handler";
import {
  patchCourseSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";
import { serializeCourse } from "@/lib/learning/access";
import { AppError, isPrismaKnownError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  "GET /api/admin/learning/courses/[id]",
  async (req, { params }) => {
    await requireAdmin(req);
    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        lessons: { orderBy: { position: "asc" } },
        _count: { select: { lessons: true } },
      },
    });
    if (!course) throwNotFound("Formation introuvable");
    return NextResponse.json({
      ...serializeCourse(course),
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

export const PATCH = withApiHandler(
  "PATCH /api/admin/learning/courses/[id]",
  async (req, { params }) => {
    await requireAdmin(req);
    const { id } = await params;
    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;
    const parsed = parseBody(patchCourseSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) throwNotFound("Formation introuvable");

    try {
      const course = await prisma.course.update({
        where: { id },
        data: {
          ...(parsed.data.title !== undefined
            ? { title: parsed.data.title }
            : {}),
          ...(parsed.data.slug !== undefined ? { slug: parsed.data.slug } : {}),
          ...(parsed.data.description !== undefined
            ? { description: parsed.data.description }
            : {}),
          ...(parsed.data.category !== undefined
            ? { category: parsed.data.category }
            : {}),
          ...(parsed.data.status !== undefined
            ? { status: parsed.data.status }
            : {}),
        },
        include: { _count: { select: { lessons: true } } },
      });
      return NextResponse.json(serializeCourse(course));
    } catch (error) {
      if (isPrismaKnownError(error) && error.code === "P2002") {
        throw new AppError("Ce slug est déjà utilisé", 409);
      }
      throw error;
    }
  }
);
