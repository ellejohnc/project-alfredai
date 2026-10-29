-- Create blog_views table to track article views
CREATE TABLE public.blog_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  visitor_id text NULL,
  ip_hash text NULL
);

-- Create index for efficient counting
CREATE INDEX idx_blog_views_blog_id ON public.blog_views(blog_id);
CREATE INDEX idx_blog_views_viewed_at ON public.blog_views(viewed_at);

-- Enable RLS
ALTER TABLE public.blog_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert views (public tracking)
CREATE POLICY "Anyone can log blog views" 
ON public.blog_views 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view analytics
CREATE POLICY "Admins can view blog analytics" 
ON public.blog_views 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Block updates and deletes for data integrity
CREATE POLICY "Block updates on blog_views" 
ON public.blog_views 
FOR UPDATE 
USING (false);

CREATE POLICY "Block deletes on blog_views" 
ON public.blog_views 
FOR DELETE 
USING (false);

-- Create a view for blog post view counts (for public access)
CREATE OR REPLACE VIEW public.blog_view_counts AS
SELECT 
  blog_id,
  COUNT(*) as total_views,
  COUNT(CASE WHEN viewed_at > now() - interval '30 days' THEN 1 END) as views_30d,
  COUNT(CASE WHEN viewed_at > now() - interval '7 days' THEN 1 END) as views_7d
FROM public.blog_views
GROUP BY blog_id;