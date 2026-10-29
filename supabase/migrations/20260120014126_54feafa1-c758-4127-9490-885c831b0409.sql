-- Add meeting_transcript column to store raw transcripts
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS meeting_transcript TEXT;

-- Add meeting_transcript column to quote_versions for version history
ALTER TABLE public.quote_versions ADD COLUMN IF NOT EXISTS meeting_transcript TEXT;