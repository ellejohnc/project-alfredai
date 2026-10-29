CREATE TABLE public.meta_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text,
  email text,
  phone text,
  form_name text,
  form_id text,
  campaign_id text,
  ad_id text,
  client text,
  status text NOT NULL DEFAULT 'new',
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  raw_payload jsonb
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_leads TO authenticated;
GRANT ALL ON public.meta_leads TO service_role;

ALTER TABLE public.meta_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view meta leads"
  ON public.meta_leads FOR SELECT
  TO authenticated
  USING (public.can_view_leads(auth.uid()));

CREATE POLICY "Staff can update meta leads"
  ON public.meta_leads FOR UPDATE
  TO authenticated
  USING (public.can_view_leads(auth.uid()))
  WITH CHECK (public.can_view_leads(auth.uid()));

CREATE POLICY "Admins can delete meta leads"
  ON public.meta_leads FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX idx_meta_leads_status ON public.meta_leads (status);
CREATE INDEX idx_meta_leads_client ON public.meta_leads (client);
CREATE INDEX idx_meta_leads_created_at ON public.meta_leads (created_at DESC);