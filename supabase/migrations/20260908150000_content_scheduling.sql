-- Scheduled publishing for every content type.
--
-- Applied through Lovable on 8 Sep and verified before this file was written:
-- all seven tables report the column present. This file is the RECORD of a
-- change already made — migrations here are not applied automatically, and two
-- have previously sat unapplied while code wrote to the columns they created.
--
-- NULLABLE WITH NO DEFAULT, and the reason matters more than the type. A
-- default would put a schedule on 172 existing rows that nobody asked for, and
-- publish-scheduled-content publishes on exactly this signal. Null means "no
-- schedule", which is what everything currently is.
--
-- The partial indexes are on `status = 'draft'` because that is the only state
-- the job can act on. There are zero drafts in the system today, so the job
-- does nothing at all until somebody schedules something — safe by
-- construction rather than by care.

alter table blog_posts        add column if not exists scheduled_for timestamptz;
alter table guides_playbooks  add column if not exists scheduled_for timestamptz;
alter table webinars_events   add column if not exists scheduled_for timestamptz;
alter table documentation     add column if not exists scheduled_for timestamptz;
alter table faqs              add column if not exists scheduled_for timestamptz;
alter table testimonials      add column if not exists scheduled_for timestamptz;
alter table job_openings      add column if not exists scheduled_for timestamptz;

create index if not exists blog_posts_scheduled_idx    on blog_posts (scheduled_for)       where status = 'draft';
create index if not exists guides_scheduled_idx        on guides_playbooks (scheduled_for) where status = 'draft';
create index if not exists webinars_scheduled_idx      on webinars_events (scheduled_for)  where status = 'draft';
create index if not exists documentation_scheduled_idx on documentation (scheduled_for)    where status = 'draft';
create index if not exists faqs_scheduled_idx          on faqs (scheduled_for)             where status = 'draft';
create index if not exists testimonials_scheduled_idx  on testimonials (scheduled_for)     where status = 'draft';
create index if not exists job_openings_scheduled_idx  on job_openings (scheduled_for)     where status = 'draft';

comment on column blog_posts.scheduled_for is
  'When a DRAFT should go live. publish-scheduled-content flips draft to published once this passes, and clears this column in the same update so it cannot fire twice. Null means no schedule. Ignored on anything not in draft.';
