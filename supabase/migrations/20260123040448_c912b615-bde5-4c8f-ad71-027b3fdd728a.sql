-- Create a scheduled job to check for deleted GHL contacts daily
-- This will run at 3:00 AM UTC every day
SELECT cron.schedule(
  'check-deleted-ghl-contacts',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/verify-ghl-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body := jsonb_build_object(
      'verify_all_pending', true,
      'check_deleted', true,
      'source', 'all',
      'batch_limit', 30,
      'scheduled_run', true
    )
  );
  $$
);