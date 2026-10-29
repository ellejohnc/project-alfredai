-- Add new columns for enhanced qualification flow
ALTER TABLE public.visitor_sessions 
ADD COLUMN IF NOT EXISTS primary_challenge text,
ADD COLUMN IF NOT EXISTS workflows_to_automate text[],
ADD COLUMN IF NOT EXISTS pain_level text,
ADD COLUMN IF NOT EXISTS timeline text;