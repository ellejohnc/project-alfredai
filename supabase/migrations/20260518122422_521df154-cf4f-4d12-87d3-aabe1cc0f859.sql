-- FAQ engagement tracking: records every time a visitor opens an FAQ question
CREATE TABLE public.faq_engagement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  visitor_email TEXT,
  faq_slug TEXT NOT NULL,
  faq_group TEXT,
  faq_question TEXT NOT NULL,
  page_path TEXT NOT NULL,
  source TEXT,
  medium TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_faq_engagement_slug ON public.faq_engagement(faq_slug);
CREATE INDEX idx_faq_engagement_session ON public.faq_engagement(session_id);
CREATE INDEX idx_faq_engagement_email ON public.faq_engagement(lower(visitor_email));
CREATE INDEX idx_faq_engagement_created_at ON public.faq_engagement(created_at DESC);

ALTER TABLE public.faq_engagement ENABLE ROW LEVEL SECURITY;

-- Anyone (anonymous + authed) can insert tracking events
CREATE POLICY "Anyone can log FAQ engagement"
  ON public.faq_engagement
  FOR INSERT
  WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can view FAQ engagement"
  ON public.faq_engagement
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Only admins can delete (for cleanup)
CREATE POLICY "Admins can delete FAQ engagement"
  ON public.faq_engagement
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Conversion funnel view: joins each FAQ open to any booking / lead submission
-- sharing the same session_id or normalised email within 30 days after the open.
CREATE OR REPLACE VIEW public.faq_engagement_funnel
WITH (security_invoker = true)
AS
SELECT
  fe.id                    AS engagement_id,
  fe.created_at            AS opened_at,
  fe.faq_slug,
  fe.faq_group,
  fe.faq_question,
  fe.page_path,
  fe.session_id,
  lower(fe.visitor_email)  AS visitor_email,
  fe.source,
  fe.medium,
  g.id                     AS submission_id,
  g.created_at             AS submitted_at,
  lower(g.lead_email)      AS lead_email,
  g.lead_source,
  g.source_medium,
  g.ghl_status,
  CASE
    WHEN g.id IS NULL THEN false
    ELSE true
  END                      AS converted,
  CASE
    WHEN g.lead_source = 'calendar_widget'
      OR g.source_medium = 'ghl_direct_booking'
      OR g.ghl_status IN ('confirmed','cancelled','rescheduled')
    THEN true
    ELSE false
  END                      AS booked
FROM public.faq_engagement fe
LEFT JOIN LATERAL (
  SELECT g.*
  FROM public.ghl_submissions g
  WHERE g.archived_at IS NULL
    AND g.created_at >= fe.created_at
    AND g.created_at <= fe.created_at + INTERVAL '30 days'
    AND (
      (fe.visitor_email IS NOT NULL AND lower(g.lead_email) = lower(fe.visitor_email))
    )
  ORDER BY g.created_at ASC
  LIMIT 1
) g ON true;

-- Only admins can read the funnel view
REVOKE ALL ON public.faq_engagement_funnel FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.faq_engagement_funnel TO authenticated;