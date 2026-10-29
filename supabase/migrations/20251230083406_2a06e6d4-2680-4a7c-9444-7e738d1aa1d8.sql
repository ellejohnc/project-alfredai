-- Drop the current SELECT policy
DROP POLICY IF EXISTS "Users can view admin users with restrictions" ON public.admin_users;

-- Create a stricter policy - only admins can view admin users
CREATE POLICY "Only admins can view admin users"
ON public.admin_users
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));