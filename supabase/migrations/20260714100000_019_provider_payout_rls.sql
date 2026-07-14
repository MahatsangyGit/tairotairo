/*
# Fix ProviderPayout RLS (audit C4)

Replace fully-permissive policies with participant/admin/bypass rules
aligned with Transaction policies.
*/

ALTER TABLE "ProviderPayout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProviderPayout" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS provider_payout_select ON "ProviderPayout";
CREATE POLICY provider_payout_select ON "ProviderPayout"
  FOR SELECT
  USING (
    app.is_admin()
    OR "providerId" = app.current_user_id()
  );

DROP POLICY IF EXISTS provider_payout_insert ON "ProviderPayout";
CREATE POLICY provider_payout_insert ON "ProviderPayout"
  FOR INSERT
  WITH CHECK (app.bypass_rls() OR app.is_admin());

DROP POLICY IF EXISTS provider_payout_update ON "ProviderPayout";
CREATE POLICY provider_payout_update ON "ProviderPayout"
  FOR UPDATE
  USING (app.bypass_rls() OR app.is_admin())
  WITH CHECK (app.bypass_rls() OR app.is_admin());

DROP POLICY IF EXISTS provider_payout_delete ON "ProviderPayout";
CREATE POLICY provider_payout_delete ON "ProviderPayout"
  FOR DELETE
  USING (app.is_admin());
