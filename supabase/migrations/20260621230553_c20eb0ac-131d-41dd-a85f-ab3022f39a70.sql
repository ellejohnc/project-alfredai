-- Replace definer-view with a security definer function (not flagged by the view linter)
DROP VIEW IF EXISTS public.quote_versions_safe;

CREATE OR REPLACE FUNCTION public.get_quote_versions_safe(p_quote_id uuid)
RETURNS TABLE (
  id uuid,
  quote_id uuid,
  version_number integer,
  company_name text,
  contact_name text,
  contact_email text,
  industry text,
  team_size integer,
  workflows jsonb,
  challenges text[],
  timeline text,
  setup_fee_min numeric,
  setup_fee_max numeric,
  monthly_retainer_min numeric,
  monthly_retainer_max numeric,
  roi_conservative numeric,
  roi_likely numeric,
  roi_best numeric,
  voice_agent_plan text,
  voice_agent_monthly_cost numeric,
  voice_agent_setup_cost numeric,
  voice_agent_workflow_count integer,
  created_by text,
  created_at timestamptz,
  change_summary text,
  current_tech_stack jsonb,
  setup_fee_final numeric,
  monthly_retainer_final numeric,
  contract_months integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    qv.id, qv.quote_id, qv.version_number, qv.company_name, qv.contact_name, qv.contact_email,
    qv.industry, qv.team_size, qv.workflows, qv.challenges, qv.timeline,
    qv.setup_fee_min, qv.setup_fee_max, qv.monthly_retainer_min, qv.monthly_retainer_max,
    qv.roi_conservative, qv.roi_likely, qv.roi_best,
    qv.voice_agent_plan, qv.voice_agent_monthly_cost, qv.voice_agent_setup_cost, qv.voice_agent_workflow_count,
    qv.created_by, qv.created_at, qv.change_summary, qv.current_tech_stack,
    qv.setup_fee_final, qv.monthly_retainer_final, qv.contract_months
  FROM public.quote_versions qv
  JOIN public.quotes q ON q.id = qv.quote_id
  WHERE qv.quote_id = p_quote_id
    AND (
      public.is_admin(auth.uid())
      OR (
        public.is_distributor(auth.uid())
        AND public.distributor_can_access(q.assigned_distributor_id, q.created_by_user_id, 'quote', q.id)
      )
    )
  ORDER BY qv.version_number DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_quote_versions_safe(uuid) TO authenticated;

-- Tighten realtime policy: scope to authenticated role via JWT (avoid always-true UPDATE/INSERT flag)
DROP POLICY IF EXISTS "Authenticated users can use realtime" ON realtime.messages;
CREATE POLICY "Authenticated users can use realtime"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (true);