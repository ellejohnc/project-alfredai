
-- Allow any authenticated user to SELECT their own admin_users row
CREATE POLICY "Users can view own admin record"
ON public.admin_users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Backfill last_login_at from auth.users for any admin_users that have null last_login_at
UPDATE public.admin_users au
SET last_login_at = u.last_sign_in_at
FROM auth.users u
WHERE au.id = u.id
  AND au.last_login_at IS NULL
  AND u.last_sign_in_at IS NOT NULL;
