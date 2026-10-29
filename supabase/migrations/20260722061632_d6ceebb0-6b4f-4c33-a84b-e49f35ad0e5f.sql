
-- lead_annotations: relax to is_admin
DROP POLICY IF EXISTS "Full admins can view annotations" ON public.lead_annotations;
DROP POLICY IF EXISTS "Full admins can create annotations" ON public.lead_annotations;
DROP POLICY IF EXISTS "Full admins can update annotations" ON public.lead_annotations;
DROP POLICY IF EXISTS "Full admins can delete annotations" ON public.lead_annotations;

CREATE POLICY "Admins can view annotations" ON public.lead_annotations
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can create annotations" ON public.lead_annotations
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update annotations" ON public.lead_annotations
  FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete annotations" ON public.lead_annotations
  FOR DELETE USING (public.is_admin(auth.uid()));

-- meeting_history: relax SELECT + INSERT to is_admin, keep update/delete blocked
DROP POLICY IF EXISTS "Full admins can view meeting history" ON public.meeting_history;
DROP POLICY IF EXISTS "Full admins can insert meeting history" ON public.meeting_history;

CREATE POLICY "Admins can view meeting history" ON public.meeting_history
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert meeting history" ON public.meeting_history
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
