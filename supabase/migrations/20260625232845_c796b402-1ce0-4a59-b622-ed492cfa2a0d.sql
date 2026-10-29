CREATE TABLE public.partner_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  company text,
  territory text NOT NULL DEFAULT 'ANZ',
  phone text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT partner_applications_territory_check CHECK (territory IN ('US','CA','ANZ')),
  CONSTRAINT partner_applications_status_check CHECK (status IN ('pending','approved','rejected'))
);

GRANT INSERT ON public.partner_applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_applications TO authenticated;
GRANT ALL ON public.partner_applications TO service_role;

ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a partner application"
  ON public.partner_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'pending');

CREATE POLICY "Partner admins view applications"
  ON public.partner_applications FOR SELECT
  TO authenticated
  USING (public.is_partner_admin(auth.uid()));

CREATE POLICY "Partner admins update applications"
  ON public.partner_applications FOR UPDATE
  TO authenticated
  USING (public.is_partner_admin(auth.uid()))
  WITH CHECK (public.is_partner_admin(auth.uid()));

CREATE POLICY "Partner admins delete applications"
  ON public.partner_applications FOR DELETE
  TO authenticated
  USING (public.is_partner_admin(auth.uid()));

CREATE TRIGGER partner_applications_updated_at BEFORE UPDATE ON public.partner_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.partner_profiles ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;