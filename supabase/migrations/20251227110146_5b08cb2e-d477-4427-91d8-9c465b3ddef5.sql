-- Create visitor_sessions table for storing personalized discovery data
CREATE TABLE public.visitor_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Visitor info
  name TEXT,
  email TEXT,
  company TEXT,
  
  -- Discovery responses
  industry TEXT,
  team_size TEXT,
  pain_points TEXT[],
  current_tools TEXT[],
  goals TEXT[],
  budget_range TEXT,
  
  -- AI-generated content (stored as JSON for flexibility)
  personalization JSONB DEFAULT '{}'::jsonb,
  
  -- Recommended demos based on their needs
  recommended_demos TEXT[],
  
  -- ROI calculation inputs (pre-filled from their answers)
  roi_inputs JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- For analytics
  source TEXT DEFAULT 'chatbot',
  utm_params JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public read access via unique ID (for shareable links)
CREATE POLICY "Anyone can view sessions by ID" 
ON public.visitor_sessions 
FOR SELECT 
USING (true);

-- Allow public insert (visitors aren't authenticated)
CREATE POLICY "Anyone can create sessions" 
ON public.visitor_sessions 
FOR INSERT 
WITH CHECK (true);

-- Allow public update (for updating with AI-generated content)
CREATE POLICY "Anyone can update sessions" 
ON public.visitor_sessions 
FOR UPDATE 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_visitor_sessions_email ON public.visitor_sessions(email);
CREATE INDEX idx_visitor_sessions_created ON public.visitor_sessions(created_at DESC);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_visitor_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_visitor_sessions_updated_at
BEFORE UPDATE ON public.visitor_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_visitor_session_timestamp();