
-- Allow any authenticated admin_user to update their own last_login_at
CREATE POLICY "Users can update own last_login_at"
ON public.admin_users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Also create a function+trigger to auto-update last_login_at via auth.users sign-in
CREATE OR REPLACE FUNCTION public.handle_admin_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
    UPDATE public.admin_users
    SET last_login_at = NEW.last_sign_in_at
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Note: We cannot attach triggers to auth.users (reserved schema).
-- So the self-update RLS policy is the primary fix.
-- Drop the function since we can't use it on auth schema.
DROP FUNCTION IF EXISTS public.handle_admin_login();
