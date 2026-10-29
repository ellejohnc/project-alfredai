CREATE OR REPLACE FUNCTION public.get_distributor_dashboard_stats()
RETURNS TABLE(
  assigned_leads bigint,
  active_opportunities bigint,
  closed_deals bigint,
  personal_revenue numeric,
  pipeline_value numeric,
  follow_up_tasks bigint,
  conversion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_total_quotes bigint;
  v_won bigint;
BEGIN
  IF NOT public.is_distributor(v_uid) THEN
    RAISE EXCEPTION 'Access denied: Distributor role required';
  END IF;

  SELECT COUNT(*) INTO assigned_leads
  FROM public.leads l
  WHERE l.assigned_distributor_id = v_uid OR l.created_by_user_id = v_uid
     OR public.is_record_collaborator('lead', l.id, v_uid);

  SELECT
    COUNT(*) FILTER (WHERE COALESCE(q.status,'') NOT IN ('signed','accepted','closed','rejected','declined')),
    COUNT(*) FILTER (WHERE COALESCE(q.status,'') IN ('signed','accepted','closed')),
    COUNT(*)
  INTO active_opportunities, closed_deals, v_total_quotes
  FROM public.quotes q
  WHERE q.assigned_distributor_id = v_uid OR q.created_by_user_id = v_uid
     OR public.is_record_collaborator('quote', q.id, v_uid);

  v_won := closed_deals;

  SELECT COALESCE(SUM(qp.amount), 0) INTO personal_revenue
  FROM public.quote_payments qp
  WHERE qp.client_confirmed_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id::text = qp.quote_id
        AND (q.assigned_distributor_id = v_uid OR q.created_by_user_id = v_uid
          OR public.is_record_collaborator('quote', q.id, v_uid))
    );

  SELECT COALESCE(SUM(qp.amount), 0) INTO pipeline_value
  FROM public.quote_payments qp
  WHERE qp.client_confirmed_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id::text = qp.quote_id
        AND (q.assigned_distributor_id = v_uid OR q.created_by_user_id = v_uid
          OR public.is_record_collaborator('quote', q.id, v_uid))
    );

  SELECT COUNT(*) INTO follow_up_tasks
  FROM public.handover_requests h
  WHERE (h.assigned_distributor_id = v_uid OR h.created_by_user_id = v_uid)
    AND COALESCE(h.status,'pending') <> 'completed';

  personal_revenue := ROUND(COALESCE(personal_revenue, 0), 0);
  pipeline_value := ROUND(COALESCE(pipeline_value, 0), 0);
  conversion_rate := CASE WHEN v_total_quotes > 0
    THEN ROUND((v_won::numeric / v_total_quotes::numeric) * 100, 0)
    ELSE 0 END;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.get_distributor_dashboard_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_distributor_dashboard_stats() TO authenticated;