-- Update the is_admin function to include super_admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin', 'editor', 'super_admin')
  )
$$;

-- Create a function to check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = 'super_admin'
  )
$$;

-- Update admin_users policies to allow super_admin full access
DROP POLICY IF EXISTS "Admins can manage admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Only admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins and admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins and admins can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins and admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can delete any user, admins can delete non-admins" ON public.admin_users;

-- Super admins can do everything, admins can manage users
CREATE POLICY "Super admins and admins can view admin users"
ON public.admin_users
FOR SELECT
USING (
  is_super_admin(auth.uid()) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Super admins and admins can insert admin users"
ON public.admin_users
FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid()) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Super admins and admins can update admin users"
ON public.admin_users
FOR UPDATE
USING (
  is_super_admin(auth.uid()) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Super admins can delete any user, admins can delete non-admins"
ON public.admin_users
FOR DELETE
USING (
  is_super_admin(auth.uid())
  OR (
    has_role(auth.uid(), 'admin'::app_role) 
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = admin_users.id 
      AND role::text IN ('admin', 'super_admin')
    )
  )
);

-- Update user_roles policies for super_admin
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins and admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins and admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins and admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can delete any role, admins can delete non-admin roles" ON public.user_roles;

CREATE POLICY "Super admins and admins can view all roles"
ON public.user_roles
FOR SELECT
USING (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admins and admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admins and admins can update roles"
ON public.user_roles
FOR UPDATE
USING (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admins can delete any role, admins can delete non-admin roles"
ON public.user_roles
FOR DELETE
USING (
  is_super_admin(auth.uid())
  OR (
    has_role(auth.uid(), 'admin'::app_role) 
    AND role::text NOT IN ('admin', 'super_admin')
  )
);