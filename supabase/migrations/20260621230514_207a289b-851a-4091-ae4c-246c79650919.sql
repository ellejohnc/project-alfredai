-- 1. quote_versions: remove distributor full-row access, add sanitized view
DROP POLICY IF EXISTS "Distributors can view versions of accessible quotes" ON public.quote_versions;

CREATE OR REPLACE VIEW public.quote_versions_safe
WITH (security_invoker = off) AS
  SELECT
    id, quote_id, version_number, company_name, contact_name, contact_email,
    industry, team_size, workflows, challenges, timeline,
    setup_fee_min, setup_fee_max, monthly_retainer_min, monthly_retainer_max,
    roi_conservative, roi_likely, roi_best,
    voice_agent_plan, voice_agent_monthly_cost, voice_agent_setup_cost, voice_agent_workflow_count,
    created_by, created_at, change_summary, current_tech_stack,
    setup_fee_final, monthly_retainer_final, contract_months
  FROM public.quote_versions qv
  WHERE EXISTS (
    SELECT 1 FROM public.quotes q
    WHERE q.id = qv.quote_id
      AND (
        public.is_admin(auth.uid())
        OR (
          public.is_distributor(auth.uid())
          AND public.distributor_can_access(q.assigned_distributor_id, q.created_by_user_id, 'quote', q.id)
        )
      )
  );

GRANT SELECT ON public.quote_versions_safe TO authenticated;

-- 2. Realtime: restrict realtime.messages to authenticated sessions only
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can use realtime" ON realtime.messages;
CREATE POLICY "Authenticated users can use realtime"
  ON realtime.messages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. resumes bucket: add admin-only UPDATE policy
DROP POLICY IF EXISTS "Admins can update resumes" ON storage.objects;
CREATE POLICY "Admins can update resumes"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'resumes' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'resumes' AND public.is_admin(auth.uid()));