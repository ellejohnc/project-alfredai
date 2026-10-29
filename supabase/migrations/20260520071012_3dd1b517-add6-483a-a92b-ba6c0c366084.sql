
-- Track sent Blog API alert emails to enforce cooldown and provide history
CREATE TABLE IF NOT EXISTS public.blog_api_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recipient TEXT NOT NULL,
  error_count INTEGER NOT NULL,
  window_minutes INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  sample_errors JSONB,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_blog_api_alerts_sent_at ON public.blog_api_alerts (sent_at DESC);

ALTER TABLE public.blog_api_alerts ENABLE ROW LEVEL SECURITY;

-- Admins can view alert history
CREATE POLICY "Admins can view blog api alerts"
  ON public.blog_api_alerts
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));
