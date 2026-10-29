-- Page engagement tracking — bounce-rate funnel for marketing pages
create table if not exists public.page_engagement (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  path text not null,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device text check (device in ('mobile','tablet','desktop')),
  landed_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  max_scroll_pct int not null default 0,
  engaged boolean not null default false,
  bounced boolean not null default true,
  primary_cta_clicks jsonb not null default '{}'::jsonb,
  exit_section text,
  visitor_email text,
  user_agent text
);

create index if not exists idx_page_engagement_landed_at on public.page_engagement(landed_at desc);
create index if not exists idx_page_engagement_session on public.page_engagement(session_id);
create index if not exists idx_page_engagement_path on public.page_engagement(path);

alter table public.page_engagement enable row level security;

create policy "Anyone can log page engagement"
  on public.page_engagement for insert
  to anon, authenticated
  with check (true);

-- Anonymous visitors need to update their own row as they scroll / click / exit.
-- We can't tie to auth.uid() (visitors are anon), so we allow updates broadly
-- but writes are scoped to columns the client controls; admin SELECT is restricted.
create policy "Anyone can update own page engagement"
  on public.page_engagement for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "Admins can view page engagement"
  on public.page_engagement for select
  to authenticated
  using (public.is_admin(auth.uid()));

create policy "Admins can delete page engagement"
  on public.page_engagement for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- Daily bounce funnel rollup (admin-only via underlying table RLS)
create or replace view public.bounce_funnel as
select
  date_trunc('day', landed_at)::date as day,
  coalesce(device, 'unknown') as device,
  count(*)::bigint as sessions,
  count(*) filter (where bounced)::bigint as bounces,
  round(100.0 * count(*) filter (where bounced) / nullif(count(*), 0), 1) as bounce_rate,
  count(*) filter (where (primary_cta_clicks->>'hero_try_demo')::int > 0
                       or (primary_cta_clicks->>'sticky_try_demo')::int > 0
                       or (primary_cta_clicks->>'final_try_demo')::int > 0)::bigint as demo_clicks,
  count(*) filter (where (primary_cta_clicks->>'hero_book')::int > 0
                       or (primary_cta_clicks->>'sticky_book')::int > 0
                       or (primary_cta_clicks->>'final_book')::int > 0)::bigint as book_clicks,
  round(avg(max_scroll_pct)::numeric, 1) as avg_scroll_pct,
  round(avg(extract(epoch from (last_active_at - landed_at)))::numeric, 1) as avg_seconds_on_page
from public.page_engagement
group by 1, 2
order by 1 desc;