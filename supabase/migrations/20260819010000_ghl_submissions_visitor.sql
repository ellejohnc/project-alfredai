-- The Demo page reads ghl_submissions, not leads, so the visitor_id join added
-- for demo engagement did not reach it. Without this column the Started /
-- Engaged / Completed tiles have no way to tie a demo lead on that page to the
-- events that visitor produced.
alter table public.ghl_submissions
  add column if not exists visitor_id text;

create index if not exists ghl_submissions_visitor_id_idx
  on public.ghl_submissions (visitor_id)
  where visitor_id is not null;

comment on column public.ghl_submissions.visitor_id is
  'Browser visitor id shared with demo_engagement.visitor_id and leads.visitor_id, so a demo submission can be tied to that visitor''s engagement events.';
