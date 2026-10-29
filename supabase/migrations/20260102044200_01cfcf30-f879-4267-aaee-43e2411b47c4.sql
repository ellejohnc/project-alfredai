-- Create GHL submissions tracking table
CREATE TABLE public.ghl_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_email TEXT NOT NULL,
  lead_name TEXT,
  lead_company TEXT,
  source_page TEXT NOT NULL,
  source_medium TEXT NOT NULL,
  source_campaign TEXT,
  ghl_status TEXT DEFAULT 'submitted',
  ghl_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ghl_submissions ENABLE ROW LEVEL SECURITY;

-- Allow public insert (for frontend logging)
CREATE POLICY "Allow public insert on ghl_submissions"
  ON public.ghl_submissions
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view
CREATE POLICY "Admin read access on ghl_submissions"
  ON public.ghl_submissions
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Block updates and deletes from public
CREATE POLICY "Block updates on ghl_submissions"
  ON public.ghl_submissions
  FOR UPDATE
  USING (false);

CREATE POLICY "Block deletes on ghl_submissions"
  ON public.ghl_submissions
  FOR DELETE
  USING (false);

-- Add indexes for common queries
CREATE INDEX idx_ghl_submissions_created_at ON public.ghl_submissions(created_at DESC);
CREATE INDEX idx_ghl_submissions_email ON public.ghl_submissions(lead_email);
CREATE INDEX idx_ghl_submissions_source ON public.ghl_submissions(source_page, source_medium);