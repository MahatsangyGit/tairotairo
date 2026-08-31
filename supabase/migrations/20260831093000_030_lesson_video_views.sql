-- Comptage des vues vidéo Ampianaro + historique pour le rapport admin.

ALTER TABLE "CourseLesson"
  ADD COLUMN IF NOT EXISTS "viewCount" integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "LessonVideoView" (
  id          text        NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "userId"    text        NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "lessonId"  text        NOT NULL REFERENCES "CourseLesson"(id) ON DELETE CASCADE,
  "courseId"  text        NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
  CONSTRAINT "LessonVideoView_pkey" PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS "LessonVideoView_lessonId_createdAt_idx"
  ON "LessonVideoView" ("lessonId", "createdAt");
CREATE INDEX IF NOT EXISTS "LessonVideoView_courseId_createdAt_idx"
  ON "LessonVideoView" ("courseId", "createdAt");
CREATE INDEX IF NOT EXISTS "LessonVideoView_userId_lessonId_createdAt_idx"
  ON "LessonVideoView" ("userId", "lessonId", "createdAt");
CREATE INDEX IF NOT EXISTS "LessonVideoView_createdAt_idx"
  ON "LessonVideoView" ("createdAt");

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tairo_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "LessonVideoView" TO tairo_app;
  END IF;
END $$;

ALTER TABLE "LessonVideoView" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LessonVideoView" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lesson_video_view_select ON "LessonVideoView";
CREATE POLICY lesson_video_view_select ON "LessonVideoView"
  FOR SELECT
  USING (
    app.is_admin()
    OR app.bypass_rls()
    OR "userId" = app.current_user_id()
  );

DROP POLICY IF EXISTS lesson_video_view_insert ON "LessonVideoView";
CREATE POLICY lesson_video_view_insert ON "LessonVideoView"
  FOR INSERT
  WITH CHECK (
    app.is_admin()
    OR app.bypass_rls()
    OR "userId" = app.current_user_id()
  );

DROP POLICY IF EXISTS lesson_video_view_update ON "LessonVideoView";
CREATE POLICY lesson_video_view_update ON "LessonVideoView"
  FOR UPDATE
  USING (app.is_admin() OR app.bypass_rls())
  WITH CHECK (app.is_admin() OR app.bypass_rls());

DROP POLICY IF EXISTS lesson_video_view_delete ON "LessonVideoView";
CREATE POLICY lesson_video_view_delete ON "LessonVideoView"
  FOR DELETE
  USING (app.is_admin() OR app.bypass_rls());
