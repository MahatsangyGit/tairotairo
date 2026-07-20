import prisma from "@/lib/prisma";
import { isSubscriptionActive } from "@/lib/subscription";
import { withBypassRls } from "@/lib/rls";
import { COURSE_CATEGORY_LABELS } from "@/lib/learning/constants";

/**
 * Lecture vidéo réservée aux prestataires avec abonnement Tairo ampio actif,
 * ou aux admins.
 */
export async function hasLearningVideoAccess(
  userId: string,
  role?: string
): Promise<boolean> {
  if (role === "ADMIN") return true;

  return withBypassRls(async () => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        providerSubscription: { select: { expiresAt: true } },
      },
    });
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    if (user.role !== "PROVIDER") return false;
    return isSubscriptionActive(user.providerSubscription?.expiresAt);
  });
}

export function slugifyCourseTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function serializeCourse(course: {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  coverKey: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  lessons?: {
    id: string;
    title: string;
    position: number;
    durationSec: number | null;
    videoKey: string | null;
  }[];
  _count?: { lessons: number };
}) {
  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    category: course.category,
    categoryLabel:
      COURSE_CATEGORY_LABELS[
        course.category as keyof typeof COURSE_CATEGORY_LABELS
      ] ?? course.category,
    status: course.status,
    coverUrl: course.coverKey
      ? `/api/learning/courses/${course.id}/cover`
      : null,
    lessonCount: course._count?.lessons ?? course.lessons?.length ?? 0,
    lessons: course.lessons?.map((l) => ({
      id: l.id,
      title: l.title,
      position: l.position,
      durationSec: l.durationSec,
      hasVideo: Boolean(l.videoKey),
    })),
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
  };
}
