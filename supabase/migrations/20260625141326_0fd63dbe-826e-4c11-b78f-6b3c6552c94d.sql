
CREATE OR REPLACE FUNCTION public.is_partner_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.partner_profiles
    WHERE user_id = _user_id AND is_admin = true
  )
  OR public.has_role(_user_id, 'admin'::app_role)
  OR public.has_role(_user_id, 'super_admin'::app_role);
$$;
