-- Recreate email_delivery_stats view with security_invoker to fix security definer warning
DROP VIEW IF EXISTS public.email_delivery_stats;

CREATE VIEW public.email_delivery_stats
WITH (security_invoker = true)
AS
SELECT 
    template_key,
    count(*) AS total_sent,
    count(*) FILTER (WHERE delivery_status = 'delivered' OR delivery_status = 'opened' OR delivery_status = 'clicked') AS delivered,
    count(*) FILTER (WHERE delivery_status = 'opened' OR delivery_status = 'clicked') AS opened,
    count(*) FILTER (WHERE delivery_status = 'clicked') AS clicked,
    count(*) FILTER (WHERE delivery_status = 'bounced') AS bounced,
    count(*) FILTER (WHERE delivery_status = 'failed') AS failed,
    round(count(*) FILTER (WHERE delivery_status = 'delivered' OR delivery_status = 'opened' OR delivery_status = 'clicked')::numeric / NULLIF(count(*)::numeric, 0) * 100, 2) AS delivery_rate,
    round(count(*) FILTER (WHERE delivery_status = 'opened' OR delivery_status = 'clicked')::numeric / NULLIF(count(*) FILTER (WHERE delivery_status = 'delivered' OR delivery_status = 'opened' OR delivery_status = 'clicked')::numeric, 0) * 100, 2) AS open_rate,
    round(count(*) FILTER (WHERE delivery_status = 'clicked')::numeric / NULLIF(count(*) FILTER (WHERE delivery_status = 'opened' OR delivery_status = 'clicked')::numeric, 0) * 100, 2) AS click_rate,
    round(count(*) FILTER (WHERE delivery_status = 'bounced')::numeric / NULLIF(count(*)::numeric, 0) * 100, 2) AS bounce_rate
FROM public.email_logs
GROUP BY template_key;