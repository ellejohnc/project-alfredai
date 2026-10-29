
-- Helper getters (SECURITY DEFINER, avoid recursive RLS in policy checks)
CREATE OR REPLACE FUNCTION public.admin_users_stored_role(_id uuid)
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.admin_users WHERE id = _id
$$;

CREATE OR REPLACE FUNCTION public.admin_users_stored_email(_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT email FROM public.admin_users WHERE id = _id
$$;

CREATE OR REPLACE FUNCTION public.partner_profile_flag(_user_id uuid, _flag text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN _flag = 'is_admin' THEN is_admin ELSE is_approved END
  FROM public.partner_profiles WHERE user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.diy_request_stored_status(_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT status FROM public.diy_access_requests WHERE id = _id
$$;

CREATE OR REPLACE FUNCTION public.diy_request_stored_reviewer(_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT reviewed_by FROM public.diy_access_requests WHERE id = _id
$$;

-- 1. admin_users: self-update limited to non-privileged columns
DROP POLICY IF EXISTS "Users can update own last_login_at" ON public.admin_users;
CREATE POLICY "Users can update own last_login_at"
ON public.admin_users FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND role IS NOT DISTINCT FROM public.admin_users_stored_role(auth.uid())
  AND email IS NOT DISTINCT FROM public.admin_users_stored_email(auth.uid())
);

-- 2. partner_profiles: partners cannot self-grant is_admin / is_approved
DROP POLICY IF EXISTS "Partners update own profile" ON public.partner_profiles;
CREATE POLICY "Partners update own profile"
ON public.partner_profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.is_partner_admin(auth.uid()))
WITH CHECK (
  public.is_partner_admin(auth.uid())
  OR (
    auth.uid() = user_id
    AND is_admin IS NOT DISTINCT FROM public.partner_profile_flag(auth.uid(), 'is_admin')
    AND is_approved IS NOT DISTINCT FROM public.partner_profile_flag(auth.uid(), 'is_approved')
  )
);

-- 3. diy_access_requests: requesters cannot self-approve
DROP POLICY IF EXISTS "Users update own diy request or admins update all" ON public.diy_access_requests;
CREATE POLICY "Users update own diy request or admins update all"
ON public.diy_access_requests FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_partner_admin(auth.uid()))
WITH CHECK (
  public.is_partner_admin(auth.uid())
  OR (
    user_id = auth.uid()
    AND status IS NOT DISTINCT FROM public.diy_request_stored_status(id)
    AND reviewed_by IS NOT DISTINCT FROM public.diy_request_stored_reviewer(id)
  )
);
