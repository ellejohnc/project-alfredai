CREATE TABLE public.partner_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  actor_id uuid,
  actor_name text,
  resource_type text NOT NULL,
  resource_id uuid,
  resource_name text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.partner_activity_log TO authenticated;
GRANT ALL ON public.partner_activity_log TO service_role;

ALTER TABLE public.partner_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner admins can view activity log"
  ON public.partner_activity_log FOR SELECT
  TO authenticated
  USING (public.is_partner_admin(auth.uid()));

CREATE INDEX idx_partner_activity_log_created_at ON public.partner_activity_log (created_at DESC);

-- Helper to resolve a readable name for the acting user.
CREATE OR REPLACE FUNCTION public.partner_actor_name(_uid uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT full_name FROM public.partner_profiles WHERE user_id = _uid),
    (SELECT email FROM auth.users WHERE id = _uid),
    'System'
  );
$$;

-- Log deal creation.
CREATE OR REPLACE FUNCTION public.log_deal_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.partner_activity_log (action, actor_id, actor_name, resource_type, resource_id, resource_name, details)
  VALUES (
    'deal_created',
    NEW.partner_id,
    public.partner_actor_name(NEW.partner_id),
    'deal',
    NEW.id,
    NEW.client_name,
    jsonb_build_object('setup_fee', NEW.setup_fee, 'monthly_fee', NEW.monthly_fee, 'territory', NEW.territory)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_deal_created
AFTER INSERT ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.log_deal_created();

-- Log partner approval state changes.
CREATE OR REPLACE FUNCTION public.log_partner_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_approved IS DISTINCT FROM OLD.is_approved THEN
    INSERT INTO public.partner_activity_log (action, actor_id, actor_name, resource_type, resource_id, resource_name, details)
    VALUES (
      CASE WHEN NEW.is_approved THEN 'partner_approved' ELSE 'partner_unapproved' END,
      auth.uid(),
      public.partner_actor_name(auth.uid()),
      'partner',
      NEW.user_id,
      NEW.full_name,
      jsonb_build_object('company', NEW.company, 'territory', NEW.territory)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_partner_approval
AFTER UPDATE ON public.partner_profiles
FOR EACH ROW EXECUTE FUNCTION public.log_partner_approval();

-- Log application approval (status moving to approved).
CREATE OR REPLACE FUNCTION public.log_application_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'approved' THEN
    INSERT INTO public.partner_activity_log (action, actor_id, actor_name, resource_type, resource_id, resource_name, details)
    VALUES (
      'application_approved',
      auth.uid(),
      public.partner_actor_name(auth.uid()),
      'application',
      NEW.id,
      NEW.full_name,
      jsonb_build_object('email', NEW.email, 'company', NEW.company, 'territory', NEW.territory)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_application_approval
AFTER UPDATE ON public.partner_applications
FOR EACH ROW EXECUTE FUNCTION public.log_application_approval();