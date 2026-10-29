-- Add first_name and last_name columns to ghl_submissions table
ALTER TABLE public.ghl_submissions 
ADD COLUMN IF NOT EXISTS lead_first_name TEXT,
ADD COLUMN IF NOT EXISTS lead_last_name TEXT;

-- Migrate existing data: parse lead_name into first_name and last_name
UPDATE public.ghl_submissions 
SET 
  lead_first_name = SPLIT_PART(TRIM(lead_name), ' ', 1),
  lead_last_name = CASE 
    WHEN POSITION(' ' IN TRIM(lead_name)) > 0 
    THEN SUBSTRING(TRIM(lead_name) FROM POSITION(' ' IN TRIM(lead_name)) + 1)
    ELSE ''
  END
WHERE lead_name IS NOT NULL AND lead_first_name IS NULL;