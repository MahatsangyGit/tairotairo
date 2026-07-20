import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withApiHandler } from "@/lib/api-handler";
import {
  createCourseSchema,
  parseBody,
  parseJsonBody,
} from "@/lib/api-schemas";
import { serializeCourse } from "@/lib/learning/access";
import { AppError, isPrismaKnownError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  "GET /api/admin/learning/courses",
  async (req) => {
    await requireAdmin(req);
    const courses = await prisma.course.findMany({
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: { _count: { select: { lessons: true } } },
    });
    return NextResponse.json({ courses: courses.map(serializeCourse) });
  }
);

export const POST = withApiHandler(
  "POST /api/admin/learning/courses",
  async (req) => {
    const admin = await requireAdmin(req);
    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;
    const parsed = parseBody(createCourseSchema, json.body);
    if (!parsed.ok) return parsed.response;

    try {
      const course = await prisma.course.create({
        data: {
          title: parsed.data.title,
          slug: parsed.data.slug,
          description: parsed.data.description,
          category: parsed.data.category,
          createdById: admin.userId,
          status: "DRAFT",
        },
        include: { _count: { select: { lessons: true } } },
      });
      return NextResponse.json(serializeCourse(course), { status: 201 });
    } catch (error) {
      if (isPrismaKnownError(error) && error.code === "P2002") {
        throw new AppError("Ce slug est déjà utilisé", 409);
      }
      throw error;
    }
  }
);
