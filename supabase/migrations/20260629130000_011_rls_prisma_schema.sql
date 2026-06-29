/*
# RLS policies — schéma Prisma (tables PascalCase, colonnes camelCase)

À appliquer sur la base gérée par Prisma (`"User"`, `"Service"`, etc.).
La migration 010 cible un schéma snake_case Supabase ; celle-ci est la version active.
*/

-- ── Compléter les fonctions helper (tables Prisma) ───────────────────────────

CREATE OR REPLACE FUNCTION app.is_public_provider(target_id text) RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM "User" u
    WHERE u.id = target_id
      AND u.role = 'PROVIDER'::"Role"
      AND u."kycStatus" = 'APPROVED'::"KycStatus"
      AND u."suspendedAt" IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION app.has_visible_open_request(target_id text) RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM "ServiceRequest" sr
    JOIN "User" u ON u.id = sr."clientId"
    WHERE sr."clientId" = target_id
      AND sr.open = true
      AND u."suspendedAt" IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION app.is_review_author(target_id text) RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM "Review" r WHERE r."authorId" = target_id
  );
$$;

CREATE OR REPLACE FUNCTION app.is_marketplace_peer(target_id text) RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM "Conversation" c
    WHERE (c."clientId" = target_id AND c."providerId" = app.current_user_id())
       OR (c."providerId" = target_id AND c."clientId" = app.current_user_id())
  )
  OR EXISTS (
    SELECT 1 FROM "Booking" b
    WHERE (b."clientId" = target_id AND b."providerId" = app.current_user_id())
       OR (b."providerId" = target_id AND b."clientId" = app.current_user_id())
  )
  OR EXISTS (
    SELECT 1 FROM "ServiceRequest" sr
    JOIN "RequestResponse" rr ON rr."requestId" = sr.id
    WHERE (sr."clientId" = target_id AND rr."providerId" = app.current_user_id())
       OR (sr."clientId" = app.current_user_id() AND rr."providerId" = target_id)
  );
$$;

CREATE OR REPLACE FUNCTION app.is_conversation_participant(conv_id text) RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM "Conversation" c
    WHERE c.id = conv_id
      AND (c."clientId" = app.current_user_id() OR c."providerId" = app.current_user_id())
  );
$$;

CREATE OR REPLACE FUNCTION app.is_booking_participant(booking_id text) RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM "Booking" b
    WHERE b.id = booking_id
      AND (b."clientId" = app.current_user_id() OR b."providerId" = app.current_user_id())
  );
$$;

-- ── Forcer RLS sur les tables Prisma ─────────────────────────────────────────

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ProviderSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProviderSubscription" FORCE ROW LEVEL SECURITY;
ALTER TABLE "EmailOtp" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailOtp" FORCE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ServiceRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceRequest" FORCE ROW LEVEL SECURITY;
ALTER TABLE "RequestResponse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RequestResponse" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversation" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" FORCE ROW LEVEL SECURITY;
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PushSubscription" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ProviderPortfolioItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProviderPortfolioItem" FORCE ROW LEVEL SECURITY;
ALTER TABLE "PortfolioItemComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PortfolioItemComment" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ProviderKycDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProviderKycDocument" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ProviderSubscriptionPayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProviderSubscriptionPayment" FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tairo_app;

-- ── User ──────────────────────────────────────────────────────────────────────

CREATE POLICY user_select ON "User" FOR SELECT
  USING (
    app.is_admin()
    OR id = app.current_user_id()
    OR app.is_public_provider(id)
    OR app.has_visible_open_request(id)
    OR app.is_review_author(id)
    OR app.is_marketplace_peer(id)
  );

CREATE POLICY user_insert ON "User" FOR INSERT
  WITH CHECK (app.bypass_rls() OR app.is_admin());

CREATE POLICY user_update ON "User" FOR UPDATE
  USING (app.is_admin() OR id = app.current_user_id())
  WITH CHECK (app.is_admin() OR id = app.current_user_id());

CREATE POLICY user_delete ON "User" FOR DELETE
  USING (app.is_admin());

-- ── ProviderSubscription ──────────────────────────────────────────────────────

CREATE POLICY provider_subscription_select ON "ProviderSubscription" FOR SELECT
  USING (app.is_admin() OR "providerId" = app.current_user_id());

CREATE POLICY provider_subscription_insert ON "ProviderSubscription" FOR INSERT
  WITH CHECK (app.bypass_rls() OR app.is_admin());

