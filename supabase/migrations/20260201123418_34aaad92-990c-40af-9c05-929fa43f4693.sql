-- Create function to get demo view counts from demo_engagement table
CREATE OR REPLACE FUNCTION public.get_demo_view_counts()
RETURNS TABLE (
  demo_id TEXT,
  total_views BIGINT,
  views_30d BIGINT,
  views_7d BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    de.demo_id,
    COUNT(*)::BIGINT AS total_views,
    COUNT(*) FILTER (WHERE de.created_at >= NOW() - INTERVAL '30 days')::BIGINT AS views_30d,
    COUNT(*) FILTER (WHERE de.created_at >= NOW() - INTERVAL '7 days')::BIGINT AS views_7d
  FROM public.demo_engagement de
  WHERE de.event_type = 'viewed'
  GROUP BY de.demo_id
  ORDER BY total_views DESC;
END;
$$;