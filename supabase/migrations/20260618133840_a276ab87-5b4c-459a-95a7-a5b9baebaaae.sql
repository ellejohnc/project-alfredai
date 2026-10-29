CREATE TABLE public.alpha_digital_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  source TEXT,
  status TEXT,
  raw_data JSONB,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archived_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (external_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alpha_digital_leads TO authenticated;
GRANT ALL ON public.alpha_digital_leads TO service_role;

ALTER TABLE public.alpha_digital_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lead viewers can read alpha digital leads"
ON public.alpha_digital_leads FOR SELECT
TO authenticated
USING (public.can_view_leads(auth.uid()));

CREATE POLICY "Admins can manage alpha digital leads"
ON public.alpha_digital_leads FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_alpha_digital_leads_updated_at
BEFORE UPDATE ON public.alpha_digital_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();