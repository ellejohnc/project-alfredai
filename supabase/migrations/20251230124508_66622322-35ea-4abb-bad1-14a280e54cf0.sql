-- Drop the security definer view and recreate with security_invoker
DROP VIEW IF EXISTS public.blog_view_counts;

-- Recreate as a function instead for public access to view counts
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
AS $$
  SELECT 
    blog_id,
    COUNT(*) as total_views,
    COUNT(CASE WHEN viewed_at > now() - interval '30 days' THEN 1 END) as views_30d,
    COUNT(CASE WHEN viewed_at > now() - interval '7 days' THEN 1 END) as views_7d
  FROM public.blog_views
  GROUP BY blog_id;
$$;

-- Add a public RLS policy to allow reading view counts aggregates
CREATE POLICY "Public can read blog views for counting" 
ON public.blog_views 
FOR SELECT 
USING (true);