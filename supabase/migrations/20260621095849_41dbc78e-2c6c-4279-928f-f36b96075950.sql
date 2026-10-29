-- Meta leads: dedup key + notification tracking
ALTER TABLE public.meta_leads
  ADD COLUMN IF NOT EXISTS leadgen_id text,
  ADD COLUMN IF NOT EXISTS notification_status text,
  ADD COLUMN IF NOT EXISTS notification_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS notification_error text;

CREATE UNIQUE INDEX IF NOT EXISTS meta_leads_leadgen_id_key
  ON public.meta_leads (leadgen_id)
  WHERE leadgen_id IS NOT NULL;

-- Leads: notification tracking for injected/GHL leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS notification_status text,
  ADD COLUMN IF NOT EXISTS notification_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS notification_error text;