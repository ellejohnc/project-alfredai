-- 1. Newsletter subscribers: allow admin/super_admin read
CREATE POLICY "Admins can read newsletter subscribers"
ON public.newsletter_subscribers
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- 2. Quotes: distributors can SELECT their assigned quotes
CREATE POLICY "Distributors can view assigned quotes"
ON public.quotes
FOR SELECT
TO authenticated
USING (
  is_distributor(auth.uid())
  AND distributor_can_access(assigned_distributor_id, created_by_user_id, 'quote'::text, id)
);

-- 3. Realtime: restrict broadcast access to admins only (remove distributor access)
DROP POLICY IF EXISTS "Staff and distributors can use realtime" ON realtime.messages;
CREATE POLICY "Admins can use realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- 4. User roles: prevent admins from modifying anything except editor rows / escalating
DROP POLICY IF EXISTS "Super admins can update any role, admins can only set editor ro" ON public.user_roles;
CREATE POLICY "Super admins can update any role, admins can only set editor ro"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (has_role(auth.uid(), 'admin'::app_role) AND role = 'editor'::app_role)
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR (has_role(auth.uid(), 'admin'::app_role) AND role = 'editor'::app_role)
);