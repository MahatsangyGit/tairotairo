/*
# Row Level Security enforcement

Replaces permissive placeholder policies with real access rules driven by
session variables set by the application (custom JWT auth, not Supabase Auth):

  - app.user_id      — current authenticated user id (empty = anonymous)
  - app.user_role    — CLIENT | PROVIDER | ADMIN
  - app.bypass_rls   — true for auth flows, cron, and system writes

Connect the app with the `tairo_app` role (not a superuser) so policies apply.
Use DATABASE_URL_MIGRATE / owner role only for migrations.
*/

-- ── Helper schema & functions ─────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS text
  LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '');
$$;

CREATE OR REPLACE FUNCTION app.current_user_role() RETURNS text
  LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('app.user_role', true), '');
$$;

CREATE OR REPLACE FUNCTION app.bypass_rls() RETURNS boolean
  LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true';
$$;

CREATE OR REPLACE FUNCTION app.is_admin() RETURNS boolean
  LANGUAGE sql STABLE
AS $$
  SELECT app.bypass_rls() OR app.current_user_role() = 'ADMIN';
$$;

CREATE OR REPLACE FUNCTION app.is_authenticated() RETURNS boolean
  LANGUAGE sql STABLE
AS $$
  SELECT app.current_user_id() IS NOT NULL;
$$;

-- ── Application role (non-superuser, subject to RLS) ────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tairo_app') THEN
    CREATE ROLE tairo_app LOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO tairo_app;
GRANT USAGE ON SCHEMA app TO tairo_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO tairo_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tairo_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tairo_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO tairo_app;

-- ── Force RLS (even table owner connections are filtered) ─────────────────────

ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE provider_subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE email_otps FORCE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens FORCE ROW LEVEL SECURITY;
ALTER TABLE services FORCE ROW LEVEL SECURITY;
ALTER TABLE service_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE request_responses FORCE ROW LEVEL SECURITY;
ALTER TABLE bookings FORCE ROW LEVEL SECURITY;
ALTER TABLE transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE conversations FORCE ROW LEVEL SECURITY;
ALTER TABLE messages FORCE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE reviews FORCE ROW LEVEL SECURITY;
ALTER TABLE provider_portfolio_items FORCE ROW LEVEL SECURITY;
ALTER TABLE portfolio_item_comments FORCE ROW LEVEL SECURITY;
ALTER TABLE provider_kyc_documents FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS provider_subscription_payments FORCE ROW LEVEL SECURITY;

-- ── Drop placeholder policies ─────────────────────────────────────────────────

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ── users ─────────────────────────────────────────────────────────────────────

CREATE POLICY users_select ON users FOR SELECT
  USING (
    app.is_admin()
    OR id = app.current_user_id()
    OR (
      role = 'PROVIDER'
      AND kyc_status = 'APPROVED'
      AND suspended_at IS NULL
    )
    OR role = 'ADMIN'
  );

CREATE POLICY users_insert ON users FOR INSERT
  WITH CHECK (app.bypass_rls() OR app.is_admin());

CREATE POLICY users_update ON users FOR UPDATE
  USING (app.is_admin() OR id = app.current_user_id())
  WITH CHECK (app.is_admin() OR id = app.current_user_id());

CREATE POLICY users_delete ON users FOR DELETE
  USING (app.is_admin());

-- ── provider_subscriptions ────────────────────────────────────────────────────

CREATE POLICY provider_subscriptions_select ON provider_subscriptions FOR SELECT
  USING (app.is_admin() OR provider_id = app.current_user_id());

CREATE POLICY provider_subscriptions_insert ON provider_subscriptions FOR INSERT
  WITH CHECK (app.bypass_rls() OR app.is_admin());

CREATE POLICY provider_subscriptions_update ON provider_subscriptions FOR UPDATE
  USING (app.bypass_rls() OR app.is_admin())
  WITH CHECK (app.bypass_rls() OR app.is_admin());

CREATE POLICY provider_subscriptions_delete ON provider_subscriptions FOR DELETE
  USING (app.bypass_rls() OR app.is_admin());

