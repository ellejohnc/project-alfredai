-- Fix email_templates public read policy - restrict to admins only
DROP POLICY IF EXISTS "Public can read email templates" ON public.email_templates;

-- Only admins should be able to read email templates
-- The existing "Admins can view email templates" policy already covers this