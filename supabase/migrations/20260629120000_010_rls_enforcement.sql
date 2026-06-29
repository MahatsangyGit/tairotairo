/*
# Row Level Security — Tairo ampio (marketplace P2P Madagascar)

Auth custom JWT via variables de session (pas Supabase Auth) :
  - app.user_id      — ID utilisateur (vide = visiteur anonyme)
  - app.user_role    — CLIENT | PROVIDER | ADMIN
  - app.bypass_rls   — true pour inscription, auth, cron, notifications système

Rôles applicatifs :
  - CLIENT    — publie des demandes, réserve des services, messagerie, avis
  - PROVIDER  — publie des annonces, répond aux demandes, portfolio, KYC
  - ADMIN     — modération, KYC, spotlight, abonnements, export

Connexion : rôle PostgreSQL `tairo_app` (non superuser). Migrations : rôle owner.
*/

-- ── Schéma & fonctions utilitaires ────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS text
  LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '');
$$;

CREATE OR REPLACE FUNCTION app.current_user_role() RETURNS text
  LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.user_role', true), '');
$$;

CREATE OR REPLACE FUNCTION app.bypass_rls() RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true';
$$;

CREATE OR REPLACE FUNCTION app.is_authenticated() RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT app.current_user_id() IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION app.is_admin() RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT app.bypass_rls() OR app.current_user_role() = 'ADMIN';
$$;

CREATE OR REPLACE FUNCTION app.is_provider() RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT app.current_user_role() IN ('PROVIDER', 'ADMIN');
$$;

CREATE OR REPLACE FUNCTION app.is_client() RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT app.current_user_role() IN ('CLIENT', 'ADMIN');
$$;

-- Prestataire visible publiquement (fiche, annonces, accueil)
CREATE OR REPLACE FUNCTION app.is_public_provider(target_id text) RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = target_id
      AND u.role = 'PROVIDER'
      AND u.kyc_status = 'APPROVED'
      AND u.suspended_at IS NULL
  );
$$;

-- Client visible via une demande ouverte sur le marketplace
CREATE OR REPLACE FUNCTION app.has_visible_open_request(target_id text) RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM service_requests sr
    JOIN users u ON u.id = sr.client_id
    WHERE sr.client_id = target_id
      AND sr.open = true
      AND u.suspended_at IS NULL
  );
$$;

-- Auteur d'avis affiché sur la fiche prestataire
CREATE OR REPLACE FUNCTION app.is_review_author(target_id text) RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM reviews r WHERE r.author_id = target_id
  );
$$;

-- Relation marketplace active (messagerie, réservation, proposition)
CREATE OR REPLACE FUNCTION app.is_marketplace_peer(target_id text) RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversations c
    WHERE (c.client_id = target_id AND c.provider_id = app.current_user_id())
       OR (c.provider_id = target_id AND c.client_id = app.current_user_id())
  )
  OR EXISTS (
    SELECT 1 FROM bookings b
    WHERE (b.client_id = target_id AND b.provider_id = app.current_user_id())
       OR (b.provider_id = target_id AND b.client_id = app.current_user_id())
  )
  OR EXISTS (
    SELECT 1 FROM service_requests sr
    JOIN request_responses rr ON rr.request_id = sr.id
    WHERE (sr.client_id = target_id AND rr.provider_id = app.current_user_id())
       OR (sr.client_id = app.current_user_id() AND rr.provider_id = target_id)
  );
$$;

-- Participant d'une conversation
CREATE OR REPLACE FUNCTION app.is_conversation_participant(conv_id text) RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conv_id
      AND (c.client_id = app.current_user_id() OR c.provider_id = app.current_user_id())
  );
$$;

-- Participant d'une réservation
CREATE OR REPLACE FUNCTION app.is_booking_participant(booking_id text) RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_id
      AND (b.client_id = app.current_user_id() OR b.provider_id = app.current_user_id())
  );
$$;

-- ── Rôle applicatif ───────────────────────────────────────────────────────────

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

-- ── Activer & forcer RLS ──────────────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE provider_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_otps FORCE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens FORCE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE services FORCE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE request_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_responses FORCE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings FORCE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations FORCE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages FORCE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews FORCE ROW LEVEL SECURITY;
ALTER TABLE provider_portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_portfolio_items FORCE ROW LEVEL SECURITY;
ALTER TABLE portfolio_item_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_item_comments FORCE ROW LEVEL SECURITY;
ALTER TABLE provider_kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_kyc_documents FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS provider_subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS provider_subscription_payments FORCE ROW LEVEL SECURITY;

