-- Drop existing SELECT policy and create a more restrictive one
DROP POLICY IF EXISTS "Super admins and admins can view admin users" ON public.admin_users;

-- Only super_admins can view all admin users
CREATE POLICY "Only super admins can view admin users" 
ON public.admin_users 
FOR SELECT 
USING (is_super_admin(auth.uid()));

-- Also update INSERT, UPDATE, DELETE to super_admin only for consistency
DROP POLICY IF EXISTS "Super admins and admins can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins and admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can delete any user, admins can delete non-admins" ON public.admin_users;

CREATE POLICY "Only super admins can insert admin users" 
ON public.admin_users 
FOR INSERT 
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Only super admins can update admin users" 
ON public.admin_users 
FOR UPDATE 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Only super admins can delete admin users" 
ON public.admin_users 
FOR DELETE 
USING (is_super_admin(auth.uid()));