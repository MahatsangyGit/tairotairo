"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetchJson } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  COURSE_CATEGORIES,
  COURSE_CATEGORY_LABELS,
} from "@/lib/learning/constants";

type Course = {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  lessonCount: number;
};

type Lesson = {
  id: string;
  title: string;
  position: number;
  hasVideo: boolean;
  viewCount: number;
};

export default function AdminLearningPanel() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] =
    useState<(typeof COURSE_CATEGORIES)[number]>("DIY");
  const [lessonTitle, setLessonTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetchJson<{ courses: Course[] }>(
        "/api/admin/learning/courses"
      );
      setCourses(data.courses);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }, []);

  useEffect(() => {
    // Fetch on mount / dependency change
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client data load
    void load();
  }, [load]);

  async function loadCourse(id: string) {
    setSelectedId(id);
    const data = await apiFetchJson<{ lessons: Lesson[] }>(
      `/api/admin/learning/courses/${id}`
    );
    setLessons(data.lessons);
  }

  async function createCourse(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetchJson("/api/admin/learning/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, description, category }),
      });
      setTitle("");
      setSlug("");
      setDescription("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function publish(id: string) {
    await apiFetchJson(`/api/admin/learning/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PUBLISHED" }),
    });
    await load();
  }

  async function addLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    const position = lessons.length;
    const lesson = await apiFetchJson<Lesson>(
      `/api/admin/learning/courses/${selectedId}/lessons`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: lessonTitle, position }),
      }
    );
    setLessonTitle("");
    setLessons((prev) => [...prev, lesson]);
  }

  async function uploadVideo(lessonId: string, file: File) {
    const form = new FormData();
    form.append("file", file);
    await apiFetchJson(`/api/admin/learning/lessons/${lessonId}/video`, {
      method: "POST",
      body: form,
    });
    if (selectedId) await loadCourse(selectedId);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-lg font-semibold">
          Formations ampianaro
        </h2>
        {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
        <form onSubmit={createCourse} className="mb-6 space-y-3 rounded-xl border border-border p-4">
          <p className="font-medium">Nouvelle formation</p>
          <input
            required
            placeholder="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="slug-url"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <textarea
            required
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            rows={3}
          />
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as (typeof COURSE_CATEGORIES)[number])
            }
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {COURSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {COURSE_CATEGORY_LABELS[c] ?? c}
              </option>
            ))}
          </select>
          <Button type="submit">Créer (brouillon)</Button>
        </form>

        <ul className="space-y-2">
          {courses.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
            >
              <button
                type="button"
                className="text-left"
                onClick={() => void loadCourse(c.id)}
              >
                <p className="font-medium">{c.title}</p>
                <p className="text-xs text-muted-foreground">
                  {c.status} · {c.lessonCount} leçons · /{c.slug}
                </p>
              </button>
              {c.status !== "PUBLISHED" ? (
                <Button size="sm" onClick={() => void publish(c.id)}>
                  Publier
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      {selectedId ? (
        <div className="rounded-xl border border-border p-4">
          <h3 className="mb-3 font-semibold">Leçons</h3>
          <ul className="mb-4 space-y-2">
            {lessons.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span>
                  {l.position + 1}. {l.title}{" "}
                  {l.hasVideo ? "(vidéo ✓)" : "(sans vidéo)"}
                  {l.hasVideo ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · {l.viewCount.toLocaleString("fr-MG")} vue
                      {l.viewCount === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadVideo(l.id, f);
                  }}
                />
              </li>
            ))}
          </ul>
          <form onSubmit={addLesson} className="flex gap-2">
            <input
              required
              placeholder="Titre de leçon"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <Button type="submit" size="sm">
              Ajouter
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
