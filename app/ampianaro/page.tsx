import Link from "next/link";
import prisma from "@/lib/prisma";
import { serializeCourse } from "@/lib/learning/access";
import {
  COURSE_CATEGORIES,
  COURSE_CATEGORY_LABELS,
} from "@/lib/learning/constants";
import AmpianaroFilters from "@/ampianaro/AmpianaroFilters";

export const dynamic = "force-dynamic";

export default async function AmpianaroHomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category = params.category?.trim();

  const where = {
    status: "PUBLISHED" as const,
    ...(category
      ? {
          category: category as
            | "DIY"
            | "HANDYWORK"
            | "ELECTRICAL"
            | "PLUMBING"
            | "PAINTING"
            | "SAFETY"
            | "OTHER",
        }
      : {}),
  };

  const courses = await prisma.course.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 48,
    include: { _count: { select: { lessons: true } } },
  });
  const serialized = courses.map(serializeCourse);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-10 max-w-2xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
          Formations en ligne
        </p>
        <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
          Apprenez le DIY, le bricolage, l&apos;électricité
        </h1>
        <p className="text-muted-foreground">
          Catalogue de vidéos d&apos;apprentissage gratuit pour les utilisateurs
          de Tairo Ampio.
        </p>
      </div>

      <AmpianaroFilters
        initialCategory={category ?? ""}
        categories={COURSE_CATEGORIES.map((c) => ({
          value: c,
          label: COURSE_CATEGORY_LABELS[c] ?? c,
        }))}
      />

      {serialized.length === 0 ? (
        <p className="text-muted-foreground">Aucune formation publiée.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {serialized.map((c) => (
            <li key={c.id}>
              <Link
                href={`/ampianaro/cours/${c.slug}`}
                className="block rounded-xl border border-border p-5 transition hover:border-brand-500"
              >
                <p className="mb-1 text-xs text-muted-foreground">
                  {c.categoryLabel} · {c.lessonCount} leçon
                  {c.lessonCount > 1 ? "s" : ""}
                </p>
                <h2 className="mb-2 font-semibold">{c.title}</h2>
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {c.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
