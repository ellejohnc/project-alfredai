create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('alpha-digital-sync-hourly')
where exists (select 1 from cron.job where jobname = 'alpha-digital-sync-hourly');

select cron.schedule(
  'alpha-digital-sync-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://rtsrodhymtxgkuvuhtpk.supabase.co/functions/v1/alpha-digital-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0c3JvZGh5bXR4Z2t1dnVodHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NTk1OTUsImV4cCI6MjA4MjIzNTU5NX0.ZqRMNkEyWAF91jhaLunYjgORWS5oNjIBBQO7IeqrCSM'
    ),
    body := '{}'::jsonb
  );
  $$
);