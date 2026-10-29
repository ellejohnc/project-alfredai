
-- 1. Remove permissive "Service role can update" policies (service_role bypasses RLS already)
DROP POLICY IF EXISTS "Service role can update ghl_submissions" ON public.ghl_submissions;
DROP POLICY IF EXISTS "Service role can update ghl_sync_history" ON public.ghl_sync_history;

-- 2. Restrict investor_leads UPDATE/DELETE to admin/super_admin only (exclude sales_rep)
DROP POLICY IF EXISTS "Lead roles can update investor leads" ON public.investor_leads;
DROP POLICY IF EXISTS "Lead roles can delete investor leads" ON public.investor_leads;

CREATE POLICY "Admins can update investor leads"
  ON public.investor_leads
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = ANY (ARRAY['admin'::app_role, 'super_admin'::app_role])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = ANY (ARRAY['admin'::app_role, 'super_admin'::app_role])
    )
  );

CREATE POLICY "Admins can delete investor leads"
  ON public.investor_leads
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = ANY (ARRAY['admin'::app_role, 'super_admin'::app_role])
    )
  );

-- 3. page_engagement: replace open public UPDATE with a session-scoped RPC
DROP POLICY IF EXISTS "Anyone can update own page engagement" ON public.page_engagement;

CREATE OR REPLACE FUNCTION public.update_page_engagement(
  p_id uuid,
  p_session_id text,
  p_last_active_at timestamptz,
  p_max_scroll_pct integer,
  p_primary_cta_clicks jsonb,
  p_exit_section text,
  p_engaged boolean,
  p_bounced boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.page_engagement
  SET
    last_active_at = COALESCE(p_last_active_at, last_active_at),
    max_scroll_pct = GREATEST(COALESCE(max_scroll_pct, 0), COALESCE(p_max_scroll_pct, 0)),
    primary_cta_clicks = COALESCE(p_primary_cta_clicks, primary_cta_clicks),
    exit_section = COALESCE(p_exit_section, exit_section),
    engaged = COALESCE(p_engaged, engaged),
    bounced = COALESCE(p_bounced, bounced)
  WHERE id = p_id
    AND session_id = p_session_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_page_engagement(uuid, text, timestamptz, integer, jsonb, text, boolean, boolean) TO anon, authenticated;

-- 4. quote_payments: remove blanket authenticated SELECT (admin-scoped policy remains)
DROP POLICY IF EXISTS "Authenticated users can read payments" ON public.quote_payments;

-- 5. Recreate bounce_funnel view with security_invoker so it respects caller's RLS
DROP VIEW IF EXISTS public.bounce_funnel;
CREATE VIEW public.bounce_funnel
WITH (security_invoker = true)
AS
SELECT date_trunc('day'::text, landed_at)::date AS day,
       COALESCE(device, 'unknown'::text) AS device,
       count(*) AS sessions,
       count(*) FILTER (WHERE bounced) AS bounces,
       round(100.0 * count(*) FILTER (WHERE bounced)::numeric / NULLIF(count(*), 0)::numeric, 1) AS bounce_rate,
       count(*) FILTER (WHERE ((primary_cta_clicks ->> 'hero_try_demo'::text)::integer) > 0 OR ((primary_cta_clicks ->> 'sticky_try_demo'::text)::integer) > 0 OR ((primary_cta_clicks ->> 'final_try_demo'::text)::integer) > 0) AS demo_clicks,
       count(*) FILTER (WHERE ((primary_cta_clicks ->> 'hero_book'::text)::integer) > 0 OR ((primary_cta_clicks ->> 'sticky_book'::text)::integer) > 0 OR ((primary_cta_clicks ->> 'final_book'::text)::integer) > 0) AS book_clicks,
       round(avg(max_scroll_pct), 1) AS avg_scroll_pct,
       round(avg(EXTRACT(epoch FROM last_active_at - landed_at)), 1) AS avg_seconds_on_page
  FROM public.page_engagement
 GROUP BY (date_trunc('day'::text, landed_at)::date), (COALESCE(device, 'unknown'::text))
 ORDER BY (date_trunc('day'::text, landed_at)::date) DESC;
