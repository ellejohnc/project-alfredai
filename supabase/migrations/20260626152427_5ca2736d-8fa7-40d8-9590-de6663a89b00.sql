CREATE TABLE public.diy_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  company text,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, UPDATE ON public.diy_access_requests TO authenticated;
GRANT ALL ON public.diy_access_requests TO service_role;

ALTER TABLE public.diy_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own diy request or admins view all"
  ON public.diy_access_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_partner_admin(auth.uid()));

CREATE POLICY "Users insert own diy request"
  ON public.diy_access_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own diy request or admins update all"
  ON public.diy_access_requests FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_partner_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_partner_admin(auth.uid()));

-- Prevent privilege escalation: only admins (or service role) may change
-- status / review fields. Non-admin edits keep the prior approval state.
CREATE OR REPLACE FUNCTION public.diy_request_protect_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();

  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL AND NOT public.is_partner_admin(auth.uid()) THEN
      NEW.status := 'pending';
      NEW.reviewed_by := NULL;
      NEW.reviewed_at := NULL;
      NEW.review_note := NULL;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE: non-admin authenticated users cannot alter review fields.
  IF auth.uid() IS NOT NULL AND NOT public.is_partner_admin(auth.uid()) THEN
    NEW.status := OLD.status;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.review_note := OLD.review_note;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_diy_request_protect_status
  BEFORE INSERT OR UPDATE ON public.diy_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.diy_request_protect_status();