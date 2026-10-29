CREATE TABLE public.lead_alert_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_source text NOT NULL,
  lead_id text NOT NULL,
  alert_type text NOT NULL DEFAULT 'incomplete_booking',
  alerted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lead_source, lead_id, alert_type)
);

GRANT ALL ON public.lead_alert_log TO service_role;
GRANT SELECT ON public.lead_alert_log TO authenticated;

ALTER TABLE public.lead_alert_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view lead alert log"
ON public.lead_alert_log FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Safety switch (defaults OFF). Real sends require this flag ON *and* dryRun:false.
INSERT INTO public.feature_flags (flag_key, is_enabled, description)
VALUES ('incomplete_booking_alerts_enabled', false, 'Master ON/OFF for the alert-incomplete-bookings digest email. Must be true AND the function called with dryRun:false to actually send.')
ON CONFLICT (flag_key) DO NOTHING;