-- ── email_otps & password_reset_tokens (auth flows only) ────────────────────

CREATE POLICY email_otps_all ON email_otps FOR ALL
  USING (app.bypass_rls())
  WITH CHECK (app.bypass_rls());

CREATE POLICY password_reset_tokens_all ON password_reset_tokens FOR ALL
  USING (app.bypass_rls())
  WITH CHECK (app.bypass_rls());

-- ── services ──────────────────────────────────────────────────────────────────

CREATE POLICY services_select ON services FOR SELECT
  USING (
    app.is_admin()
    OR available = true
    OR provider_id = app.current_user_id()
  );

CREATE POLICY services_insert ON services FOR INSERT
  WITH CHECK (app.is_admin() OR provider_id = app.current_user_id());

CREATE POLICY services_update ON services FOR UPDATE
  USING (app.is_admin() OR provider_id = app.current_user_id())
  WITH CHECK (app.is_admin() OR provider_id = app.current_user_id());

CREATE POLICY services_delete ON services FOR DELETE
  USING (app.is_admin() OR provider_id = app.current_user_id());

-- ── service_requests ──────────────────────────────────────────────────────────

CREATE POLICY service_requests_select ON service_requests FOR SELECT
  USING (
    app.is_admin()
    OR open = true
    OR client_id = app.current_user_id()
    OR EXISTS (
      SELECT 1 FROM request_responses rr
      WHERE rr.request_id = service_requests.id
        AND rr.provider_id = app.current_user_id()
    )
  );

CREATE POLICY service_requests_insert ON service_requests FOR INSERT
  WITH CHECK (app.is_admin() OR client_id = app.current_user_id());

CREATE POLICY service_requests_update ON service_requests FOR UPDATE
  USING (
    app.is_admin()
    OR client_id = app.current_user_id()
    OR EXISTS (
      SELECT 1 FROM request_responses rr
      WHERE rr.request_id = service_requests.id
        AND rr.provider_id = app.current_user_id()
    )
  )
  WITH CHECK (
    app.is_admin()
    OR client_id = app.current_user_id()
    OR EXISTS (
      SELECT 1 FROM request_responses rr
      WHERE rr.request_id = service_requests.id
        AND rr.provider_id = app.current_user_id()
    )
  );

CREATE POLICY service_requests_delete ON service_requests FOR DELETE
  USING (app.is_admin() OR client_id = app.current_user_id());

-- ── request_responses ─────────────────────────────────────────────────────────

CREATE POLICY request_responses_select ON request_responses FOR SELECT
  USING (
    app.is_admin()
    OR provider_id = app.current_user_id()
    OR EXISTS (
      SELECT 1 FROM service_requests sr
      WHERE sr.id = request_responses.request_id
        AND (sr.client_id = app.current_user_id() OR sr.open = true)
    )
  );

CREATE POLICY request_responses_insert ON request_responses FOR INSERT
  WITH CHECK (app.is_admin() OR provider_id = app.current_user_id());

CREATE POLICY request_responses_update ON request_responses FOR UPDATE
  USING (
    app.is_admin()
    OR provider_id = app.current_user_id()
    OR EXISTS (
      SELECT 1 FROM service_requests sr
      WHERE sr.id = request_responses.request_id
        AND sr.client_id = app.current_user_id()
    )
  )
  WITH CHECK (
    app.is_admin()
    OR provider_id = app.current_user_id()
    OR EXISTS (
      SELECT 1 FROM service_requests sr
      WHERE sr.id = request_responses.request_id
        AND sr.client_id = app.current_user_id()
    )
  );

CREATE POLICY request_responses_delete ON request_responses FOR DELETE
  USING (app.is_admin() OR provider_id = app.current_user_id());

-- ── bookings ──────────────────────────────────────────────────────────────────

CREATE POLICY bookings_select ON bookings FOR SELECT
  USING (
    app.is_admin()
    OR client_id = app.current_user_id()
    OR provider_id = app.current_user_id()
  );

CREATE POLICY bookings_insert ON bookings FOR INSERT
  WITH CHECK (
    app.bypass_rls()
    OR app.is_admin()
    OR client_id = app.current_user_id()
    OR provider_id = app.current_user_id()
  );

