-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.activity_logs;

-- Create new INSERT policy that ensures admins can only log their own activities
CREATE POLICY "Admins can only log their own activities" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK (
  is_admin(auth.uid()) 
  AND user_id = auth.uid()
);

-- Ensure UPDATE is explicitly blocked (defense in depth)
DROP POLICY IF EXISTS "Block updates on activity_logs" ON public.activity_logs;
CREATE POLICY "Block updates on activity_logs" 
ON public.activity_logs 
FOR UPDATE 
USING (false);

-- Ensure DELETE is explicitly blocked (defense in depth)
DROP POLICY IF EXISTS "Block deletes on activity_logs" ON public.activity_logs;
CREATE POLICY "Block deletes on activity_logs" 
ON public.activity_logs 
FOR DELETE 
USING (false);