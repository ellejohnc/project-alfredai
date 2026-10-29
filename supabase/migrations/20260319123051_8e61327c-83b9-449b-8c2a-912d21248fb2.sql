-- Allow admins to update leads (for archiving via tidy-up)
DROP POLICY IF EXISTS "Block updates on leads" ON public.leads;

CREATE POLICY "Admins can update leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Block non-admin updates on leads"
ON public.leads
FOR UPDATE
TO anon
USING (false);