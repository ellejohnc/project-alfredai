ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS evidence_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS conversation_confirmed boolean NOT NULL DEFAULT false;