-- ── Supprimer les anciennes policies ──────────────────────────────────────────

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ══════════════════════════════════════════════════════════════════════════════
-- USERS — comptes CLIENT / PROVIDER / ADMIN
-- ══════════════════════════════════════════════════════════════════════════════
-- SELECT : soi-même, admin, prestataires KYC approuvés, clients avec demande
--          ouverte, pairs marketplace, auteurs d'avis publics
-- INSERT : inscription (bypass) ou admin
-- UPDATE : soi-même (profil, préférences) ou admin (modération, KYC, spotlight)
-- DELETE : admin uniquement

CREATE POLICY users_select ON users FOR SELECT
  USING (
    app.is_admin()
    OR id = app.current_user_id()
    OR app.is_public_provider(id)
    OR app.has_visible_open_request(id)
    OR app.is_review_author(id)
    OR app.is_marketplace_peer(id)
  );

CREATE POLICY users_insert ON users FOR INSERT
  WITH CHECK (app.bypass_rls() OR app.is_admin());

CREATE POLICY users_update ON users FOR UPDATE
  USING (app.is_admin() OR id = app.current_user_id())
  WITH CHECK (app.is_admin() OR id = app.current_user_id());

CREATE POLICY users_delete ON users FOR DELETE
  USING (app.is_admin());

-- ══════════════════════════════════════════════════════════════════════════════
-- PROVIDER_SUBSCRIPTIONS — abonnement mise en avant (admin / système)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY provider_subscriptions_select ON provider_subscriptions FOR SELECT
  USING (app.is_admin() OR provider_id = app.current_user_id());

CREATE POLICY provider_subscriptions_insert ON provider_subscriptions FOR INSERT
  WITH CHECK (app.bypass_rls() OR app.is_admin());

CREATE POLICY provider_subscriptions_update ON provider_subscriptions FOR UPDATE
  USING (app.bypass_rls() OR app.is_admin())
  WITH CHECK (app.bypass_rls() OR app.is_admin());

CREATE POLICY provider_subscriptions_delete ON provider_subscriptions FOR DELETE
  USING (app.bypass_rls() OR app.is_admin());

-- ══════════════════════════════════════════════════════════════════════════════
-- EMAIL_OTPS / PASSWORD_RESET_TOKENS — flux auth uniquement (bypass)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY email_otps_all ON email_otps FOR ALL
  USING (app.bypass_rls()) WITH CHECK (app.bypass_rls());

CREATE POLICY password_reset_tokens_all ON password_reset_tokens FOR ALL
  USING (app.bypass_rls()) WITH CHECK (app.bypass_rls());

-- ══════════════════════════════════════════════════════════════════════════════
-- SERVICES — annonces prestataires
-- ══════════════════════════════════════════════════════════════════════════════
-- SELECT : annonces actives (public), les siennes (même désactivées), admin
-- INSERT/UPDATE/DELETE : propriétaire prestataire ou admin

CREATE POLICY services_select ON services FOR SELECT
  USING (
    app.is_admin()
    OR available = true
    OR provider_id = app.current_user_id()
  );

CREATE POLICY services_insert ON services FOR INSERT
  WITH CHECK (
    app.is_admin()
    OR (provider_id = app.current_user_id() AND app.is_provider())
  );

CREATE POLICY services_update ON services FOR UPDATE
  USING (app.is_admin() OR provider_id = app.current_user_id())
  WITH CHECK (app.is_admin() OR provider_id = app.current_user_id());

