-- 1. Restrict Alpha Digital lead PII to full admins only
DROP POLICY IF EXISTS "Lead viewers can read alpha digital leads" ON public.alpha_digital_leads;
CREATE POLICY "Full admins can read alpha digital leads"
ON public.alpha_digital_leads FOR SELECT
TO authenticated
USING (is_full_admin(auth.uid()));

-- 2. Restrict Meta lead PII to full admins only
DROP POLICY IF EXISTS "Staff can view meta leads" ON public.meta_leads;
CREATE POLICY "Full admins can view meta leads"
ON public.meta_leads FOR SELECT
TO authenticated
USING (is_full_admin(auth.uid()));

-- 3. Allow service_role to manage investor verification codes
DROP POLICY IF EXISTS "Service role can manage verification codes" ON public.investor_verification_codes;
CREATE POLICY "Service role can manage verification codes"
ON public.investor_verification_codes FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 4. Hide invitation token column from client-readable SELECT
REVOKE SELECT ON public.pending_invitations FROM authenticated;
GRANT SELECT (id, email, role, invited_by, invited_by_email, expires_at, created_at)
ON public.pending_invitations TO authenticated;

-- 5. Hide OAuth access/refresh tokens from client-readable SELECT
REVOKE SELECT ON public.user_google_connections FROM authenticated;
GRANT SELECT (id, user_id, google_email, google_name, token_expires_at, scopes, connected_at, updated_at)
ON public.user_google_connections TO authenticated;

-- 6. Set immutable search_path on email queue helper functions
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;