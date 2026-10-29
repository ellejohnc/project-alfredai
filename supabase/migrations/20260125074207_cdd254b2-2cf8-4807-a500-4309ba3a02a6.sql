-- Create search analytics table
CREATE TABLE public.search_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  selected_path TEXT,
  selected_title TEXT,
  ai_enhanced BOOLEAN NOT NULL DEFAULT false,
  session_id TEXT,
  visitor_id TEXT,
  device_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public insert on search_analytics"
ON public.search_analytics FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view search analytics"
ON public.search_analytics FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Block updates on search_analytics"
ON public.search_analytics FOR UPDATE
USING (false);

CREATE POLICY "Admins can delete search analytics"
ON public.search_analytics FOR DELETE
USING (is_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_search_analytics_created_at ON public.search_analytics(created_at DESC);
CREATE INDEX idx_search_analytics_query ON public.search_analytics(query);
CREATE INDEX idx_search_analytics_results_count ON public.search_analytics(results_count);