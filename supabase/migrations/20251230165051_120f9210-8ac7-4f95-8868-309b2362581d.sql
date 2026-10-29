-- Add last_login_at column to admin_users
ALTER TABLE public.admin_users
ADD COLUMN last_login_at timestamp with time zone;

-- Create function to update last login timestamp
CREATE OR REPLACE FUNCTION public.update_admin_last_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.admin_users
  SET last_login_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to update last_login_at when user signs in
-- Note: We can't directly trigger on auth.users sign-in, so we'll update via the app