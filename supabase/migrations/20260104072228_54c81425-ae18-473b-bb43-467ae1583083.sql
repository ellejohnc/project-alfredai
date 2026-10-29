-- Add lead_source column to ghl_submissions table
ALTER TABLE public.ghl_submissions 
ADD COLUMN IF NOT EXISTS lead_source text DEFAULT 'unknown';

-- Add lead_source column to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS lead_source text DEFAULT 'unknown';

-- Add index for faster filtering by lead_source
CREATE INDEX IF NOT EXISTS idx_ghl_submissions_lead_source ON public.ghl_submissions(lead_source);
CREATE INDEX IF NOT EXISTS idx_leads_lead_source ON public.leads(lead_source);