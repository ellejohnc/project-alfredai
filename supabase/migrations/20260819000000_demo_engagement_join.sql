-- The Demo surfaces were designed around engagement — watch time, steps
-- completed, what they viewed — and none of it could be reported, because
-- demo_engagement rows and leads rows had nothing in common to join on.
-- Events carried a visitor_id; leads carried none. This is that join.
alter table public.leads
  add column if not exists visitor_id text;

create index if not exists leads_visitor_id_idx
  on public.leads (visitor_id)
  where visitor_id is not null;

-- demo_engagement.visitor_id is already written but had no index, and every
-- engagement rollup groups by it.
create index if not exists demo_engagement_visitor_id_idx
  on public.demo_engagement (visitor_id)
  where visitor_id is not null;

create index if not exists demo_engagement_demo_event_idx
  on public.demo_engagement (demo_id, event_type);

comment on column public.leads.visitor_id is
  'Browser visitor id shared with demo_engagement.visitor_id, so a demo lead can be tied to the events that visitor produced. Written by the demo capture forms.';
