-- Add current_tech_stack and sentiment_analysis columns to quotes table if not exist
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS current_tech_stack jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS sentiment_analysis jsonb DEFAULT NULL;

ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS access_code text DEFAULT NULL;

ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS meeting_transcript text DEFAULT NULL;

-- Add to quote_versions for history tracking
ALTER TABLE public.quote_versions 
ADD COLUMN IF NOT EXISTS current_tech_stack jsonb DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.quotes.current_tech_stack IS 
  'Array of {name, category, integrationNeed, notes} objects for prospect tech stack';

COMMENT ON COLUMN public.quotes.sentiment_analysis IS 
  'AI-extracted sentiment data: interestLevel, productFit, pricingSensitivity, recommendation';

-- Create demo_engagement table for tracking demo interactions
CREATE TABLE IF NOT EXISTS public.demo_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_id TEXT NOT NULL,
  session_id TEXT,
  visitor_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('viewed', 'started', 'step_completed', 'completed', 'abandoned')),
  step_id TEXT,
  step_number INTEGER,
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  device_type TEXT,
  referrer TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on demo_engagement
ALTER TABLE public.demo_engagement ENABLE ROW LEVEL SECURITY;

-- RLS: Allow public insert (anyone can log demo events)
CREATE POLICY "Allow public insert on demo_engagement" 
  ON public.demo_engagement 
  FOR INSERT 
  WITH CHECK (true);

-- RLS: Admin-only read access
CREATE POLICY "Admins can view demo engagement" 
  ON public.demo_engagement 
  FOR SELECT 
  USING (is_admin(auth.uid()));

-- RLS: Block updates and deletes (audit log style)
CREATE POLICY "Block updates on demo_engagement" 
  ON public.demo_engagement 
  FOR UPDATE 
  USING (false);

CREATE POLICY "Block deletes on demo_engagement" 
  ON public.demo_engagement 
  FOR DELETE 
  USING (false);

-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_demo_engagement_demo_id ON public.demo_engagement(demo_id);
CREATE INDEX IF NOT EXISTS idx_demo_engagement_created_at ON public.demo_engagement(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_engagement_event_type ON public.demo_engagement(event_type);

-- Update visitor_sessions with demo tracking columns
ALTER TABLE public.visitor_sessions 
ADD COLUMN IF NOT EXISTS demos_viewed TEXT[] DEFAULT '{}';

ALTER TABLE public.visitor_sessions 
ADD COLUMN IF NOT EXISTS demos_completed TEXT[] DEFAULT '{}';