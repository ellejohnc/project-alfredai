-- Drop the existing SELECT policy that allows both admins and super admins
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.activity_logs;

-- Create new SELECT policy that only allows super admins
CREATE POLICY "Only super admins can view activity logs" 
ON public.activity_logs 
FOR SELECT 
USING (is_super_admin(auth.uid()));