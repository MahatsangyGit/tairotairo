"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetchJson } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import CourseVideoPlayer from "@/components/learning/CourseVideoPlayer";

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  durationSec: number | null;
  hasVideo: boolean;
  viewCount: number;
};

type CourseDetail = {
  id: string;
  title: string;
  description: string;
  categoryLabel: string;
  canWatch: boolean;
  lessons: Lesson[];
  enrollment: {
    lastLessonId: string | null;
    completedLessonIds: string[];
  } | null;
};

export default function CoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetchJson<CourseDetail>(
        `/api/learning/courses/${slug}`
      );
      setCourse(data);
      const resume =
        data.enrollment?.lastLessonId ||
        data.lessons.find((l) => l.hasVideo)?.id ||
        data.lessons[0]?.id ||
        null;
      setActiveLessonId(resume);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }, [slug]);

  useEffect(() => {
    // Fetch on mount / dependency change
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client data load
    void load();
  }, [load]);

  async function markComplete(lessonId: string) {
    try {
      await apiFetchJson("/api/learning/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, completed: true }),
      });
      await load();
    } catch {
      // ignore — progress is best-effort
    }
  }

  if (!course && !error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 text-muted-foreground">
        Chargement…
      </div>
    );
  }
  if (!course) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 text-destructive">
        {error}
      </div>
    );
  }

  const active = course.lessons.find((l) => l.id === activeLessonId);
  const completed = new Set(course.enrollment?.completedLessonIds ?? []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="mb-1 text-sm text-muted-foreground">{course.categoryLabel}</p>
      <h1 className="mb-4 text-3xl font-bold">{course.title}</h1>
      <p className="mb-8 whitespace-pre-wrap text-muted-foreground">
        {course.description}
      </p>

      {!course.canWatch ? (
        <div className="mb-8 rounded-xl border border-brand-500/40 bg-brand-50 p-4 dark:bg-brand-950/30">
          <p className="mb-2 font-medium">
            Connectez-vous pour regarder les vidéos
          </p>
          <p className="mb-3 text-sm text-muted-foreground">
            Le catalogue est public. Les leçons vidéo sont accessibles avec un
            compte client ou prestataire.
          </p>
          <Button asChild>
            <a href={`/auth/login?callbackUrl=/ampianaro/cours/${slug}`}>
              Se connecter
            </a>
          </Button>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          {course.canWatch && active?.hasVideo ? (
            <div className="mb-4 overflow-hidden rounded-xl border border-border bg-black">
              <CourseVideoPlayer
                lessonId={active.id}
                src={`/api/learning/lessons/${active.id}/video`}
                onEnded={() => void markComplete(active.id)}
                onViewCounted={(viewCount) => {
                  setCourse((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      lessons: prev.lessons.map((l) =>
                        l.id === active.id ? { ...l, viewCount } : l
                      ),
                    };
                  });
                }}
              />
            </div>
          ) : course.canWatch ? (
            <div className="mb-4 flex aspect-video items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
              Aucune vidéo pour cette leçon
            </div>
          ) : null}

          {active ? (
            <div>
              <h2 className="mb-2 text-xl font-semibold">{active.title}</h2>
              {active.description ? (
                <p className="text-muted-foreground">{active.description}</p>
              ) : null}
              {active.hasVideo ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {(active.viewCount ?? 0).toLocaleString("fr-MG")} vue
                  {(active.viewCount ?? 0) === 1 ? "" : "s"}
                </p>
              ) : null}
              {course.canWatch && active.hasVideo ? (
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => void markComplete(active.id)}
                >
                  Marquer comme terminée
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        <aside className="rounded-xl border border-border p-3">
          <h3 className="mb-3 px-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Leçons
          </h3>
          <ul className="space-y-1">
            {course.lessons.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => setActiveLessonId(l.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    l.id === activeLessonId
                      ? "bg-brand-100 text-brand-900 dark:bg-brand-900/40 dark:text-brand-100"
                      : "hover:bg-muted"
                  }`}
                >
                  <span className="font-medium">
                    {completed.has(l.id) ? "✓ " : ""}
                    {l.position + 1}. {l.title}
                  </span>
                  {l.hasVideo ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {(l.viewCount ?? 0).toLocaleString("fr-MG")} vue
                      {(l.viewCount ?? 0) === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          <Link
            href="/ampianaro"
            className="mt-4 block px-2 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Toutes les formations
          </Link>
        </aside>
      </div>
    </div>
  );
}
