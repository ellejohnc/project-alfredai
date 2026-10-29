-- Add voice agent columns to quotes table
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS voice_agent_plan TEXT,
ADD COLUMN IF NOT EXISTS voice_agent_monthly_cost NUMERIC,
ADD COLUMN IF NOT EXISTS voice_agent_setup_cost NUMERIC,
ADD COLUMN IF NOT EXISTS voice_agent_addons JSONB;