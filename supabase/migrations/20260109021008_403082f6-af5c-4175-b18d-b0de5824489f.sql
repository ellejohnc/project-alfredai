-- Admin dashboard counts helper
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_lead_counts()
RETURNS TABLE(
  leads_count bigint,
  ghl_submissions_count bigint,
  leads_booked_count bigint,
  meetings_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  booked_count bigint;
  investor_meetings bigint;
BEGIN
  -- Only allow admins
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Booked (calendar/direct booking OR meeting status), excluding archived
  SELECT COUNT(*)
  INTO booked_count
  FROM public.ghl_submissions g
  WHERE g.archived_at IS NULL
    AND (
      g.lead_source = 'calendar_widget'
      OR g.source_medium = 'ghl_direct_booking'
      OR g.ghl_status IN ('confirmed','cancelled','rescheduled')
    );

  -- Meetings includes investor bookings + booked demo meetings
  SELECT COUNT(*)
  INTO investor_meetings
  FROM public.investor_bookings;

  -- GHL Submissions panel count (non-calendar, non-meeting-status), excluding archived
  SELECT COUNT(*)
  INTO ghl_submissions_count
  FROM public.ghl_submissions g
  WHERE g.archived_at IS NULL
    AND COALESCE(g.lead_source,'') <> 'calendar_widget'
    AND COALESCE(g.source_medium,'') <> 'ghl_direct_booking'
    AND COALESCE(g.ghl_status,'') NOT IN ('confirmed','cancelled','rescheduled');

  -- Leads panel count: UNIQUE emails across leads table + non-calendar submissions,
  -- excluding any email that has a booked/calendar submission.
  WITH booked_emails AS (
    SELECT DISTINCT lower(g.lead_email) AS email
    FROM public.ghl_submissions g
    WHERE g.archived_at IS NULL
      AND (
        g.lead_source = 'calendar_widget'
        OR g.source_medium = 'ghl_direct_booking'
        OR g.ghl_status IN ('confirmed','cancelled','rescheduled')
      )
      AND g.lead_email IS NOT NULL
  ),
  lead_emails AS (
    SELECT DISTINCT lower(l.email) AS email
    FROM public.leads l
    WHERE l.archived_at IS NULL
      AND l.email IS NOT NULL
      AND lower(l.email) NOT IN (SELECT email FROM booked_emails)
  ),
  ghl_form_emails AS (
    SELECT DISTINCT lower(g.lead_email) AS email
    FROM public.ghl_submissions g
    WHERE g.archived_at IS NULL
      AND COALESCE(g.lead_source,'') <> 'calendar_widget'
      AND COALESCE(g.source_medium,'') <> 'ghl_direct_booking'
      AND COALESCE(g.ghl_status,'') NOT IN ('confirmed','cancelled','rescheduled')
      AND g.lead_email IS NOT NULL
      AND lower(g.lead_email) NOT IN (SELECT email FROM booked_emails)
  ),
  unified AS (
    SELECT email FROM lead_emails
    UNION
    SELECT email FROM ghl_form_emails
  )
  SELECT COUNT(*)
  INTO leads_count
  FROM unified;

  leads_booked_count := booked_count;
  meetings_count := investor_meetings + booked_count;

  RETURN NEXT;
END;
$$;