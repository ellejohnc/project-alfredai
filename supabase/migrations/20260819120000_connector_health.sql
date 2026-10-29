-- Connector health: is every scheduled job and inbound webhook working?
--
-- Written because one was not, and nothing could have told anyone.
-- check-deleted-ghl-contacts failed 7 of 7 runs in a week: it built its URL
-- and Authorization from vault secrets named SUPABASE_URL and
-- SUPABASE_SERVICE_ROLE_KEY, the vault holds neither, so both were null and
-- Postgres rejected the request row. A daily job failing daily looks exactly
-- like a daily job working.
--
-- APPLIED VIA query_database, then committed here as the record — migration
-- files in this repo are not run automatically.

create or replace function public.connector_health_jobs()
returns table (
  jobname text, schedule text, active boolean,
  runs_7d bigint, failed_7d bigint, last_run timestamptz, last_status text, last_error text
)
language sql security definer set search_path = public, cron as $$
  -- Aggregate BEFORE joining. cron.job_run_details is large and joining it
  -- whole timed the query out.
  with recent as (
    select jobid, count(*) as runs,
           count(*) filter (where status <> 'succeeded') as failed
    from cron.job_run_details
    where start_time > now() - interval '7 days'
    group by jobid
  ),
  latest as (
    select distinct on (jobid) jobid, end_time, status::text as status, left(return_message, 200) as msg
    from cron.job_run_details
    where start_time > now() - interval '7 days'
    order by jobid, end_time desc
  )
  select j.jobname::text, j.schedule::text, j.active,
         coalesce(r.runs, 0), coalesce(r.failed, 0),
         l.end_time, l.status,
         case when l.status is distinct from 'succeeded' then l.msg end
  from cron.job j
  left join recent r on r.jobid = j.jobid
  left join latest l on l.jobid = j.jobid
  order by coalesce(r.failed, 0) desc, l.end_time desc nulls first;
$$;

create or replace function public.connector_health_webhooks()
returns table (function_name text, runs bigint, failures bigint, last_run timestamptz, avg_ms numeric, last_error text)
language sql security definer set search_path = public as $$
  select w.function_name::text, count(*),
         count(*) filter (where w.status ilike 'error' or w.status ilike 'fail%' or w.http_status >= 400),
         max(w.created_at), round(avg(w.duration_ms)),
         (select left(e.error_message, 200) from webhook_logs e
           where e.function_name = w.function_name and e.error_message is not null
           order by e.created_at desc limit 1)
  from webhook_logs w group by w.function_name order by max(w.created_at) desc;
$$;

-- security definer reads cron internals, so it must not be reachable publicly.
revoke all on function public.connector_health_jobs() from public, anon;
revoke all on function public.connector_health_webhooks() from public, anon;
grant execute on function public.connector_health_jobs() to service_role;
grant execute on function public.connector_health_webhooks() to service_role;

-- The repair itself, applied with cron.alter_job(3, ...):
-- the vault lookups were replaced with the literal URL and the same bearer
-- token every other working job uses. Recorded here in words rather than SQL
-- because the statement carries a service key.
--
--   before: url := (SELECT decrypted_secret FROM vault.decrypted_secrets
--                     WHERE name = 'SUPABASE_URL') || '/functions/v1/verify-ghl-sync'
--   after:  url := 'https://<project>.supabase.co/functions/v1/verify-ghl-sync'
--
-- Same substitution for the Authorization header. To revert, put the two
-- vault lookups back — it will simply resume failing.
