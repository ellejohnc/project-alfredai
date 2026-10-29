DROP POLICY IF EXISTS "Super admins and admins can view roles" ON public.user_roles;
CREATE POLICY "Users can view own role and admins can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR is_super_admin(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE OR REPLACE FUNCTION public.can_manage_content(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin'::app_role, 'admin'::app_role, 'editor'::app_role)
  )
$$;

CREATE OR REPLACE FUNCTION public.can_view_leads(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin'::app_role, 'admin'::app_role, 'sales_rep'::app_role)
  )
$$;

CREATE OR REPLACE FUNCTION public.can_view_registrations(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin'::app_role, 'admin'::app_role)
  )
$$;

DROP POLICY IF EXISTS "Admins can manage blog posts" ON public.blog_posts;
CREATE POLICY "Content roles can manage blog posts"
ON public.blog_posts
FOR ALL
TO authenticated
USING (public.can_manage_content(auth.uid()))
WITH CHECK (public.can_manage_content(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage documentation" ON public.documentation;
CREATE POLICY "Content roles can manage documentation"
ON public.documentation
FOR ALL
TO authenticated
USING (public.can_manage_content(auth.uid()))
WITH CHECK (public.can_manage_content(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage faqs" ON public.faqs;
CREATE POLICY "Content roles can manage faqs"
ON public.faqs
FOR ALL
TO authenticated
USING (public.can_manage_content(auth.uid()))
WITH CHECK (public.can_manage_content(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage guides" ON public.guides_playbooks;
CREATE POLICY "Content roles can manage guides"
ON public.guides_playbooks
FOR ALL
TO authenticated
USING (public.can_manage_content(auth.uid()))
WITH CHECK (public.can_manage_content(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all jobs" ON public.job_openings;
CREATE POLICY "Content roles can manage jobs"
ON public.job_openings
FOR ALL
TO authenticated
USING (public.can_manage_content(auth.uid()))
WITH CHECK (public.can_manage_content(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage testimonials" ON public.testimonials;
CREATE POLICY "Content roles can manage testimonials"
ON public.testimonials
FOR ALL
TO authenticated
USING (public.can_manage_content(auth.uid()))
WITH CHECK (public.can_manage_content(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage webinars" ON public.webinars_events;
CREATE POLICY "Content roles can manage webinars"
ON public.webinars_events
FOR ALL
TO authenticated
USING (public.can_manage_content(auth.uid()))
WITH CHECK (public.can_manage_content(auth.uid()));

DROP POLICY IF EXISTS "Admins and super admins can view leads" ON public.leads;
CREATE POLICY "Lead roles can view leads"
ON public.leads
FOR SELECT
TO authenticated
USING (public.can_view_leads(auth.uid()));

DROP POLICY IF EXISTS "Admins can update leads" ON public.leads;
CREATE POLICY "Lead roles can update leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (public.can_view_leads(auth.uid()))
WITH CHECK (public.can_view_leads(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;
CREATE POLICY "Lead roles can delete leads"
ON public.leads
FOR DELETE
TO authenticated
USING (public.can_view_leads(auth.uid()));

DROP POLICY IF EXISTS "Admins can view investor leads" ON public.investor_leads;
CREATE POLICY "Lead roles can view investor leads"
ON public.investor_leads
FOR SELECT
TO authenticated
USING (public.can_view_leads(auth.uid()));

DROP POLICY IF EXISTS "Admins can update investor leads" ON public.investor_leads;
CREATE POLICY "Lead roles can update investor leads"
ON public.investor_leads
FOR UPDATE
TO authenticated
USING (public.can_view_leads(auth.uid()))
WITH CHECK (public.can_view_leads(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete investor leads" ON public.investor_leads;
CREATE POLICY "Lead roles can delete investor leads"
ON public.investor_leads
FOR DELETE
TO authenticated
USING (public.can_view_leads(auth.uid()));

DROP POLICY IF EXISTS "Admins can view registrations" ON public.event_registrations;
CREATE POLICY "Admin roles can view registrations"
ON public.event_registrations
FOR SELECT
TO authenticated
USING (public.can_view_registrations(auth.uid()));

DROP POLICY IF EXISTS "Admins can update registrations" ON public.event_registrations;
CREATE POLICY "Admin roles can update registrations"
ON public.event_registrations
FOR UPDATE
TO authenticated
USING (public.can_view_registrations(auth.uid()))
WITH CHECK (public.can_view_registrations(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete registrations" ON public.event_registrations;
CREATE POLICY "Admin roles can delete registrations"
ON public.event_registrations
FOR DELETE
TO authenticated
USING (public.can_view_registrations(auth.uid()));