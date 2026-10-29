-- Create table for storing performance metrics
CREATE TABLE public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  page_url TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  rating TEXT,
  visitor_id TEXT,
  device_type TEXT,
  connection_type TEXT,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for tracking)
CREATE POLICY "Allow anonymous inserts" 
ON public.performance_metrics 
FOR INSERT 
WITH CHECK (true);

-- Allow admins to view all metrics
CREATE POLICY "Admins can view all metrics" 
ON public.performance_metrics 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Create index for efficient querying
CREATE INDEX idx_performance_metrics_created_at ON public.performance_metrics(created_at DESC);
CREATE INDEX idx_performance_metrics_page_url ON public.performance_metrics(page_url);
CREATE INDEX idx_performance_metrics_metric_name ON public.performance_metrics(metric_name);

-- Create function to get performance overview
CREATE OR REPLACE FUNCTION public.get_performance_overview(days_back integer DEFAULT 7)
RETURNS TABLE(
  metric_name TEXT,
  avg_value NUMERIC,
  p75_value NUMERIC,
  p95_value NUMERIC,
  good_count BIGINT,
  needs_improvement_count BIGINT,
  poor_count BIGINT,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    pm.metric_name,
    ROUND(AVG(pm.metric_value)::numeric, 2) as avg_value,
    ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY pm.metric_value)::numeric, 2) as p75_value,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY pm.metric_value)::numeric, 2) as p95_value,
    COUNT(*) FILTER (WHERE pm.rating = 'good')::bigint as good_count,
    COUNT(*) FILTER (WHERE pm.rating = 'needs-improvement')::bigint as needs_improvement_count,
    COUNT(*) FILTER (WHERE pm.rating = 'poor')::bigint as poor_count,
    COUNT(*)::bigint as total_count
  FROM public.performance_metrics pm
  WHERE pm.created_at >= NOW() - (days_back || ' days')::interval
  GROUP BY pm.metric_name;
END;
$$;

-- Create function to get daily performance stats
CREATE OR REPLACE FUNCTION public.get_daily_performance_stats(days_back integer DEFAULT 7)
RETURNS TABLE(
  date DATE,
  metric_name TEXT,
  avg_value NUMERIC,
  sample_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    DATE(pm.created_at) as date,
    pm.metric_name,
    ROUND(AVG(pm.metric_value)::numeric, 2) as avg_value,
    COUNT(*)::bigint as sample_count
  FROM public.performance_metrics pm
  WHERE pm.created_at >= NOW() - (days_back || ' days')::interval
  GROUP BY DATE(pm.created_at), pm.metric_name
  ORDER BY DATE(pm.created_at) ASC, pm.metric_name;
END;
$$;