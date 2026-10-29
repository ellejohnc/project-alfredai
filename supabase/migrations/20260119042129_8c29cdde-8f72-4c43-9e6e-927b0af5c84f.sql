-- Create quotes table for historical tracking
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_name TEXT,
  contact_name TEXT,
  contact_email TEXT,
  industry TEXT,
  team_size INT,
  workflows JSONB DEFAULT '[]'::jsonb,
  challenges TEXT[],
  timeline TEXT,
  setup_fee_min INT,
  setup_fee_max INT,
  monthly_retainer_min INT,
  monthly_retainer_max INT,
  roi_conservative DECIMAL,
  roi_likely DECIMAL,
  roi_best DECIMAL,
  payback_months_conservative INT,
  payback_months_likely INT,
  payback_months_best INT,
  notes TEXT,
  transcript_summary TEXT,
  status TEXT DEFAULT 'draft',
  outcome TEXT,
  CONSTRAINT check_status CHECK (status IN ('draft', 'sent', 'won', 'lost', 'expired'))
);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admin users to manage quotes
CREATE POLICY "Admins can manage quotes"
ON public.quotes FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Allow public insert for the password-protected page (no auth required for internal tool)
CREATE POLICY "Allow public insert for quotes"
ON public.quotes FOR INSERT
WITH CHECK (true);

-- Allow public select for similarity matching
CREATE POLICY "Allow public select for quotes"
ON public.quotes FOR SELECT
USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_visitor_session_timestamp();

-- Create index for similarity matching
CREATE INDEX idx_quotes_industry ON public.quotes(industry);
CREATE INDEX idx_quotes_team_size ON public.quotes(team_size);
CREATE INDEX idx_quotes_created_at ON public.quotes(created_at DESC);