CREATE POLICY provider_subscription_update ON "ProviderSubscription" FOR UPDATE
  USING (app.bypass_rls() OR app.is_admin())
  WITH CHECK (app.bypass_rls() OR app.is_admin());

CREATE POLICY provider_subscription_delete ON "ProviderSubscription" FOR DELETE
  USING (app.bypass_rls() OR app.is_admin());

-- ── Auth tokens ───────────────────────────────────────────────────────────────

CREATE POLICY email_otp_all ON "EmailOtp" FOR ALL
  USING (app.bypass_rls()) WITH CHECK (app.bypass_rls());

CREATE POLICY password_reset_all ON "PasswordResetToken" FOR ALL
  USING (app.bypass_rls()) WITH CHECK (app.bypass_rls());

-- ── Service ───────────────────────────────────────────────────────────────────

CREATE POLICY service_select ON "Service" FOR SELECT
  USING (app.is_admin() OR available = true OR "providerId" = app.current_user_id());

CREATE POLICY service_insert ON "Service" FOR INSERT
  WITH CHECK (app.is_admin() OR ("providerId" = app.current_user_id() AND app.is_provider()));

CREATE POLICY service_update ON "Service" FOR UPDATE
  USING (app.is_admin() OR "providerId" = app.current_user_id())
  WITH CHECK (app.is_admin() OR "providerId" = app.current_user_id());

CREATE POLICY service_delete ON "Service" FOR DELETE
  USING (app.is_admin() OR "providerId" = app.current_user_id());

-- ── ServiceRequest ────────────────────────────────────────────────────────────

CREATE POLICY service_request_select ON "ServiceRequest" FOR SELECT
  USING (
    app.is_admin()
    OR open = true
    OR "clientId" = app.current_user_id()
    OR EXISTS (
      SELECT 1 FROM "RequestResponse" rr
      WHERE rr."requestId" = "ServiceRequest".id
        AND rr."providerId" = app.current_user_id()
    )
  );

CREATE POLICY service_request_insert ON "ServiceRequest" FOR INSERT
  WITH CHECK (app.is_admin() OR ("clientId" = app.current_user_id() AND app.is_client()));

CREATE POLICY service_request_update ON "ServiceRequest" FOR UPDATE
  USING (
    app.is_admin()
    OR "clientId" = app.current_user_id()
    OR EXISTS (
      SELECT 1 FROM "RequestResponse" rr
      WHERE rr."requestId" = "ServiceRequest".id
        AND rr."providerId" = app.current_user_id()
    )
  )
  WITH CHECK (
    app.is_admin()
    OR "clientId" = app.current_user_id()
    OR EXISTS (
      SELECT 1 FROM "RequestResponse" rr
      WHERE rr."requestId" = "ServiceRequest".id
        AND rr."providerId" = app.current_user_id()
    )
  );

CREATE POLICY service_request_delete ON "ServiceRequest" FOR DELETE
  USING (app.is_admin() OR "clientId" = app.current_user_id());

-- ── RequestResponse ───────────────────────────────────────────────────────────

CREATE POLICY request_response_select ON "RequestResponse" FOR SELECT
  USING (
    app.is_admin()
    OR "providerId" = app.current_user_id()
    OR EXISTS (
      SELECT 1 FROM "ServiceRequest" sr
      WHERE sr.id = "RequestResponse"."requestId"
        AND (sr."clientId" = app.current_user_id() OR sr.open = true)
    )
  );

CREATE POLICY request_response_insert ON "RequestResponse" FOR INSERT
  WITH CHECK (
    app.is_admin()
    OR (
      "providerId" = app.current_user_id()
      AND app.is_provider()
      AND EXISTS (
        SELECT 1 FROM "ServiceRequest" sr
        WHERE sr.id = "requestId" AND sr.open = true
      )
    )
  );

CREATE POLICY request_response_update ON "RequestResponse" FOR UPDATE
  USING (
    app.is_admin()
    OR "providerId" = app.current_user_id()
    OR EXISTS (
      SELECT 1 FROM "ServiceRequest" sr
      WHERE sr.id = "RequestResponse"."requestId"
        AND sr."clientId" = app.current_user_id()
    )
  )
  WITH CHECK (
    app.is_admin()
    OR "providerId" = app.current_user_id()
    OR EXISTS (
      SELECT 1 FROM "ServiceRequest" sr
      WHERE sr.id = "RequestResponse"."requestId"
        AND sr."clientId" = app.current_user_id()
    )
  );

CREATE POLICY request_response_delete ON "RequestResponse" FOR DELETE
  USING (app.is_admin() OR "providerId" = app.current_user_id());

-- ── Booking ───────────────────────────────────────────────────────────────────

