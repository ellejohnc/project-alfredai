-- Allow service role to update ghl_submissions for webhook processing
-- This policy allows updates from the ghl-webhook edge function (which uses service role)
DROP POLICY IF EXISTS "Block updates on ghl_submissions" ON public.ghl_submissions;

CREATE POLICY "Service role can update ghl_submissions" 
ON public.ghl_submissions 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Also allow updates on ghl_sync_history for the deletion sync
DROP POLICY IF EXISTS "Block updates on ghl_sync_history" ON public.ghl_sync_history;

CREATE POLICY "Service role can update ghl_sync_history" 
ON public.ghl_sync_history 
FOR UPDATE 
USING (true)
WITH CHECK (true);