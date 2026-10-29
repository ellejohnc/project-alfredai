DROP VIEW IF EXISTS public.quotes_distributor_safe;

CREATE OR REPLACE FUNCTION public.get_distributor_quotes()
RETURNS TABLE(
  id uuid, created_at timestamptz, updated_at timestamptz, created_by text,
  company_name text, contact_name text, contact_email text, industry text,
  team_size integer, workflows jsonb, challenges text[], timeline text,
  setup_fee_min integer, setup_fee_max integer, monthly_retainer_min integer, monthly_retainer_max integer,
  roi_conservative numeric, roi_likely numeric, roi_best numeric,
  payback_months_conservative integer, payback_months_likely integer, payback_months_best integer,
  status text, outcome text, quote_id text, voice_agent_plan text,
  voice_agent_monthly_cost numeric, voice_agent_setup_cost numeric, voice_agent_addons jsonb,
  voice_agent_workflow_count integer, access_code text, current_tech_stack jsonb,
  signed_at timestamptz, signed_by_name text, signed_by_email text, signature_ip_hash text,
  handover_triggered_at timestamptz, handover_status text, last_edited_at timestamptz,
  last_edited_by text, setup_fee_final integer, monthly_retainer_final integer,
  poc_requested boolean, pricing_option text, bundle_pricing boolean, contract_months integer,
  assigned_distributor_id uuid, created_by_user_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    q.id, q.created_at, q.updated_at, q.created_by, q.company_name, q.contact_name, q.contact_email,
    q.industry, q.team_size, q.workflows, q.challenges, q.timeline, q.setup_fee_min, q.setup_fee_max,
    q.monthly_retainer_min, q.monthly_retainer_max, q.roi_conservative, q.roi_likely, q.roi_best,
    q.payback_months_conservative, q.payback_months_likely, q.payback_months_best, q.status, q.outcome,
    q.quote_id, q.voice_agent_plan, q.voice_agent_monthly_cost, q.voice_agent_setup_cost,
    q.voice_agent_addons, q.voice_agent_workflow_count, q.access_code, q.current_tech_stack,
    q.signed_at, q.signed_by_name, q.signed_by_email, q.signature_ip_hash, q.handover_triggered_at,
    q.handover_status, q.last_edited_at, q.last_edited_by, q.setup_fee_final, q.monthly_retainer_final,
    q.poc_requested, q.pricing_option, q.bundle_pricing, q.contract_months,
    q.assigned_distributor_id, q.created_by_user_id
  FROM public.quotes q
  WHERE
    public.is_admin(auth.uid())
    OR (
      public.is_distributor(auth.uid())
      AND public.distributor_can_access(q.assigned_distributor_id, q.created_by_user_id, 'quote', q.id)
    );
$$;

REVOKE ALL ON FUNCTION public.get_distributor_quotes() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_distributor_quotes() TO authenticated;
