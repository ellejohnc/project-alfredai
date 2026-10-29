
-- Helper: strict admin check (admin or super_admin only; excludes editor/sales_rep)
CREATE OR REPLACE FUNCTION public.is_full_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
      OR public.has_role(_user_id, 'super_admin'::app_role)
$$;

-- ghl_submissions: restrict admin read to full admins only
DROP POLICY IF EXISTS "Admin read access on ghl_submissions" ON public.ghl_submissions;
CREATE POLICY "Admin read access on ghl_submissions"
  ON public.ghl_submissions FOR SELECT
  USING (public.is_full_admin(auth.uid()));

-- leads: restrict PII read to full admins only (distributors keep scoped access)
DROP POLICY IF EXISTS "Lead roles can view leads" ON public.leads;
CREATE POLICY "Lead roles can view leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (public.is_full_admin(auth.uid()));

-- quote_versions: restrict read to full admins only
DROP POLICY IF EXISTS "Admins can read quote versions" ON public.quote_versions;
CREATE POLICY "Admins can read quote versions"
  ON public.quote_versions FOR SELECT
  USING (public.is_full_admin(auth.uid()));

-- quotes: split the broad ALL policy so reads are limited to full admins,
-- while writes remain available to admin-tier roles.
DROP POLICY IF EXISTS "Admins can manage quotes" ON public.quotes;
CREATE POLICY "Full admins can read quotes"
  ON public.quotes FOR SELECT
  USING (public.is_full_admin(auth.uid()));
CREATE POLICY "Admins can insert quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update quotes"
  ON public.quotes FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete quotes"
  ON public.quotes FOR DELETE
  USING (public.is_admin(auth.uid()));

-- resumes bucket: constrain uploads to the applications folder with allowed extensions
DROP POLICY IF EXISTS "Anyone can upload resumes" ON storage.objects;
CREATE POLICY "Anyone can upload resumes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = 'applications'
    AND lower(name) ~ '\.(pdf|doc|docx)$'
  );
