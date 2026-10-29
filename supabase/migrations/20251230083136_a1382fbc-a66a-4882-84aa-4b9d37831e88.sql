-- Drop the existing permissive SELECT policy
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;

-- Create a more restrictive SELECT policy
-- Admins can see all users, others can only see their own record
CREATE POLICY "Users can view admin users with restrictions"
ON public.admin_users
FOR SELECT
USING (
  -- Admins can see all admin users
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Others can only see their own record
  id = auth.uid()
);