-- Add is_admin_view column to proposal_views
ALTER TABLE public.proposal_views ADD COLUMN IF NOT EXISTS is_admin_view boolean NOT NULL DEFAULT false;

-- Update get_proposal_view_stats to exclude admin views
CREATE OR REPLACE FUNCTION public.get_proposal_view_stats(p_quote_id uuid)
 RETURNS TABLE(total_views bigint, unique_sessions bigint, first_view_at timestamp with time zone, last_view_at timestamp with time zone, mobile_views bigint, desktop_views bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_views,
    COUNT(DISTINCT session_id)::BIGINT as unique_sessions,
    MIN(viewed_at) as first_view_at,
    MAX(viewed_at) as last_view_at,
    COUNT(*) FILTER (WHERE device_type = 'mobile')::BIGINT as mobile_views,
    COUNT(*) FILTER (WHERE device_type = 'desktop')::BIGINT as desktop_views
  FROM public.proposal_views
  WHERE quote_id = p_quote_id
    AND is_admin_view = false;
END;
$function$;