CREATE POLICY bookings_update ON bookings FOR UPDATE
  USING (
    app.is_admin()
    OR client_id = app.current_user_id()
    OR provider_id = app.current_user_id()
  )
  WITH CHECK (
    app.is_admin()
    OR client_id = app.current_user_id()
    OR provider_id = app.current_user_id()
  );

CREATE POLICY bookings_delete ON bookings FOR DELETE
  USING (app.is_admin());

-- ── transactions ──────────────────────────────────────────────────────────────

CREATE POLICY transactions_select ON transactions FOR SELECT
  USING (
    app.is_admin()
    OR EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = transactions.booking_id
        AND (
          b.client_id = app.current_user_id()
          OR b.provider_id = app.current_user_id()
        )
    )
  );

CREATE POLICY transactions_insert ON transactions FOR INSERT
  WITH CHECK (app.bypass_rls() OR app.is_admin());

CREATE POLICY transactions_update ON transactions FOR UPDATE
  USING (app.bypass_rls() OR app.is_admin())
  WITH CHECK (app.bypass_rls() OR app.is_admin());

CREATE POLICY transactions_delete ON transactions FOR DELETE
  USING (app.is_admin());

-- ── conversations ─────────────────────────────────────────────────────────────

CREATE POLICY conversations_select ON conversations FOR SELECT
  USING (
    app.is_admin()
    OR client_id = app.current_user_id()
    OR provider_id = app.current_user_id()
  );

CREATE POLICY conversations_insert ON conversations FOR INSERT
  WITH CHECK (
    app.is_admin()
    OR client_id = app.current_user_id()
    OR provider_id = app.current_user_id()
  );

CREATE POLICY conversations_update ON conversations FOR UPDATE
  USING (
    app.is_admin()
    OR client_id = app.current_user_id()
    OR provider_id = app.current_user_id()
  )
  WITH CHECK (
    app.is_admin()
    OR client_id = app.current_user_id()
    OR provider_id = app.current_user_id()
  );

CREATE POLICY conversations_delete ON conversations FOR DELETE
  USING (app.is_admin());

-- ── messages ──────────────────────────────────────────────────────────────────

CREATE POLICY messages_select ON messages FOR SELECT
  USING (
    app.is_admin()
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.client_id = app.current_user_id()
          OR c.provider_id = app.current_user_id()
        )
    )
  );

CREATE POLICY messages_insert ON messages FOR INSERT
  WITH CHECK (
    app.is_admin()
    OR (
      sender_id = app.current_user_id()
      AND EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
          AND (
            c.client_id = app.current_user_id()
            OR c.provider_id = app.current_user_id()
          )
      )
    )
  );

CREATE POLICY messages_update ON messages FOR UPDATE
  USING (
    app.is_admin()
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.client_id = app.current_user_id()
          OR c.provider_id = app.current_user_id()
        )
    )
  )
  WITH CHECK (
    app.is_admin()
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.client_id = app.current_user_id()
          OR c.provider_id = app.current_user_id()
        )
    )
  );

CREATE POLICY messages_delete ON messages FOR DELETE
  USING (app.is_admin());

-- ── notifications ─────────────────────────────────────────────────────────────

CREATE POLICY notifications_select ON notifications FOR SELECT
  USING (app.is_admin() OR user_id = app.current_user_id());

CREATE POLICY notifications_insert ON notifications FOR INSERT
  WITH CHECK (app.bypass_rls() OR app.is_admin() OR user_id = app.current_user_id());

CREATE POLICY notifications_update ON notifications FOR UPDATE
  USING (app.is_admin() OR user_id = app.current_user_id())
  WITH CHECK (app.is_admin() OR user_id = app.current_user_id());

CREATE POLICY notifications_delete ON notifications FOR DELETE
  USING (app.is_admin() OR user_id = app.current_user_id());

-- ── push_subscriptions ────────────────────────────────────────────────────────

CREATE POLICY push_subscriptions_select ON push_subscriptions FOR SELECT
  USING (app.is_admin() OR user_id = app.current_user_id());

