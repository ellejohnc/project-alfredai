-- Make the connector health panel tell the truth about scheduled jobs.
--
-- It reported ZERO failures for a week while one job 401'd every single night,
-- because it read cron.job_run_details — which records only whether the SQL
-- STATEMENT ran. net.http_post queues a request and returns immediately, so it
-- always succeeds at that level no matter what the call answers. Green when
-- broken is worse than no panel, because it stops anyone looking.
--
-- Two things were hiding underneath, and they point opposite ways:
--
--   1. A REAL failure. check-deleted-ghl-contacts calls verify-ghl-sync with
--      the ANON key, despite a comment in that function claiming it uses the
--      service role key. Every run: 401 "Invalid token".
--
--   2. FALSE failures. pg_net's default timeout is 5s and several of these
--      functions run far longer, so their calls were recorded as unanswered
--      when they had in fact worked. Proven by re-running the same commands at
--      a 60s timeout: alpha-digital-sync synced 2,466, sync-meta-leads matched
--      and upserted 800, sync-ghl-documents completed — all three previously
--      "no answer". So the 58-timeouts-in-a-day figure was mostly not failure.
--
-- APPLIED VIA query_database, then committed here as the record — migration
-- files in this repo are not run automatically.

create table if not exists public.cron_http_log (
  id bigserial primary key,
  jobname text not null,
  request_id bigint not null,
  created_at timestamptz not null default now()
);
create index if not exists cron_http_log_jobname_idx on public.cron_http_log (jobname, created_at desc);
create index if not exists cron_http_log_request_idx on public.cron_http_log (request_id);

alter table public.cron_http_log enable row level security;
create policy "Admins read cron http log" on public.cron_http_log for select
  using (public.is_admin(auth.uid()));

-- Every cron command was rewritten to record the request id it fired, so the
-- outcome can be read back:
--
--   with r as ( <original select net.http_post(...)> )
--   insert into public.cron_http_log(jobname, request_id) select '<job>', * from r;
--
-- Two traps worth writing down. btrim(text) strips SPACES ONLY — these commands
-- end with ";\n  ", so the newline survived, the semicolon was never removed and
-- the first attempt produced "... ); ) insert into ..." in all eleven jobs. And
-- timeout_milliseconds is injected as the FIRST named argument to net.http_post,
-- which is safe precisely because named notation ignores order.

create or replace function public.connector_health_jobs()
returns table (
  jobname text, schedule text, active boolean,
  runs_7d bigint, failed_7d bigint, last_run timestamptz, last_status text, last_error text
)
language sql security definer set search_path = public, cron, net as $$
  with sql_recent as (
    select jobid, count(*) as runs,
           count(*) filter (where status <> 'succeeded') as failed
    from cron.job_run_details
    where start_time > now() - interval '7 days'
    group by jobid
  ),
  sql_latest as (
    select distinct on (jobid) jobid, end_time, status::text as status, left(return_message, 200) as msg
    from cron.job_run_details
    where start_time > now() - interval '7 days'
    order by jobid, end_time desc
  ),
  -- Three outcomes, kept apart on purpose. A request still in the queue is
  -- PENDING, not failed: counting in-flight work as broken is the same lie as
  -- counting it as fine, pointing the other way.
  calls as (
    select l.jobname, l.created_at,
           case
             when q.id is not null then 'pending'
             when r.id is null then 'pending'
             when r.status_code is null then 'no answer'
             when r.status_code >= 400 then 'http ' || r.status_code
             else 'ok'
           end as outcome,
           coalesce(nullif(left(r.error_msg, 200), ''),
                    case when r.status_code >= 400 then left(r.content, 200) end) as msg
    from public.cron_http_log l
    left join net._http_response r on r.id = l.request_id
    left join net.http_request_queue q on q.id = l.request_id
    where l.created_at > now() - interval '7 days'
  ),
  http as (
    select jobname,
           count(*) filter (where outcome <> 'pending') as settled,
           count(*) filter (where outcome not in ('ok', 'pending')) as bad
    from calls group by jobname
  ),
  http_last as (
    select distinct on (jobname) jobname, created_at, outcome, msg
    from calls order by jobname, created_at desc
  )
  select j.jobname::text, j.schedule::text, j.active,
         -- Fall back to the statement count until a job has settled HTTP calls
         -- of its own, so a newly-wrapped job does not read as zero.
         case when coalesce(h.settled, 0) > 0 then h.settled else coalesce(sr.runs, 0) end,
         case when coalesce(h.settled, 0) > 0 then h.bad else coalesce(sr.failed, 0) end,
         coalesce(hl.created_at, sl.end_time),
         coalesce(hl.outcome, sl.status),
         case
           when hl.msg is not null then hl.msg
           when hl.outcome = 'no answer'
             then 'The call was made but never answered — timed out or unreachable.'
           when hl.outcome = 'pending' then 'Sent, waiting on a reply.'
           when hl.outcome = 'ok' then null
           when sl.status is distinct from 'succeeded' then sl.msg
         end
  from cron.job j
  left join sql_recent sr on sr.jobid = j.jobid
  left join sql_latest sl on sl.jobid = j.jobid
  left join http h on h.jobname = j.jobname
  left join http_last hl on hl.jobname = j.jobname
  order by (case when coalesce(h.settled,0) > 0 then h.bad else coalesce(sr.failed,0) end) desc, j.jobname;
$$;
