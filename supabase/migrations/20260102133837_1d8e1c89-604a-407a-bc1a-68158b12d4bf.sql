-- Allow admins to delete leads
DROP POLICY IF EXISTS "Block deletes on leads" ON public.leads;

CREATE POLICY "Admins can delete leads" 
ON public.leads 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Allow admins to delete GHL submissions
DROP POLICY IF EXISTS "Block deletes on ghl_submissions" ON public.ghl_submissions;

CREATE POLICY "Admins can delete ghl_submissions" 
ON public.ghl_submissions 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Allow admins to delete related GHL sync history when submission is deleted
DROP POLICY IF EXISTS "Block deletes on ghl_sync_history" ON public.ghl_sync_history;

CREATE POLICY "Admins can delete ghl_sync_history" 
ON public.ghl_sync_history 
FOR DELETE 
USING (is_admin(auth.uid()));