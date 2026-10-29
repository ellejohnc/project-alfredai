
-- 1. Fix SECURITY DEFINER view: bounce_funnel
ALTER VIEW public.bounce_funnel SET (security_invoker = true);

-- 2. Remove public INSERT policy on meeting_history (service role bypasses RLS)
DROP POLICY IF EXISTS "Service role can insert meeting history" ON public.meeting_history;

-- 3. Restrict proposal_pdf_downloads INSERT to admins/service role only
DROP POLICY IF EXISTS "Authenticated users can insert pdf downloads" ON public.proposal_pdf_downloads;
CREATE POLICY "Admins can insert pdf downloads"
ON public.proposal_pdf_downloads
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- 4. Restrict investor_leads SELECT: remove sales_rep access (admin/super_admin policy already exists)
DROP POLICY IF EXISTS "Lead roles can view investor leads" ON public.investor_leads;

-- 5. Hide created_by column on short_links from public/authenticated; keep redirect lookups working
REVOKE SELECT (created_by) ON public.short_links FROM anon, authenticated;
