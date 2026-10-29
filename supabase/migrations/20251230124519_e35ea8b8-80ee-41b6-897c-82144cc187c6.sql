-- Fix function search path
DROP FUNCTION IF EXISTS public.get_blog_view_counts();

CREATE OR REPLACE FUNCTION public.get_blog_view_counts()
RETURNS TABLE (
  blog_id uuid,
  total_views bigint,
  views_30d bigint,
  views_7d bigint
)
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
  SELECT 
    blog_id,
    COUNT(*) as total_views,
    COUNT(CASE WHEN viewed_at > now() - interval '30 days' THEN 1 END) as views_30d,
    COUNT(CASE WHEN viewed_at > now() - interval '7 days' THEN 1 END) as views_7d
  FROM public.blog_views
  GROUP BY blog_id;
$$;