-- Tighten SELECT to full admins only (admin/super_admin), removing editor/sales_rep access.

DROP POLICY IF EXISTS "Admins can view FAQ engagement" ON public.faq_engagement;
CREATE POLICY "Admins can view FAQ engagement" ON public.faq_engagement
  FOR SELECT TO authenticated USING (public.is_full_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view page engagement" ON public.page_engagement;
CREATE POLICY "Admins can view page engagement" ON public.page_engagement
  FOR SELECT TO authenticated USING (public.is_full_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view investor page views" ON public.investor_page_views;
CREATE POLICY "Admins can view investor page views" ON public.investor_page_views
  FOR SELECT TO authenticated USING (public.is_full_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view webhook logs" ON public.webhook_logs;
CREATE POLICY "Admins can view webhook logs" ON public.webhook_logs
  FOR SELECT TO authenticated USING (public.is_full_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view investor code usage" ON public.investor_code_usage;
CREATE POLICY "Admins can view investor code usage" ON public.investor_code_usage
  FOR SELECT TO authenticated USING (public.is_full_admin(auth.uid()));