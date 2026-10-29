
-- ============= quote_notes: admin-only =============
DROP POLICY IF EXISTS "Users can view quote notes" ON public.quote_notes;
DROP POLICY IF EXISTS "Users can insert quote notes" ON public.quote_notes;
DROP POLICY IF EXISTS "Users can update quote notes" ON public.quote_notes;
DROP POLICY IF EXISTS "Users can delete quote notes" ON public.quote_notes;
DROP POLICY IF EXISTS "Public can view quote notes" ON public.quote_notes;
DROP POLICY IF EXISTS "Public can insert quote notes" ON public.quote_notes;
DROP POLICY IF EXISTS "Public can update quote notes" ON public.quote_notes;
DROP POLICY IF EXISTS "Public can delete quote notes" ON public.quote_notes;

CREATE POLICY "Admins can manage quote notes"
  ON public.quote_notes FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============= quote_versions: restrict INSERT to admin =============
DROP POLICY IF EXISTS "Allow insert quote versions" ON public.quote_versions;
CREATE POLICY "Admins can insert quote versions"
  ON public.quote_versions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- ============= quote_payments: admin-only access; client confirmation via RPC =============
DROP POLICY IF EXISTS "Allow public read for quote payments" ON public.quote_payments;
DROP POLICY IF EXISTS "Allow public insert for payment tracking" ON public.quote_payments;
DROP POLICY IF EXISTS "Allow public update for payment status" ON public.quote_payments;
DROP POLICY IF EXISTS "Allow public confirmation update" ON public.quote_payments;

CREATE POLICY "Admins can view quote payments"
  ON public.quote_payments FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert quote payments"
  ON public.quote_payments FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update quote payments"
  ON public.quote_payments FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.confirm_quote_payment(p_payment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_found boolean;
BEGIN
  UPDATE public.quote_payments
  SET client_confirmed_at = COALESCE(client_confirmed_at, now())
  WHERE id = p_payment_id;
  GET DIAGNOSTICS v_found = ROW_COUNT;
  RETURN v_found > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_quote_payment(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.confirm_quote_payment(uuid) TO anon, authenticated;

-- ============= short_links: remove broad update; RPC for click count =============
DROP POLICY IF EXISTS "Public can increment click count" ON public.short_links;

CREATE OR REPLACE FUNCTION public.increment_short_link_click(p_code text)
RETURNS TABLE (destination_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.short_links
  SET click_count = COALESCE(click_count, 0) + 1
  WHERE code = p_code
  RETURNING short_links.destination_url;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_short_link_click(text) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_short_link_click(text) TO anon, authenticated;

-- ============= pending_invitations: token-only lookup via RPC =============
DROP POLICY IF EXISTS "Public can view invitation by token" ON public.pending_invitations;

CREATE OR REPLACE FUNCTION public.verify_invitation_token(p_token text)
RETURNS TABLE (email text, role text, invited_by_email text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT pi.email, pi.role::text, pi.invited_by_email, pi.expires_at
  FROM public.pending_invitations pi
  WHERE pi.token = p_token
    AND pi.expires_at > now()
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_invitation_token(text) FROM public;
GRANT EXECUTE ON FUNCTION public.verify_invitation_token(text) TO anon, authenticated;

-- ============= proposal_pdf_downloads: admins only =============
DROP POLICY IF EXISTS "Authenticated users can view pdf downloads" ON public.proposal_pdf_downloads;
CREATE POLICY "Admins can view pdf downloads"
  ON public.proposal_pdf_downloads FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============= investor_leads: restrict to admin + super_admin =============
DROP POLICY IF EXISTS "Admins can view investor leads" ON public.investor_leads;
CREATE POLICY "Admins and super admins can view investor leads"
  ON public.investor_leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin'::app_role, 'super_admin'::app_role)
    )
  );

-- ============= ghl_submissions / ghl_sync_history / partner_chat_sessions =============
-- Remove permissive {public} update policies; service role bypasses RLS anyway.
DROP POLICY IF EXISTS "Service role can update ghl submissions" ON public.ghl_submissions;
DROP POLICY IF EXISTS "Service role can update ghl sync history" ON public.ghl_sync_history;
DROP POLICY IF EXISTS "Service role can update partner chat sessions" ON public.partner_chat_sessions;

CREATE POLICY "Admins can update ghl submissions"
  ON public.ghl_submissions FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update ghl sync history"
  ON public.ghl_sync_history FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update partner chat sessions"
  ON public.partner_chat_sessions FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