CREATE POLICY booking_select ON "Booking" FOR SELECT
  USING (
    app.is_admin()
    OR "clientId" = app.current_user_id()
    OR "providerId" = app.current_user_id()
  );

CREATE POLICY booking_insert ON "Booking" FOR INSERT
  WITH CHECK (
    app.bypass_rls()
    OR app.is_admin()
    OR "clientId" = app.current_user_id()
    OR "providerId" = app.current_user_id()
  );

CREATE POLICY booking_update ON "Booking" FOR UPDATE
  USING (
    app.is_admin()
    OR "clientId" = app.current_user_id()
    OR "providerId" = app.current_user_id()
  )
  WITH CHECK (
    app.is_admin()
    OR "clientId" = app.current_user_id()
    OR "providerId" = app.current_user_id()
  );

CREATE POLICY booking_delete ON "Booking" FOR DELETE
  USING (app.is_admin());

-- ── Transaction ───────────────────────────────────────────────────────────────

CREATE POLICY transaction_select ON "Transaction" FOR SELECT
  USING (app.is_admin() OR app.is_booking_participant("bookingId"));

CREATE POLICY transaction_insert ON "Transaction" FOR INSERT
  WITH CHECK (app.bypass_rls() OR app.is_admin());

CREATE POLICY transaction_update ON "Transaction" FOR UPDATE
  USING (app.bypass_rls() OR app.is_admin())
  WITH CHECK (app.bypass_rls() OR app.is_admin());

CREATE POLICY transaction_delete ON "Transaction" FOR DELETE
  USING (app.is_admin());

-- ── Conversation ──────────────────────────────────────────────────────────────

CREATE POLICY conversation_select ON "Conversation" FOR SELECT
  USING (
    app.is_admin()
    OR "clientId" = app.current_user_id()
    OR "providerId" = app.current_user_id()
  );

CREATE POLICY conversation_insert ON "Conversation" FOR INSERT
  WITH CHECK (
    app.is_admin()
    OR ("clientId" = app.current_user_id() AND app.is_client())
    OR ("providerId" = app.current_user_id() AND app.is_provider())
  );

CREATE POLICY conversation_update ON "Conversation" FOR UPDATE
  USING (
    app.is_admin()
    OR "clientId" = app.current_user_id()
    OR "providerId" = app.current_user_id()
  )
  WITH CHECK (
    app.is_admin()
    OR "clientId" = app.current_user_id()
    OR "providerId" = app.current_user_id()
  );

CREATE POLICY conversation_delete ON "Conversation" FOR DELETE
  USING (app.is_admin());

-- ── Message ───────────────────────────────────────────────────────────────────

CREATE POLICY message_select ON "Message" FOR SELECT
  USING (app.is_admin() OR app.is_conversation_participant("conversationId"));

CREATE POLICY message_insert ON "Message" FOR INSERT
  WITH CHECK (
    app.is_admin()
    OR (
      "senderId" = app.current_user_id()
      AND app.is_conversation_participant("conversationId")
    )
  );

CREATE POLICY message_update ON "Message" FOR UPDATE
  USING (app.is_admin() OR app.is_conversation_participant("conversationId"))
  WITH CHECK (app.is_admin() OR app.is_conversation_participant("conversationId"));

CREATE POLICY message_delete ON "Message" FOR DELETE
  USING (app.is_admin());

-- ── Notification ──────────────────────────────────────────────────────────────

CREATE POLICY notification_select ON "Notification" FOR SELECT
  USING (app.is_admin() OR "userId" = app.current_user_id());

CREATE POLICY notification_insert ON "Notification" FOR INSERT
  WITH CHECK (app.bypass_rls() OR app.is_admin() OR "userId" = app.current_user_id());

CREATE POLICY notification_update ON "Notification" FOR UPDATE
  USING (app.is_admin() OR "userId" = app.current_user_id())
  WITH CHECK (app.is_admin() OR "userId" = app.current_user_id());

CREATE POLICY notification_delete ON "Notification" FOR DELETE
  USING (app.is_admin() OR "userId" = app.current_user_id());

-- ── PushSubscription ──────────────────────────────────────────────────────────

CREATE POLICY push_subscription_select ON "PushSubscription" FOR SELECT
  USING (app.is_admin() OR "userId" = app.current_user_id());

CREATE POLICY push_subscription_insert ON "PushSubscription" FOR INSERT
  WITH CHECK (app.is_admin() OR "userId" = app.current_user_id());

