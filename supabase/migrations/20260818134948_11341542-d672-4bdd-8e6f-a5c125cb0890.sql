DROP POLICY IF EXISTS "Super admins and admins can update admin users" ON public.admin_users;

CREATE POLICY "Super admins and admins can update admin users"
ON public.admin_users
FOR UPDATE
USING (
  is_super_admin(auth.uid())
  OR (
    has_role(auth.uid(), 'admin'::app_role)
    AND role <> 'super_admin'::app_role
  )
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR (
    has_role(auth.uid(), 'admin'::app_role)
    AND (role <> ALL (ARRAY['admin'::app_role, 'super_admin'::app_role]))
  )
);