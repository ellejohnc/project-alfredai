-- Add file_url and is_gated fields to guides_playbooks table
ALTER TABLE public.guides_playbooks 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS is_gated BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.guides_playbooks.file_url IS 'URL to downloadable PDF or file';
COMMENT ON COLUMN public.guides_playbooks.is_gated IS 'Whether content requires email to access';