-- Drop the restrictive "block all reads" policy
DROP POLICY IF EXISTS "Block public reads on leads" ON public.leads;

-- Create a policy allowing admins to view leads
CREATE POLICY "Admins can view leads"
ON public.leads
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));