CREATE POLICY push_subscription_update ON "PushSubscription" FOR UPDATE
  USING (app.is_admin() OR "userId" = app.current_user_id())
  WITH CHECK (app.is_admin() OR "userId" = app.current_user_id());

CREATE POLICY push_subscription_delete ON "PushSubscription" FOR DELETE
  USING (app.is_admin() OR "userId" = app.current_user_id());

-- ── Review ────────────────────────────────────────────────────────────────────

CREATE POLICY review_select ON "Review" FOR SELECT USING (true);

CREATE POLICY review_insert ON "Review" FOR INSERT
  WITH CHECK (
    app.is_admin()
    OR (
      "authorId" = app.current_user_id()
      AND app.is_client()
      AND EXISTS (
        SELECT 1 FROM "Booking" b
        WHERE b.id = "bookingId"
          AND b."clientId" = app.current_user_id()
          AND b."providerId" = "targetId"
          AND b.status = 'COMPLETED'::"BookingStatus"
      )
    )
  );

CREATE POLICY review_update ON "Review" FOR UPDATE
  USING (app.is_admin()) WITH CHECK (app.is_admin());

CREATE POLICY review_delete ON "Review" FOR DELETE
  USING (app.is_admin());

-- ── Portfolio ─────────────────────────────────────────────────────────────────

CREATE POLICY portfolio_item_select ON "ProviderPortfolioItem" FOR SELECT
  USING (
    app.is_admin()
    OR app.is_public_provider("providerId")
    OR "providerId" = app.current_user_id()
  );

CREATE POLICY portfolio_item_insert ON "ProviderPortfolioItem" FOR INSERT
  WITH CHECK (app.is_admin() OR ("providerId" = app.current_user_id() AND app.is_provider()));

CREATE POLICY portfolio_item_update ON "ProviderPortfolioItem" FOR UPDATE
  USING (app.is_admin() OR "providerId" = app.current_user_id())
  WITH CHECK (app.is_admin() OR "providerId" = app.current_user_id());

CREATE POLICY portfolio_item_delete ON "ProviderPortfolioItem" FOR DELETE
  USING (app.is_admin() OR "providerId" = app.current_user_id());

CREATE POLICY portfolio_comment_select ON "PortfolioItemComment" FOR SELECT USING (true);

CREATE POLICY portfolio_comment_insert ON "PortfolioItemComment" FOR INSERT
  WITH CHECK (app.is_admin() OR ("authorId" = app.current_user_id() AND app.is_authenticated()));

CREATE POLICY portfolio_comment_update ON "PortfolioItemComment" FOR UPDATE
  USING (app.is_admin() OR "authorId" = app.current_user_id())
  WITH CHECK (app.is_admin() OR "authorId" = app.current_user_id());

CREATE POLICY portfolio_comment_delete ON "PortfolioItemComment" FOR DELETE
  USING (app.is_admin() OR "authorId" = app.current_user_id());

-- ── KYC ───────────────────────────────────────────────────────────────────────

CREATE POLICY kyc_document_select ON "ProviderKycDocument" FOR SELECT
  USING (app.is_admin() OR "userId" = app.current_user_id());

CREATE POLICY kyc_document_insert ON "ProviderKycDocument" FOR INSERT
  WITH CHECK (app.is_admin() OR ("userId" = app.current_user_id() AND app.is_provider()));

CREATE POLICY kyc_document_update ON "ProviderKycDocument" FOR UPDATE
  USING (app.is_admin() OR "userId" = app.current_user_id())
  WITH CHECK (app.is_admin() OR "userId" = app.current_user_id());

CREATE POLICY kyc_document_delete ON "ProviderKycDocument" FOR DELETE
  USING (app.is_admin() OR "userId" = app.current_user_id());

-- ── Subscription payments ─────────────────────────────────────────────────────

CREATE POLICY subscription_payment_select ON "ProviderSubscriptionPayment" FOR SELECT
  USING (app.is_admin() OR "providerId" = app.current_user_id());

CREATE POLICY subscription_payment_insert ON "ProviderSubscriptionPayment" FOR INSERT
  WITH CHECK (app.is_admin() OR ("providerId" = app.current_user_id() AND app.is_provider()));

CREATE POLICY subscription_payment_update ON "ProviderSubscriptionPayment" FOR UPDATE
  USING (app.bypass_rls() OR app.is_admin() OR "providerId" = app.current_user_id())
  WITH CHECK (app.bypass_rls() OR app.is_admin() OR "providerId" = app.current_user_id());

CREATE POLICY subscription_payment_delete ON "ProviderSubscriptionPayment" FOR DELETE
  USING (app.is_admin());
