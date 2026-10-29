-- Extend the protection function to also cover INSERT (previously UPDATE-only)
CREATE OR REPLACE FUNCTION public.protect_partner_privileges()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Partner admins (and full admins) are trusted to set these fields.
  IF public.is_partner_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Non-admins can never self-provision elevated privileges on creation.
    NEW.is_approved := false;
    NEW.is_admin := false;
  ELSE
    -- On update, preserve the previously stored values.
    NEW.is_approved := OLD.is_approved;
    NEW.is_admin := OLD.is_admin;
  END IF;
  RETURN NEW;
END;
$function$;

-- Attach the protection to INSERT as well (UPDATE trigger already exists)
DROP TRIGGER IF EXISTS protect_partner_privileges_insert_trg ON public.partner_profiles;
CREATE TRIGGER protect_partner_privileges_insert_trg
  BEFORE INSERT ON public.partner_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_partner_privileges();

-- Tighten the INSERT policy WITH CHECK so elevated flags cannot be set at insert time
DROP POLICY IF EXISTS "Partners insert own profile" ON public.partner_profiles;
CREATE POLICY "Partners insert own profile" ON public.partner_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      public.is_partner_admin(auth.uid())
      OR (COALESCE(is_admin, false) = false AND COALESCE(is_approved, false) = false)
    )
  );
