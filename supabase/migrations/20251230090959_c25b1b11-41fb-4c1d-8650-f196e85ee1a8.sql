-- Update admin_users policies to allow both super_admin and admin
DROP POLICY IF EXISTS "Only super admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Only super admins can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Only super admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Only super admins can delete admin users" ON public.admin_users;

CREATE POLICY "Super admins and admins can view admin users" 
ON public.admin_users FOR SELECT 
USING (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admins and admins can insert admin users" 
ON public.admin_users FOR INSERT 
WITH CHECK (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admins and admins can update admin users" 
ON public.admin_users FOR UPDATE 
USING (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- For delete: super_admin can delete anyone, admin can only delete editors
CREATE POLICY "Super admins can delete any, admins can delete editors" 
ON public.admin_users FOR DELETE 
USING (
  is_super_admin(auth.uid()) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND role = 'editor'::app_role)
);

-- Update user_roles policies similarly
DROP POLICY IF EXISTS "Only super admins can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only super admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only super admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only super admins can delete roles" ON public.user_roles;

CREATE POLICY "Super admins and admins can view roles" 
ON public.user_roles FOR SELECT 
USING (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admins and admins can insert roles" 
ON public.user_roles FOR INSERT 
WITH CHECK (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admins and admins can update roles" 
ON public.user_roles FOR UPDATE 
USING (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- For delete: super_admin can delete any role, admin can only delete editor roles
CREATE POLICY "Super admins can delete any, admins can delete editor roles" 
ON public.user_roles FOR DELETE 
USING (
  is_super_admin(auth.uid()) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND role = 'editor'::app_role)
);