
-- Create short_links table for auto URL shortening on blog post publish
CREATE TABLE IF NOT EXISTS public.short_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  destination_url text NOT NULL,
  blog_post_id uuid REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  click_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast code lookups (redirect page)
CREATE INDEX IF NOT EXISTS short_links_code_idx ON public.short_links(code);
-- Index for lookups by blog post + destination (idempotency)
CREATE INDEX IF NOT EXISTS short_links_blog_dest_idx ON public.short_links(blog_post_id, destination_url);

-- Enable RLS
ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage short links"
  ON public.short_links
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Public can SELECT (needed for redirect page to look up codes)
CREATE POLICY "Public can read short links"
  ON public.short_links
  FOR SELECT
  USING (true);

-- Public can increment click_count (no auth needed for tracking)
CREATE POLICY "Public can increment click count"
  ON public.short_links
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
