-- Update user_roles policies to super_admin only as well
DROP POLICY IF EXISTS "Super admins and admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins and admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins and admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can delete any role, admins can delete non-admin r" ON public.user_roles;

CREATE POLICY "Only super admins can view roles" 
ON public.user_roles 
FOR SELECT 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Only super admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Only super admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Only super admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (is_super_admin(auth.uid()));