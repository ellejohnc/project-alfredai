-- Add source column to blog_posts
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
  CHECK (source IN ('manual', 'api'));

-- API audit log
CREATE TABLE IF NOT EXISTS public.blog_api_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  slug TEXT,
  status_code INTEGER NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  error TEXT,
  payload_preview JSONB,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_api_log_created_at ON public.blog_api_log (created_at DESC);

ALTER TABLE public.blog_api_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view blog_api_log"
  ON public.blog_api_log FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));