CREATE POLICY push_subscriptions_insert ON push_subscriptions FOR INSERT
  WITH CHECK (app.is_admin() OR user_id = app.current_user_id());

CREATE POLICY push_subscriptions_update ON push_subscriptions FOR UPDATE
  USING (app.is_admin() OR user_id = app.current_user_id())
  WITH CHECK (app.is_admin() OR user_id = app.current_user_id());

CREATE POLICY push_subscriptions_delete ON push_subscriptions FOR DELETE
  USING (app.is_admin() OR user_id = app.current_user_id());

-- ── reviews ───────────────────────────────────────────────────────────────────

CREATE POLICY reviews_select ON reviews FOR SELECT
  USING (true);

CREATE POLICY reviews_insert ON reviews FOR INSERT
  WITH CHECK (app.is_admin() OR author_id = app.current_user_id());

CREATE POLICY reviews_update ON reviews FOR UPDATE
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

CREATE POLICY reviews_delete ON reviews FOR DELETE
  USING (app.is_admin());

-- ── portfolio ─────────────────────────────────────────────────────────────────

CREATE POLICY portfolio_items_select ON provider_portfolio_items FOR SELECT
  USING (true);

CREATE POLICY portfolio_items_insert ON provider_portfolio_items FOR INSERT
  WITH CHECK (app.is_admin() OR provider_id = app.current_user_id());

CREATE POLICY portfolio_items_update ON provider_portfolio_items FOR UPDATE
  USING (app.is_admin() OR provider_id = app.current_user_id())
  WITH CHECK (app.is_admin() OR provider_id = app.current_user_id());

CREATE POLICY portfolio_items_delete ON provider_portfolio_items FOR DELETE
  USING (app.is_admin() OR provider_id = app.current_user_id());

CREATE POLICY portfolio_comments_select ON portfolio_item_comments FOR SELECT
  USING (true);

CREATE POLICY portfolio_comments_insert ON portfolio_item_comments FOR INSERT
  WITH CHECK (app.is_admin() OR author_id = app.current_user_id());

CREATE POLICY portfolio_comments_update ON portfolio_item_comments FOR UPDATE
  USING (app.is_admin() OR author_id = app.current_user_id())
  WITH CHECK (app.is_admin() OR author_id = app.current_user_id());

CREATE POLICY portfolio_comments_delete ON portfolio_item_comments FOR DELETE
  USING (app.is_admin() OR author_id = app.current_user_id());

-- ── KYC documents ─────────────────────────────────────────────────────────────

CREATE POLICY kyc_documents_select ON provider_kyc_documents FOR SELECT
  USING (app.is_admin() OR user_id = app.current_user_id());

CREATE POLICY kyc_documents_insert ON provider_kyc_documents FOR INSERT
  WITH CHECK (app.is_admin() OR user_id = app.current_user_id());

CREATE POLICY kyc_documents_update ON provider_kyc_documents FOR UPDATE
  USING (app.is_admin() OR user_id = app.current_user_id())
  WITH CHECK (app.is_admin() OR user_id = app.current_user_id());

CREATE POLICY kyc_documents_delete ON provider_kyc_documents FOR DELETE
  USING (app.is_admin() OR user_id = app.current_user_id());

-- ── provider_subscription_payments ──────────────────────────────────────────

ALTER TABLE IF EXISTS provider_subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscription_payments_select ON provider_subscription_payments FOR SELECT
  USING (app.is_admin() OR provider_id = app.current_user_id());

CREATE POLICY subscription_payments_insert ON provider_subscription_payments FOR INSERT
  WITH CHECK (app.is_admin() OR provider_id = app.current_user_id());

CREATE POLICY subscription_payments_update ON provider_subscription_payments FOR UPDATE
  USING (app.bypass_rls() OR app.is_admin() OR provider_id = app.current_user_id())
  WITH CHECK (app.bypass_rls() OR app.is_admin() OR provider_id = app.current_user_id());

CREATE POLICY subscription_payments_delete ON provider_subscription_payments FOR DELETE
  USING (app.is_admin());
