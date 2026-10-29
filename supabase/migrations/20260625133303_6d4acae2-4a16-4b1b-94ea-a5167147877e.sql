CREATE OR REPLACE FUNCTION public.handle_new_partner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.raw_user_meta_data->>'partner_signup') = 'true' THEN
    INSERT INTO public.partner_profiles (user_id, full_name, company, territory)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Partner'),
      NEW.raw_user_meta_data->>'company',
      COALESCE(NEW.raw_user_meta_data->>'territory', 'ANZ')
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_partner
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_partner();