-- Strip sensitive sales/meeting intelligence from distributor access to quotes.
-- Distributors retain access to all operational columns via a safe view.

-- 1. Safe view excluding sensitive columns, authorised for admins and assigned distributors.
CREATE OR REPLACE VIEW public.quotes_distributor_safe
WITH (security_invoker = off) AS
SELECT
  id, created_at, updated_at, created_by, company_name, contact_name, contact_email,
  industry, team_size, workflows, challenges, timeline, setup_fee_min, setup_fee_max,
  monthly_retainer_min, monthly_retainer_max, roi_conservative, roi_likely, roi_best,
  payback_months_conservative, payback_months_likely, payback_months_best, status, outcome,
  quote_id, voice_agent_plan, voice_agent_monthly_cost, voice_agent_setup_cost,
  voice_agent_addons, voice_agent_workflow_count, access_code, current_tech_stack,
  signed_at, signed_by_name, signed_by_email, signature_ip_hash, handover_triggered_at,
  handover_status, last_edited_at, last_edited_by, setup_fee_final, monthly_retainer_final,
  poc_requested, pricing_option, bundle_pricing, contract_months,
  assigned_distributor_id, created_by_user_id
FROM public.quotes q
WHERE
  public.is_admin(auth.uid())
  OR (
    public.is_distributor(auth.uid())
    AND public.distributor_can_access(q.assigned_distributor_id, q.created_by_user_id, 'quote', q.id)
  );

GRANT SELECT ON public.quotes_distributor_safe TO authenticated;

-- 2. Remove the distributor full-row SELECT policy on the base table (was exposing
--    meeting_transcript, transcript_summary, sentiment_analysis, handover_notes, notes).
DROP POLICY IF EXISTS "Distributors can view assigned quotes" ON public.quotes;
