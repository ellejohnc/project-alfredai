-- Add email tracking fields to email_logs table
ALTER TABLE public.email_logs 
ADD COLUMN IF NOT EXISTS opened_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS opened_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS click_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS bounced_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS bounce_type text,
ADD COLUMN IF NOT EXISTS bounce_reason text,
ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS ip_address text;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_email_logs_delivery_status ON public.email_logs(delivery_status);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_key ON public.email_logs(template_key);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient_email);

-- Update existing records to have 'delivered' status for sent emails
UPDATE public.email_logs SET delivery_status = 'delivered' WHERE status = 'sent' AND delivery_status = 'pending';
UPDATE public.email_logs SET delivery_status = 'failed' WHERE status = 'failed';

-- Create a view for email analytics
CREATE OR REPLACE VIEW public.email_delivery_stats AS
SELECT 
  template_key,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE delivery_status = 'delivered' OR delivery_status = 'opened' OR delivery_status = 'clicked') as delivered,
  COUNT(*) FILTER (WHERE delivery_status = 'opened' OR delivery_status = 'clicked') as opened,
  COUNT(*) FILTER (WHERE delivery_status = 'clicked') as clicked,
  COUNT(*) FILTER (WHERE delivery_status = 'bounced') as bounced,
  COUNT(*) FILTER (WHERE delivery_status = 'failed') as failed,
  ROUND(
    (COUNT(*) FILTER (WHERE delivery_status = 'delivered' OR delivery_status = 'opened' OR delivery_status = 'clicked')::numeric / 
    NULLIF(COUNT(*)::numeric, 0)) * 100, 2
  ) as delivery_rate,
  ROUND(
    (COUNT(*) FILTER (WHERE delivery_status = 'opened' OR delivery_status = 'clicked')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE delivery_status = 'delivered' OR delivery_status = 'opened' OR delivery_status = 'clicked')::numeric, 0)) * 100, 2
  ) as open_rate,
  ROUND(
    (COUNT(*) FILTER (WHERE delivery_status = 'clicked')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE delivery_status = 'opened' OR delivery_status = 'clicked')::numeric, 0)) * 100, 2
  ) as click_rate,
  ROUND(
    (COUNT(*) FILTER (WHERE delivery_status = 'bounced')::numeric / 
    NULLIF(COUNT(*)::numeric, 0)) * 100, 2
  ) as bounce_rate
FROM public.email_logs
GROUP BY template_key;

-- Create function to get overall email stats
CREATE OR REPLACE FUNCTION public.get_email_delivery_overview(days_back integer DEFAULT 30)
RETURNS TABLE(
  total_sent bigint,
  total_delivered bigint,
  total_opened bigint,
  total_clicked bigint,
  total_bounced bigint,
  total_failed bigint,
  delivery_rate numeric,
  open_rate numeric,
  click_rate numeric,
  bounce_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_sent,
    COUNT(*) FILTER (WHERE e.delivery_status IN ('delivered', 'opened', 'clicked'))::bigint as total_delivered,
    COUNT(*) FILTER (WHERE e.delivery_status IN ('opened', 'clicked'))::bigint as total_opened,
    COUNT(*) FILTER (WHERE e.delivery_status = 'clicked')::bigint as total_clicked,
    COUNT(*) FILTER (WHERE e.delivery_status = 'bounced')::bigint as total_bounced,
    COUNT(*) FILTER (WHERE e.delivery_status = 'failed')::bigint as total_failed,
    ROUND(
      (COUNT(*) FILTER (WHERE e.delivery_status IN ('delivered', 'opened', 'clicked'))::numeric / 
      NULLIF(COUNT(*)::numeric, 0)) * 100, 2
    ) as delivery_rate,
    ROUND(
      (COUNT(*) FILTER (WHERE e.delivery_status IN ('opened', 'clicked'))::numeric / 
      NULLIF(COUNT(*) FILTER (WHERE e.delivery_status IN ('delivered', 'opened', 'clicked'))::numeric, 0)) * 100, 2
    ) as open_rate,
    ROUND(
      (COUNT(*) FILTER (WHERE e.delivery_status = 'clicked')::numeric / 
      NULLIF(COUNT(*) FILTER (WHERE e.delivery_status IN ('opened', 'clicked'))::numeric, 0)) * 100, 2
    ) as click_rate,
    ROUND(
      (COUNT(*) FILTER (WHERE e.delivery_status = 'bounced')::numeric / 
      NULLIF(COUNT(*)::numeric, 0)) * 100, 2
    ) as bounce_rate
  FROM public.email_logs e
  WHERE e.sent_at >= NOW() - (days_back || ' days')::interval;
END;
$$;

-- Create function to get daily email stats for charts
CREATE OR REPLACE FUNCTION public.get_daily_email_stats(days_back integer DEFAULT 30)
RETURNS TABLE(
  date date,
  sent bigint,
  delivered bigint,
  opened bigint,
  bounced bigint,
  failed bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(e.sent_at) as date,
    COUNT(*)::bigint as sent,
    COUNT(*) FILTER (WHERE e.delivery_status IN ('delivered', 'opened', 'clicked'))::bigint as delivered,
    COUNT(*) FILTER (WHERE e.delivery_status IN ('opened', 'clicked'))::bigint as opened,
    COUNT(*) FILTER (WHERE e.delivery_status = 'bounced')::bigint as bounced,
    COUNT(*) FILTER (WHERE e.delivery_status = 'failed')::bigint as failed
  FROM public.email_logs e
  WHERE e.sent_at >= NOW() - (days_back || ' days')::interval
  GROUP BY DATE(e.sent_at)
  ORDER BY DATE(e.sent_at) ASC;
END;
$$;