-- Add meet_link column to ghl_submissions for storing meeting links
ALTER TABLE public.ghl_submissions 
ADD COLUMN IF NOT EXISTS meet_link text;