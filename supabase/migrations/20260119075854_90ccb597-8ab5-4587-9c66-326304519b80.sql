-- Add voice_agent_workflow_count column to quotes table
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS voice_agent_workflow_count INTEGER DEFAULT 1;