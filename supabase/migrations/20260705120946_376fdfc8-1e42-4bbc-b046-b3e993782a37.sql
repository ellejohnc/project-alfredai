UPDATE public.feature_flags
SET is_enabled = false, updated_at = now()
WHERE flag_key = 'owner_lead_notifications_enabled';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'hourly-owner-lead-notifications') THEN
    PERFORM cron.unschedule('hourly-owner-lead-notifications');
  END IF;
END $$;