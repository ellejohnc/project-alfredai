-- ============================================================
-- DISTRIBUTOR ACCESS FOUNDATION
-- ============================================================

-- 1. Ownership columns on core CRM tables
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS assigned_distributor_id uuid,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid;
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS assigned_distributor_id uuid,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid;
ALTER TABLE public.ghl_submissions
  ADD COLUMN IF NOT EXISTS assigned_distributor_id uuid,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid;
ALTER TABLE public.handover_requests
  ADD COLUMN IF NOT EXISTS assigned_distributor_id uuid,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid;

CREATE INDEX IF NOT EXISTS idx_leads_assigned_distributor ON public.leads(assigned_distributor_id);
CREATE INDEX IF NOT EXISTS idx_quotes_assigned_distributor ON public.quotes(assigned_distributor_id);
CREATE INDEX IF NOT EXISTS idx_ghl_submissions_assigned_distributor ON public.ghl_submissions(assigned_distributor_id);
CREATE INDEX IF NOT EXISTS idx_handover_requests_assigned_distributor ON public.handover_requests(assigned_distributor_id);

-- 2. Collaborators table (generic, entity-keyed)
CREATE TABLE IF NOT EXISTS public.record_collaborators (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  user_id uuid NOT NULL,
  added_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_record_collaborators_user ON public.record_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_record_collaborators_entity ON public.record_collaborators(entity_type, entity_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.record_collaborators TO authenticated;
GRANT ALL ON public.record_collaborators TO service_role;

ALTER TABLE public.record_collaborators ENABLE ROW LEVEL SECURITY;

-- 3. Helper functions
CREATE OR REPLACE FUNCTION public.is_distributor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'distributor'::app_role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_record_collaborator(_entity_type text, _entity_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.record_collaborators
    WHERE entity_type = _entity_type
      AND entity_id = _entity_id
      AND user_id = _user_id
  )
$$;

-- Bundled access check: assigned OR creator OR collaborator
CREATE OR REPLACE FUNCTION public.distributor_can_access(
  _assigned uuid, _creator uuid, _entity_type text, _entity_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    _assigned = auth.uid()
    OR _creator = auth.uid()
    OR public.is_record_collaborator(_entity_type, _entity_id, auth.uid())
$$;

-- 4. Collaborators RLS
CREATE POLICY "Admins manage collaborators"
ON public.record_collaborators FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Distributors can view their own collaborator rows"
ON public.record_collaborators FOR SELECT
USING (is_distributor(auth.uid()) AND user_id = auth.uid());

-- 5. Distributor row-scoped policies on core tables
-- LEADS
CREATE POLICY "Distributors can view assigned leads"
ON public.leads FOR SELECT
USING (is_distributor(auth.uid()) AND distributor_can_access(assigned_distributor_id, created_by_user_id, 'lead', id));

CREATE POLICY "Distributors can update assigned leads"
ON public.leads FOR UPDATE
USING (is_distributor(auth.uid()) AND distributor_can_access(assigned_distributor_id, created_by_user_id, 'lead', id))
WITH CHECK (is_distributor(auth.uid()) AND distributor_can_access(assigned_distributor_id, created_by_user_id, 'lead', id));

CREATE POLICY "Distributors can insert their own leads"
ON public.leads FOR INSERT
WITH CHECK (is_distributor(auth.uid()) AND created_by_user_id = auth.uid());

-- QUOTES
CREATE POLICY "Distributors can view assigned quotes"
ON public.quotes FOR SELECT
USING (is_distributor(auth.uid()) AND distributor_can_access(assigned_distributor_id, created_by_user_id, 'quote', id));

CREATE POLICY "Distributors can update assigned quotes"
ON public.quotes FOR UPDATE
USING (is_distributor(auth.uid()) AND distributor_can_access(assigned_distributor_id, created_by_user_id, 'quote', id))
WITH CHECK (is_distributor(auth.uid()) AND distributor_can_access(assigned_distributor_id, created_by_user_id, 'quote', id));

-- GHL SUBMISSIONS (meetings)
CREATE POLICY "Distributors can view assigned submissions"
ON public.ghl_submissions FOR SELECT
USING (is_distributor(auth.uid()) AND distributor_can_access(assigned_distributor_id, created_by_user_id, 'ghl_submission', id));

CREATE POLICY "Distributors can update assigned submissions"
ON public.ghl_submissions FOR UPDATE
USING (is_distributor(auth.uid()) AND distributor_can_access(assigned_distributor_id, created_by_user_id, 'ghl_submission', id))
WITH CHECK (is_distributor(auth.uid()) AND distributor_can_access(assigned_distributor_id, created_by_user_id, 'ghl_submission', id));

-- HANDOVER REQUESTS
CREATE POLICY "Distributors can view assigned handovers"
ON public.handover_requests FOR SELECT
USING (is_distributor(auth.uid()) AND distributor_can_access(assigned_distributor_id, created_by_user_id, 'handover', id));

-- 6. Child tables of quotes follow the parent quote access
-- NOTE: quote_payments.quote_id is TEXT, so cast q.id to text.
CREATE POLICY "Distributors can view payments of accessible quotes"
ON public.quote_payments FOR SELECT
USING (is_distributor(auth.uid()) AND EXISTS (
  SELECT 1 FROM public.quotes q
  WHERE q.id::text = quote_payments.quote_id
    AND distributor_can_access(q.assigned_distributor_id, q.created_by_user_id, 'quote', q.id)
));

CREATE POLICY "Distributors can view notes of accessible quotes"
ON public.quote_notes FOR SELECT
USING (is_distributor(auth.uid()) AND EXISTS (
  SELECT 1 FROM public.quotes q
  WHERE q.id = quote_notes.quote_id
    AND distributor_can_access(q.assigned_distributor_id, q.created_by_user_id, 'quote', q.id)
));

CREATE POLICY "Distributors can view versions of accessible quotes"
ON public.quote_versions FOR SELECT
USING (is_distributor(auth.uid()) AND EXISTS (
  SELECT 1 FROM public.quotes q
  WHERE q.id = quote_versions.quote_id
    AND distributor_can_access(q.assigned_distributor_id, q.created_by_user_id, 'quote', q.id)
));

-- 7. Trigger to stop distributors editing ownership / reassigning records
CREATE OR REPLACE FUNCTION public.protect_distributor_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF NEW.assigned_distributor_id IS DISTINCT FROM OLD.assigned_distributor_id THEN
    NEW.assigned_distributor_id := OLD.assigned_distributor_id;
  END IF;
  IF NEW.created_by_user_id IS DISTINCT FROM OLD.created_by_user_id THEN
    NEW.created_by_user_id := OLD.created_by_user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_leads_ownership
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.protect_distributor_ownership();
CREATE TRIGGER protect_quotes_ownership
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.protect_distributor_ownership();
CREATE TRIGGER protect_ghl_submissions_ownership
  BEFORE UPDATE ON public.ghl_submissions
  FOR EACH ROW EXECUTE FUNCTION public.protect_distributor_ownership();
CREATE TRIGGER protect_handover_requests_ownership
  BEFORE UPDATE ON public.handover_requests
  FOR EACH ROW EXECUTE FUNCTION public.protect_distributor_ownership();

-- 8. Distributor dashboard stats RPC (scoped to caller)
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

  conversion_rate := CASE WHEN v_total_quotes > 0
    THEN ROUND((v_won::numeric / v_total_quotes::numeric) * 100, 1)
    ELSE 0 END;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.get_distributor_dashboard_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_distributor_dashboard_stats() TO authenticated;