CREATE POLICY services_delete ON services FOR DELETE
  USING (app.is_admin() OR provider_id = app.current_user_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- SERVICE_REQUESTS — demandes clients
-- ══════════════════════════════════════════════════════════════════════════════
-- SELECT : demandes ouvertes (public), auteur, prestataires ayant répondu, admin
-- INSERT : client auteur
-- UPDATE : auteur, prestataire impliqué (ex. fermeture après acceptation), admin
-- DELETE : auteur ou admin

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
  WITH CHECK (
    app.is_admin()
    OR (client_id = app.current_user_id() AND app.is_client())
  );

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

-- ══════════════════════════════════════════════════════════════════════════════
-- REQUEST_RESPONSES — propositions prestataires sur une demande
-- ══════════════════════════════════════════════════════════════════════════════
-- SELECT : auteur proposition, client de la demande, demandes ouvertes, admin
-- INSERT : prestataire sur demande ouverte
-- UPDATE : prestataire (retrait) ou client (acceptation/rejet), admin
-- DELETE : auteur proposition ou admin

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
  WITH CHECK (
    app.is_admin()
    OR (
      provider_id = app.current_user_id()
      AND app.is_provider()
      AND EXISTS (
        SELECT 1 FROM service_requests sr
        WHERE sr.id = request_id AND sr.open = true
      )
    )
  );

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

-- ══════════════════════════════════════════════════════════════════════════════
-- BOOKINGS — réservations client ↔ prestataire
-- ══════════════════════════════════════════════════════════════════════════════
-- SELECT : client, prestataire concernés, admin
-- INSERT : client (réservation directe) ou prestataire (acceptation offre), bypass système
-- UPDATE : participants (statut, annulation), admin
-- DELETE : admin

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

-- ══════════════════════════════════════════════════════════════════════════════
-- TRANSACTIONS — paiements mobile money liés à une réservation
-- ══════════════════════════════════════════════════════════════════════════════
-- SELECT : participants de la réservation, admin
-- INSERT/UPDATE : système (bypass) ou admin — création après paiement

CREATE POLICY transactions_select ON transactions FOR SELECT
  USING (
    app.is_admin()
    OR app.is_booking_participant(booking_id)
  );

CREATE POLICY transactions_insert ON transactions FOR INSERT
  WITH CHECK (app.bypass_rls() OR app.is_admin());

CREATE POLICY transactions_update ON transactions FOR UPDATE
  USING (app.bypass_rls() OR app.is_admin())
  WITH CHECK (app.bypass_rls() OR app.is_admin());

CREATE POLICY transactions_delete ON transactions FOR DELETE
  USING (app.is_admin());

-- ══════════════════════════════════════════════════════════════════════════════
-- CONVERSATIONS — fil client ↔ prestataire (unique par paire)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY conversations_select ON conversations FOR SELECT
  USING (
    app.is_admin()
    OR client_id = app.current_user_id()
    OR provider_id = app.current_user_id()
  );

CREATE POLICY conversations_insert ON conversations FOR INSERT
  WITH CHECK (
    app.is_admin()
    OR (client_id = app.current_user_id() AND app.is_client())
    OR (provider_id = app.current_user_id() AND app.is_provider())
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

-- ══════════════════════════════════════════════════════════════════════════════
-- MESSAGES — texte et offres de prix (négociation)
-- ══════════════════════════════════════════════════════════════════════════════
-- SELECT/UPDATE : participants (lecture, marquage lu, acceptation offre)
-- INSERT : expéditeur participant de la conversation

CREATE POLICY messages_select ON messages FOR SELECT
  USING (
    app.is_admin()
    OR app.is_conversation_participant(conversation_id)
  );

CREATE POLICY messages_insert ON messages FOR INSERT
  WITH CHECK (
    app.is_admin()
    OR (
      sender_id = app.current_user_id()
      AND app.is_conversation_participant(conversation_id)
    )
  );

CREATE POLICY messages_update ON messages FOR UPDATE
  USING (app.is_admin() OR app.is_conversation_participant(conversation_id))
  WITH CHECK (app.is_admin() OR app.is_conversation_participant(conversation_id));

CREATE POLICY messages_delete ON messages FOR DELETE
  USING (app.is_admin());

-- ══════════════════════════════════════════════════════════════════════════════
-- NOTIFICATIONS — alertes in-app par utilisateur
-- ══════════════════════════════════════════════════════════════════════════════
-- INSERT système (bypass) pour notifier un autre utilisateur

CREATE POLICY notifications_select ON notifications FOR SELECT
  USING (app.is_admin() OR user_id = app.current_user_id());

CREATE POLICY notifications_insert ON notifications FOR INSERT
  WITH CHECK (app.bypass_rls() OR app.is_admin() OR user_id = app.current_user_id());

CREATE POLICY notifications_update ON notifications FOR UPDATE
  USING (app.is_admin() OR user_id = app.current_user_id())
  WITH CHECK (app.is_admin() OR user_id = app.current_user_id());

CREATE POLICY notifications_delete ON notifications FOR DELETE
  USING (app.is_admin() OR user_id = app.current_user_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- PUSH_SUBSCRIPTIONS — abonnements Web Push navigateur
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY push_subscriptions_select ON push_subscriptions FOR SELECT
  USING (app.is_admin() OR user_id = app.current_user_id());

CREATE POLICY push_subscriptions_insert ON push_subscriptions FOR INSERT
  WITH CHECK (app.is_admin() OR user_id = app.current_user_id());

CREATE POLICY push_subscriptions_update ON push_subscriptions FOR UPDATE
  USING (app.is_admin() OR user_id = app.current_user_id())
  WITH CHECK (app.is_admin() OR user_id = app.current_user_id());

CREATE POLICY push_subscriptions_delete ON push_subscriptions FOR DELETE
  USING (app.is_admin() OR user_id = app.current_user_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- REVIEWS — avis clients après prestation terminée (public, immuables)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY reviews_select ON reviews FOR SELECT
  USING (true);

CREATE POLICY reviews_insert ON reviews FOR INSERT
  WITH CHECK (
    app.is_admin()
    OR (
      author_id = app.current_user_id()
      AND app.is_client()
      AND EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = booking_id
          AND b.client_id = app.current_user_id()
          AND b.provider_id = target_id
          AND b.status = 'COMPLETED'
      )
    )
  );

CREATE POLICY reviews_update ON reviews FOR UPDATE
  USING (app.is_admin()) WITH CHECK (app.is_admin());

CREATE POLICY reviews_delete ON reviews FOR DELETE
  USING (app.is_admin());

-- ══════════════════════════════════════════════════════════════════════════════
-- PROVIDER_PORTFOLIO_ITEMS — galerie travaux prestataire (public)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY portfolio_items_select ON provider_portfolio_items FOR SELECT
  USING (
    app.is_admin()
    OR app.is_public_provider(provider_id)
    OR provider_id = app.current_user_id()
  );

CREATE POLICY portfolio_items_insert ON provider_portfolio_items FOR INSERT
  WITH CHECK (
    app.is_admin()
    OR (provider_id = app.current_user_id() AND app.is_provider())
  );

CREATE POLICY portfolio_items_update ON provider_portfolio_items FOR UPDATE
  USING (app.is_admin() OR provider_id = app.current_user_id())
  WITH CHECK (app.is_admin() OR provider_id = app.current_user_id());

CREATE POLICY portfolio_items_delete ON provider_portfolio_items FOR DELETE
  USING (app.is_admin() OR provider_id = app.current_user_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- PORTFOLIO_ITEM_COMMENTS — commentaires publics sur le portfolio
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY portfolio_comments_select ON portfolio_item_comments FOR SELECT
  USING (true);

CREATE POLICY portfolio_comments_insert ON portfolio_item_comments FOR INSERT
  WITH CHECK (
    app.is_admin()
    OR (author_id = app.current_user_id() AND app.is_authenticated())
  );

CREATE POLICY portfolio_comments_update ON portfolio_item_comments FOR UPDATE
  USING (app.is_admin() OR author_id = app.current_user_id())
  WITH CHECK (app.is_admin() OR author_id = app.current_user_id());

CREATE POLICY portfolio_comments_delete ON portfolio_item_comments FOR DELETE
  USING (app.is_admin() OR author_id = app.current_user_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- PROVIDER_KYC_DOCUMENTS — pièces d'identité (confidentiel)
-- ══════════════════════════════════════════════════════════════════════════════
-- SELECT : propriétaire prestataire ou admin (revue KYC)

CREATE POLICY kyc_documents_select ON provider_kyc_documents FOR SELECT
  USING (app.is_admin() OR user_id = app.current_user_id());

CREATE POLICY kyc_documents_insert ON provider_kyc_documents FOR INSERT
  WITH CHECK (
    app.is_admin()
    OR (user_id = app.current_user_id() AND app.is_provider())
  );

CREATE POLICY kyc_documents_update ON provider_kyc_documents FOR UPDATE
  USING (app.is_admin() OR user_id = app.current_user_id())
  WITH CHECK (app.is_admin() OR user_id = app.current_user_id());

CREATE POLICY kyc_documents_delete ON provider_kyc_documents FOR DELETE
  USING (app.is_admin() OR user_id = app.current_user_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- PROVIDER_SUBSCRIPTION_PAYMENTS — paiements abonnement prestataire
-- ══════════════════════════════════════════════════════════════════════════════

CREATE POLICY subscription_payments_select ON provider_subscription_payments FOR SELECT
  USING (app.is_admin() OR provider_id = app.current_user_id());

CREATE POLICY subscription_payments_insert ON provider_subscription_payments FOR INSERT
  WITH CHECK (
    app.is_admin()
    OR (provider_id = app.current_user_id() AND app.is_provider())
  );

CREATE POLICY subscription_payments_update ON provider_subscription_payments FOR UPDATE
  USING (app.bypass_rls() OR app.is_admin() OR provider_id = app.current_user_id())
  WITH CHECK (app.bypass_rls() OR app.is_admin() OR provider_id = app.current_user_id());

CREATE POLICY subscription_payments_delete ON provider_subscription_payments FOR DELETE
  USING (app.is_admin());
