-- Drop the existing SELECT policy and create a better one using is_admin
DROP POLICY IF EXISTS "Admins can view leads" ON public.leads;

CREATE POLICY "Admins and super admins can view leads" 
ON public.leads 
FOR SELECT 
USING (is_admin(auth.uid()));