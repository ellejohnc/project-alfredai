-- Create GHL sync history table
CREATE TABLE public.ghl_sync_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES public.ghl_submissions(id) ON DELETE CASCADE,
  lead_email TEXT NOT NULL,
  sync_type TEXT NOT NULL DEFAULT 'manual',
  sync_status TEXT NOT NULL,
  ghl_contact_id TEXT,
  ghl_response JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ghl_sync_history ENABLE ROW LEVEL SECURITY;

-- Admin read access
CREATE POLICY "Admin read access on ghl_sync_history"
ON public.ghl_sync_history
FOR SELECT
USING (is_admin(auth.uid()));

-- Block public modifications
CREATE POLICY "Block public insert on ghl_sync_history"
ON public.ghl_sync_history
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Block updates on ghl_sync_history"
ON public.ghl_sync_history
FOR UPDATE
USING (false);

CREATE POLICY "Block deletes on ghl_sync_history"
ON public.ghl_sync_history
FOR DELETE
USING (false);

-- Create index for faster lookups
CREATE INDEX idx_ghl_sync_history_submission_id ON public.ghl_sync_history(submission_id);
CREATE INDEX idx_ghl_sync_history_email ON public.ghl_sync_history(lead_email);
CREATE INDEX idx_ghl_sync_history_created_at ON public.ghl_sync_history(created_at DESC);