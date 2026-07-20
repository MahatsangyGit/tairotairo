/*
# RLS — ampindramo (rental) + ampianaro (learning)
*/

-- Helper: participant d'une location
CREATE OR REPLACE FUNCTION app.is_rental_participant(rental_booking_id text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "RentalBooking" rb
    WHERE rb.id = rental_booking_id
      AND (
        rb."renterId" = app.current_user_id()
        OR rb."ownerId" = app.current_user_id()
      )
  );
$$;

GRANT EXECUTE ON FUNCTION app.is_rental_participant(text) TO tairo_app;

-- ── EquipmentItem ────────────────────────────────────────────────────────────

ALTER TABLE "EquipmentItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EquipmentItem" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS equipment_select ON "EquipmentItem";
CREATE POLICY equipment_select ON "EquipmentItem"
  FOR SELECT
  USING (
    app.is_admin()
    OR app.bypass_rls()
    OR status = 'PUBLISHED'
    OR "ownerId" = app.current_user_id()
  );

DROP POLICY IF EXISTS equipment_insert ON "EquipmentItem";
CREATE POLICY equipment_insert ON "EquipmentItem"
  FOR INSERT
  WITH CHECK (
    app.is_admin()
    OR app.bypass_rls()
    OR "ownerId" = app.current_user_id()
  );

DROP POLICY IF EXISTS equipment_update ON "EquipmentItem";
CREATE POLICY equipment_update ON "EquipmentItem"
  FOR UPDATE
  USING (
    app.is_admin()
    OR app.bypass_rls()
    OR "ownerId" = app.current_user_id()
  )
  WITH CHECK (
    app.is_admin()
    OR app.bypass_rls()
    OR "ownerId" = app.current_user_id()
  );

DROP POLICY IF EXISTS equipment_delete ON "EquipmentItem";
CREATE POLICY equipment_delete ON "EquipmentItem"
  FOR DELETE
  USING (
    app.is_admin()
    OR app.bypass_rls()
    OR "ownerId" = app.current_user_id()
  );

-- ── RentalBooking ────────────────────────────────────────────────────────────

ALTER TABLE "RentalBooking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RentalBooking" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rental_booking_select ON "RentalBooking";
CREATE POLICY rental_booking_select ON "RentalBooking"
  FOR SELECT
  USING (
    app.is_admin()
    OR app.bypass_rls()
    OR "renterId" = app.current_user_id()
    OR "ownerId" = app.current_user_id()
  );

DROP POLICY IF EXISTS rental_booking_insert ON "RentalBooking";
CREATE POLICY rental_booking_insert ON "RentalBooking"
  FOR INSERT
  WITH CHECK (
    app.is_admin()
    OR app.bypass_rls()
    OR "renterId" = app.current_user_id()
  );

DROP POLICY IF EXISTS rental_booking_update ON "RentalBooking";
CREATE POLICY rental_booking_update ON "RentalBooking"
  FOR UPDATE
  USING (
    app.is_admin()
    OR app.bypass_rls()
    OR "renterId" = app.current_user_id()
    OR "ownerId" = app.current_user_id()
  )
  WITH CHECK (
    app.is_admin()
    OR app.bypass_rls()
    OR "renterId" = app.current_user_id()
    OR "ownerId" = app.current_user_id()
  );

DROP POLICY IF EXISTS rental_booking_delete ON "RentalBooking";
CREATE POLICY rental_booking_delete ON "RentalBooking"
  FOR DELETE
  USING (app.is_admin() OR app.bypass_rls());

-- ── RentalTransaction ────────────────────────────────────────────────────────

ALTER TABLE "RentalTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RentalTransaction" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rental_tx_select ON "RentalTransaction";
CREATE POLICY rental_tx_select ON "RentalTransaction"
  FOR SELECT
  USING (
    app.is_admin()
    OR app.bypass_rls()
    OR app.is_rental_participant("rentalBookingId")
  );

DROP POLICY IF EXISTS rental_tx_insert ON "RentalTransaction";
CREATE POLICY rental_tx_insert ON "RentalTransaction"
  FOR INSERT
  WITH CHECK (app.bypass_rls() OR app.is_admin());

DROP POLICY IF EXISTS rental_tx_update ON "RentalTransaction";
CREATE POLICY rental_tx_update ON "RentalTransaction"
  FOR UPDATE
  USING (app.bypass_rls() OR app.is_admin())
  WITH CHECK (app.bypass_rls() OR app.is_admin());

DROP POLICY IF EXISTS rental_tx_delete ON "RentalTransaction";
CREATE POLICY rental_tx_delete ON "RentalTransaction"
  FOR DELETE
  USING (app.is_admin());

-- ── RentalPayout ─────────────────────────────────────────────────────────────

ALTER TABLE "RentalPayout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RentalPayout" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rental_payout_select ON "RentalPayout";
CREATE POLICY rental_payout_select ON "RentalPayout"
  FOR SELECT
  USING (
    app.is_admin()
    OR app.bypass_rls()
    OR "ownerId" = app.current_user_id()
  );

DROP POLICY IF EXISTS rental_payout_insert ON "RentalPayout";
CREATE POLICY rental_payout_insert ON "RentalPayout"
  FOR INSERT
  WITH CHECK (app.bypass_rls() OR app.is_admin());

DROP POLICY IF EXISTS rental_payout_update ON "RentalPayout";
CREATE POLICY rental_payout_update ON "RentalPayout"
  FOR UPDATE
  USING (app.bypass_rls() OR app.is_admin())
  WITH CHECK (app.bypass_rls() OR app.is_admin());

