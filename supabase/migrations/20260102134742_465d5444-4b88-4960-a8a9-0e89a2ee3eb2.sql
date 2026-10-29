-- Add archived_at column to ghl_submissions for soft delete
ALTER TABLE public.ghl_submissions
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add archived_at column to leads for soft delete
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for faster filtering of non-archived records
CREATE INDEX IF NOT EXISTS idx_ghl_submissions_archived ON public.ghl_submissions (archived_at) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_archived ON public.leads (archived_at) WHERE archived_at IS NULL;