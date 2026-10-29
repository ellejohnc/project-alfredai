
CREATE TABLE public.investor_page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investor_id UUID REFERENCES public.investor_leads(id) ON DELETE CASCADE,
  session_id TEXT,
  page_path TEXT NOT NULL,
  page_title TEXT,
  activity_type TEXT NOT NULL DEFAULT 'page_view',
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups by investor
CREATE INDEX idx_investor_page_views_investor_id ON public.investor_page_views(investor_id);
CREATE INDEX idx_investor_page_views_created_at ON public.investor_page_views(created_at DESC);

-- Enable RLS
ALTER TABLE public.investor_page_views ENABLE ROW LEVEL SECURITY;

-- Admins can view all
CREATE POLICY "Admins can view investor page views"
ON public.investor_page_views
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Allow inserts from edge functions (service role) and anon for tracking
CREATE POLICY "Anyone can insert investor page views"
ON public.investor_page_views
FOR INSERT
WITH CHECK (true);
