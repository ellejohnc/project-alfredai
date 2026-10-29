-- Update the new-partner handler to auto-bootstrap the founding admin
CREATE OR REPLACE FUNCTION public.handle_new_partner()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_bootstrap boolean;
BEGIN
  v_is_bootstrap := lower(NEW.email) = 'william@alfredai.bot';

  IF (NEW.raw_user_meta_data->>'partner_signup') = 'true' OR v_is_bootstrap THEN
    INSERT INTO public.partner_profiles (user_id, full_name, company, territory, is_approved, is_admin)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Partner'),
      NEW.raw_user_meta_data->>'company',
      COALESCE(NEW.raw_user_meta_data->>'territory', 'ANZ'),
      v_is_bootstrap,
      v_is_bootstrap
    )
    ON CONFLICT (user_id) DO UPDATE
      SET is_approved = public.partner_profiles.is_approved OR v_is_bootstrap,
          is_admin = public.partner_profiles.is_admin OR v_is_bootstrap;
  END IF;
  RETURN NEW;
END;
$function$;

-- Upgrade the founding admin if they already have an account
DO $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = 'william@alfredai.bot' LIMIT 1;
  IF v_uid IS NOT NULL THEN
    INSERT INTO public.partner_profiles (user_id, full_name, territory, is_approved, is_admin)
    VALUES (v_uid, 'William Zhang', 'ANZ', true, true)
    ON CONFLICT (user_id) DO UPDATE
      SET is_approved = true, is_admin = true;
  END IF;
END $$;