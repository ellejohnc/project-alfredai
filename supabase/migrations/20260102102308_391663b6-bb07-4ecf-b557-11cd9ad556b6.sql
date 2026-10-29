-- Add source_page column to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_page text;

-- Add source_medium column to leads table for consistency
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_medium text;

-- Add source_campaign column to leads table for consistency
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_campaign text;