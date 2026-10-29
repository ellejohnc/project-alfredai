ALTER TABLE public.meta_leads
  ADD COLUMN IF NOT EXISTS ghl_contact_id text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS ad_name text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS tags text[];

CREATE UNIQUE INDEX IF NOT EXISTS meta_leads_ghl_contact_id_key
  ON public.meta_leads (ghl_contact_id)
  WHERE ghl_contact_id IS NOT NULL;