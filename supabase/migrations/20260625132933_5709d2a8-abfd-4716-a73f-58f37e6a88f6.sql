-- Partner Portal schema

-- Profiles for consulting partners
CREATE TABLE public.partner_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  company TEXT,
  territory TEXT NOT NULL DEFAULT 'ANZ' CHECK (territory IN ('US','CA','ANZ')),
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  onboarding JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_profiles TO authenticated;
GRANT ALL ON public.partner_profiles TO service_role;

ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;

-- Security definer admin check (avoids recursive policy)
CREATE OR REPLACE FUNCTION public.is_partner_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.partner_profiles
    WHERE user_id = _user_id AND is_admin = true
  )
$$;

-- Partners manage their own profile; admins read all
CREATE POLICY "Partners view own profile"
  ON public.partner_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_partner_admin(auth.uid()));

CREATE POLICY "Partners insert own profile"
  ON public.partner_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Partners can update their own non-privileged fields; admins can update anything
CREATE POLICY "Partners update own profile"
  ON public.partner_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_partner_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_partner_admin(auth.uid()));

-- Prevent self-escalation: partners cannot change their own is_approved/is_admin
CREATE OR REPLACE FUNCTION public.protect_partner_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_partner_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  NEW.is_approved := OLD.is_approved;
  NEW.is_admin := OLD.is_admin;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_partner_privileges_trg
  BEFORE UPDATE ON public.partner_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_partner_privileges();

CREATE TRIGGER partner_profiles_updated_at
  BEFORE UPDATE ON public.partner_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Deals
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  description TEXT,
  setup_fee NUMERIC NOT NULL DEFAULT 0,
  monthly_fee NUMERIC NOT NULL DEFAULT 0,
  territory TEXT NOT NULL DEFAULT 'ANZ' CHECK (territory IN ('US','CA','ANZ')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','won','lost')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;
GRANT ALL ON public.deals TO service_role;

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners view own deals"
  ON public.deals FOR SELECT TO authenticated
  USING (auth.uid() = partner_id OR public.is_partner_admin(auth.uid()));

CREATE POLICY "Partners insert own deals"
  ON public.deals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = partner_id);

CREATE POLICY "Partners update own deals"
  ON public.deals FOR UPDATE TO authenticated
  USING (auth.uid() = partner_id OR public.is_partner_admin(auth.uid()))
  WITH CHECK (auth.uid() = partner_id OR public.is_partner_admin(auth.uid()));

CREATE POLICY "Partners delete own deals"
  ON public.deals FOR DELETE TO authenticated
  USING (auth.uid() = partner_id OR public.is_partner_admin(auth.uid()));