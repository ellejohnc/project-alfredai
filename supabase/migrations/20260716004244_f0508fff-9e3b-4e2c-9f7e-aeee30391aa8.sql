
ALTER TABLE public.alpha_digital_leads
  ADD COLUMN IF NOT EXISTS ghl_contact_id text,
  ADD COLUMN IF NOT EXISTS ghl_opportunity_id text,
  ADD COLUMN IF NOT EXISTS ghl_pushed_at timestamptz,
  ADD COLUMN IF NOT EXISTS ghl_push_meta jsonb;

CREATE INDEX IF NOT EXISTS alpha_digital_leads_ghl_contact_id_idx
  ON public.alpha_digital_leads (ghl_contact_id)
  WHERE ghl_contact_id IS NOT NULL;
