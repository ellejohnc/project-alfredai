-- Add a generic content_id column to support Guides and Webinars short links
-- blog_post_id already exists and keeps working for blog posts
ALTER TABLE public.short_links 
  ADD COLUMN IF NOT EXISTS content_id uuid NULL,
  ADD COLUMN IF NOT EXISTS content_type text NULL; -- 'blog_post' | 'guide' | 'webinar'

-- Index for fast lookup by content_id
CREATE INDEX IF NOT EXISTS short_links_content_id_idx ON public.short_links(content_id);
