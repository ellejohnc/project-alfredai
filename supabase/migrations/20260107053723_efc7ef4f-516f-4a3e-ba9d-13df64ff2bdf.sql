-- Add phone column to ghl_submissions table
ALTER TABLE public.ghl_submissions 
ADD COLUMN IF NOT EXISTS lead_phone text;