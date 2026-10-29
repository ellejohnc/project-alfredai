ALTER TABLE public.ghl_submissions
  ADD COLUMN IF NOT EXISTS ghl_opportunity_id text,
  ADD COLUMN IF NOT EXISTS pipeline_id text,
  ADD COLUMN IF NOT EXISTS pipeline_name text,
  ADD COLUMN IF NOT EXISTS pipeline_stage_id text,
  ADD COLUMN IF NOT EXISTS pipeline_stage_name text;