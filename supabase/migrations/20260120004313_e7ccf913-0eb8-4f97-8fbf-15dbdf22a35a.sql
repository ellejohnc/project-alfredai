-- Create proposal_views table for analytics tracking
CREATE TABLE public.proposal_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_hash TEXT, -- Hashed IP for privacy
  user_agent TEXT,
  referrer TEXT,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  is_first_view BOOLEAN DEFAULT false,
  session_id TEXT -- To group views from same session
);

-- Create index for fast lookups by quote
CREATE INDEX idx_proposal_views_quote_id ON public.proposal_views(quote_id);
CREATE INDEX idx_proposal_views_viewed_at ON public.proposal_views(viewed_at DESC);

-- Enable RLS
ALTER TABLE public.proposal_views ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (edge function handles verification)
CREATE POLICY "Allow public inserts for proposal views"
  ON public.proposal_views
  FOR INSERT
  WITH CHECK (true);

-- Only admins can read analytics
CREATE POLICY "Admins can read proposal views"
  ON public.proposal_views
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Function to get proposal view analytics
CREATE OR REPLACE FUNCTION public.get_proposal_view_stats(p_quote_id UUID)
RETURNS TABLE (
  total_views BIGINT,
  unique_sessions BIGINT,
  first_view_at TIMESTAMP WITH TIME ZONE,
  last_view_at TIMESTAMP WITH TIME ZONE,
  mobile_views BIGINT,
  desktop_views BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_views,
    COUNT(DISTINCT session_id)::BIGINT as unique_sessions,
    MIN(viewed_at) as first_view_at,
    MAX(viewed_at) as last_view_at,
    COUNT(*) FILTER (WHERE device_type = 'mobile')::BIGINT as mobile_views,
    COUNT(*) FILTER (WHERE device_type = 'desktop')::BIGINT as desktop_views
  FROM public.proposal_views
  WHERE quote_id = p_quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;