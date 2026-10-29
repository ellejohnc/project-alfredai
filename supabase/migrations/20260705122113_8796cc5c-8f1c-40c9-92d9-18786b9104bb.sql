-- Repurpose owner notifications into a team booked/synced digest to the group inbox.
-- Add the new enabled flag (default FALSE per function safety design), then arm it.
INSERT INTO public.feature_flags (flag_key, is_enabled, description)
VALUES ('booked_synced_alerts_enabled', false,
  'Enables the hourly booked/synced lead digest sent to the sales@ group inbox (notify-lead-owner).')
ON CONFLICT (flag_key) DO NOTHING;

-- The old owner-routed flag is no longer used by any function.
UPDATE public.feature_flags SET is_enabled = false WHERE flag_key = 'owner_lead_notifications_enabled';

-- Remove old owner-routed dedup rows so nothing carries over.
DELETE FROM public.lead_alert_log WHERE alert_type = 'owner_notified';
