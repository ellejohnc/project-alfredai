-- Create quote_versions table to track changes
CREATE TABLE public.quote_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  
  -- Snapshot of quote data at this version
  company_name TEXT,
  contact_name TEXT,
  contact_email TEXT,
  industry TEXT,
  team_size INTEGER,
  workflows JSONB,
  challenges TEXT[],
  timeline TEXT,
  notes TEXT,
  transcript_summary TEXT,
  
  -- Pricing snapshot
  setup_fee_min NUMERIC,
  setup_fee_max NUMERIC,
  monthly_retainer_min NUMERIC,
  monthly_retainer_max NUMERIC,
  
  -- ROI snapshot
  roi_conservative NUMERIC,
  roi_likely NUMERIC,
  roi_best NUMERIC,
  
  -- Voice agent snapshot
  voice_agent_plan TEXT,
  voice_agent_monthly_cost NUMERIC,
  voice_agent_setup_cost NUMERIC,
  voice_agent_workflow_count INTEGER,
  
  -- Metadata
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  change_summary TEXT
);

-- Create index for faster lookups
CREATE INDEX idx_quote_versions_quote_id ON public.quote_versions(quote_id);
CREATE INDEX idx_quote_versions_created_at ON public.quote_versions(created_at DESC);

-- Unique constraint on quote_id + version_number
ALTER TABLE public.quote_versions ADD CONSTRAINT unique_quote_version UNIQUE (quote_id, version_number);

-- Enable RLS
ALTER TABLE public.quote_versions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (admins) to read versions
CREATE POLICY "Admins can read quote versions"
  ON public.quote_versions
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Allow inserts from authenticated users
CREATE POLICY "Allow insert quote versions"
  ON public.quote_versions
  FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.quote_versions IS 'Stores version history of quotes for tracking changes';