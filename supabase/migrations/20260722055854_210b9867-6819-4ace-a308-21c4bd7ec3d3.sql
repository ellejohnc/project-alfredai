
-- 1) lead_notes: full-admin only
DROP POLICY IF EXISTS "Lead viewers can view notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Lead viewers can create notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Lead viewers can delete notes" ON public.lead_notes;

CREATE POLICY "Full admins can view notes"
  ON public.lead_notes FOR SELECT TO authenticated
  USING (public.is_full_admin(auth.uid()));
CREATE POLICY "Full admins can create notes"
  ON public.lead_notes FOR INSERT TO authenticated
  WITH CHECK (public.is_full_admin(auth.uid()));
CREATE POLICY "Full admins can delete notes"
  ON public.lead_notes FOR DELETE TO authenticated
  USING (public.is_full_admin(auth.uid()));

-- 2) lead_annotations: full-admin only
DROP POLICY IF EXISTS "Lead viewers can view annotations" ON public.lead_annotations;
DROP POLICY IF EXISTS "Lead viewers can create annotations" ON public.lead_annotations;
DROP POLICY IF EXISTS "Lead viewers can update annotations" ON public.lead_annotations;
DROP POLICY IF EXISTS "Lead viewers can delete annotations" ON public.lead_annotations;

CREATE POLICY "Full admins can view annotations"
  ON public.lead_annotations FOR SELECT TO authenticated
  USING (public.is_full_admin(auth.uid()));
CREATE POLICY "Full admins can create annotations"
  ON public.lead_annotations FOR INSERT TO authenticated
  WITH CHECK (public.is_full_admin(auth.uid()));
CREATE POLICY "Full admins can update annotations"
  ON public.lead_annotations FOR UPDATE TO authenticated
  USING (public.is_full_admin(auth.uid()))
  WITH CHECK (public.is_full_admin(auth.uid()));
CREATE POLICY "Full admins can delete annotations"
  ON public.lead_annotations FOR DELETE TO authenticated
  USING (public.is_full_admin(auth.uid()));

-- 3) lead_merges: full-admin only
DROP POLICY IF EXISTS "Lead viewers can view merges" ON public.lead_merges;
DROP POLICY IF EXISTS "Lead viewers can create merges" ON public.lead_merges;
DROP POLICY IF EXISTS "Lead viewers can remove merges" ON public.lead_merges;

CREATE POLICY "Full admins can view merges"
  ON public.lead_merges FOR SELECT TO authenticated
  USING (public.is_full_admin(auth.uid()));
CREATE POLICY "Full admins can create merges"
  ON public.lead_merges FOR INSERT TO authenticated
  WITH CHECK (public.is_full_admin(auth.uid()));
CREATE POLICY "Full admins can remove merges"
  ON public.lead_merges FOR DELETE TO authenticated
  USING (public.is_full_admin(auth.uid()));

-- 4) meeting_history: tighten SELECT+INSERT to full admins (writes still land via
-- service-role edge functions which bypass RLS).
DROP POLICY IF EXISTS "Admins can view meeting history" ON public.meeting_history;
DROP POLICY IF EXISTS "Admins can insert meeting history" ON public.meeting_history;

CREATE POLICY "Full admins can view meeting history"
  ON public.meeting_history FOR SELECT TO authenticated
  USING (public.is_full_admin(auth.uid()));
CREATE POLICY "Full admins can insert meeting history"
  ON public.meeting_history FOR INSERT TO authenticated
  WITH CHECK (public.is_full_admin(auth.uid()));

-- 5) Least-privilege on internal SECURITY DEFINER helpers: keep authenticated
-- callers, revoke anon/public which don't need them.
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.suppress_email(text, text, uuid, text, text, integer) FROM PUBLIC, anon;
