-- The dashboard's booked count did not recognise an attended meeting.
--
-- Applied through Lovable on 14 Sep and verified before this file was written:
-- the deployed function now contains both new statuses. This file is the
-- RECORD of a change already made, not the thing that makes it — migrations in
-- this repo are not applied automatically, and two have sat here unapplied
-- while code wrote to the columns they were meant to create.
--
-- WHAT WAS WRONG. On 6 Sep the booking webhook stopped guessing appointment
-- status by substring and started mapping it, which added two words to
-- ghl_submissions.ghl_status: 'completed' (attended) and 'no_show'. Nothing
-- that READS that column was updated to match. This function counted a booking
-- only when the status was confirmed / cancelled / rescheduled, so the moment
-- GoHighLevel marked a meeting attended, that lead left the booked count — and
-- the leads panel, which is the NOT IN of the same list, picked it up as an
-- ordinary un-booked lead. The most booked thing that can happen to a lead
-- made it look as though it had never booked.
--
-- It is live rather than theoretical: one row is already 'completed'.
--
-- WHY no_show IS IN THE LIST TOO. The meeting was booked; somebody did not
-- turn up. That is a different fact from never having booked, and only one of
-- them is this count's question.
--
-- The list is declared ONCE as a variable rather than repeated in four
-- predicates, which is how it drifted out of step with the writer in the first
-- place. The TypeScript side has the same list exported once from
-- src/lib/leadSegments.ts for the same reason.

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_lead_counts()
 RETURNS TABLE(leads_count bigint, ghl_submissions_count bigint, leads_booked_count bigint, meetings_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  booked_count bigint;
  investor_meetings bigint;
  booked_statuses text[] := ARRAY['confirmed','cancelled','rescheduled','completed','no_show'];
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  SELECT COUNT(*)
  INTO booked_count
  FROM public.ghl_submissions g
  WHERE g.archived_at IS NULL
    AND (
      g.lead_source = 'calendar_widget'
      OR g.source_medium = 'ghl_direct_booking'
      OR g.ghl_status = ANY(booked_statuses)
    );

  SELECT COUNT(*)
  INTO investor_meetings
  FROM public.investor_bookings;

  SELECT COUNT(*)
  INTO ghl_submissions_count
  FROM public.ghl_submissions g
  WHERE g.archived_at IS NULL
    AND COALESCE(g.lead_source,'') <> 'calendar_widget'
    AND COALESCE(g.source_medium,'') <> 'ghl_direct_booking'
    AND NOT (COALESCE(g.ghl_status,'') = ANY(booked_statuses));

  WITH booked_emails AS (
    SELECT DISTINCT lower(g.lead_email) AS email
    FROM public.ghl_submissions g
    WHERE g.archived_at IS NULL
      AND (
        g.lead_source = 'calendar_widget'
        OR g.source_medium = 'ghl_direct_booking'
        OR g.ghl_status = ANY(booked_statuses)
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
      AND NOT (COALESCE(g.ghl_status,'') = ANY(booked_statuses))
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
$function$;