DROP POLICY IF EXISTS rental_payout_delete ON "RentalPayout";
CREATE POLICY rental_payout_delete ON "RentalPayout"
  FOR DELETE
  USING (app.is_admin());

-- ── Course ───────────────────────────────────────────────────────────────────

ALTER TABLE "Course" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Course" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS course_select ON "Course";
CREATE POLICY course_select ON "Course"
  FOR SELECT
  USING (
    app.is_admin()
    OR app.bypass_rls()
    OR status = 'PUBLISHED'
  );

DROP POLICY IF EXISTS course_insert ON "Course";
CREATE POLICY course_insert ON "Course"
  FOR INSERT
  WITH CHECK (app.is_admin() OR app.bypass_rls());

DROP POLICY IF EXISTS course_update ON "Course";
CREATE POLICY course_update ON "Course"
  FOR UPDATE
  USING (app.is_admin() OR app.bypass_rls())
  WITH CHECK (app.is_admin() OR app.bypass_rls());

DROP POLICY IF EXISTS course_delete ON "Course";
CREATE POLICY course_delete ON "Course"
  FOR DELETE
  USING (app.is_admin() OR app.bypass_rls());

-- ── CourseLesson ─────────────────────────────────────────────────────────────

ALTER TABLE "CourseLesson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CourseLesson" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS course_lesson_select ON "CourseLesson";
CREATE POLICY course_lesson_select ON "CourseLesson"
  FOR SELECT
  USING (
    app.is_admin()
    OR app.bypass_rls()
    OR EXISTS (
      SELECT 1 FROM "Course" c
      WHERE c.id = "courseId" AND c.status = 'PUBLISHED'
    )
  );

DROP POLICY IF EXISTS course_lesson_insert ON "CourseLesson";
CREATE POLICY course_lesson_insert ON "CourseLesson"
  FOR INSERT
  WITH CHECK (app.is_admin() OR app.bypass_rls());

DROP POLICY IF EXISTS course_lesson_update ON "CourseLesson";
CREATE POLICY course_lesson_update ON "CourseLesson"
  FOR UPDATE
  USING (app.is_admin() OR app.bypass_rls())
  WITH CHECK (app.is_admin() OR app.bypass_rls());

DROP POLICY IF EXISTS course_lesson_delete ON "CourseLesson";
CREATE POLICY course_lesson_delete ON "CourseLesson"
  FOR DELETE
  USING (app.is_admin() OR app.bypass_rls());

-- ── CourseEnrollment ─────────────────────────────────────────────────────────

ALTER TABLE "CourseEnrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CourseEnrollment" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS course_enrollment_select ON "CourseEnrollment";
CREATE POLICY course_enrollment_select ON "CourseEnrollment"
  FOR SELECT
  USING (
    app.is_admin()
    OR app.bypass_rls()
    OR "userId" = app.current_user_id()
  );

DROP POLICY IF EXISTS course_enrollment_insert ON "CourseEnrollment";
CREATE POLICY course_enrollment_insert ON "CourseEnrollment"
  FOR INSERT
  WITH CHECK (
    app.is_admin()
    OR app.bypass_rls()
    OR "userId" = app.current_user_id()
  );

DROP POLICY IF EXISTS course_enrollment_update ON "CourseEnrollment";
CREATE POLICY course_enrollment_update ON "CourseEnrollment"
  FOR UPDATE
  USING (
    app.is_admin()
    OR app.bypass_rls()
    OR "userId" = app.current_user_id()
  )
  WITH CHECK (
    app.is_admin()
    OR app.bypass_rls()
    OR "userId" = app.current_user_id()
  );

DROP POLICY IF EXISTS course_enrollment_delete ON "CourseEnrollment";
CREATE POLICY course_enrollment_delete ON "CourseEnrollment"
  FOR DELETE
  USING (
    app.is_admin()
    OR app.bypass_rls()
    OR "userId" = app.current_user_id()
  );

-- ── LessonProgress ───────────────────────────────────────────────────────────

ALTER TABLE "LessonProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LessonProgress" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lesson_progress_select ON "LessonProgress";
CREATE POLICY lesson_progress_select ON "LessonProgress"
  FOR SELECT
  USING (
    app.is_admin()
    OR app.bypass_rls()
    OR "userId" = app.current_user_id()
  );

DROP POLICY IF EXISTS lesson_progress_insert ON "LessonProgress";
CREATE POLICY lesson_progress_insert ON "LessonProgress"
  FOR INSERT
  WITH CHECK (
    app.is_admin()
    OR app.bypass_rls()
    OR "userId" = app.current_user_id()
  );

DROP POLICY IF EXISTS lesson_progress_update ON "LessonProgress";
CREATE POLICY lesson_progress_update ON "LessonProgress"
  FOR UPDATE
  USING (
    app.is_admin()
    OR app.bypass_rls()
    OR "userId" = app.current_user_id()
  )
  WITH CHECK (
    app.is_admin()
    OR app.bypass_rls()
    OR "userId" = app.current_user_id()
  );

DROP POLICY IF EXISTS lesson_progress_delete ON "LessonProgress";
CREATE POLICY lesson_progress_delete ON "LessonProgress"
  FOR DELETE
  USING (
    app.is_admin()
    OR app.bypass_rls()
    OR "userId" = app.current_user_id()
  );
