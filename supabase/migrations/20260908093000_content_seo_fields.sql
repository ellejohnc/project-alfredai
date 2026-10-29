-- Editor-controlled SEO for every content type.
--
-- Applied through Lovable on 8 Sep and verified before this file was written:
-- all seven tables report both columns present. The file is the RECORD of a
-- change already made, not the thing that makes it — migrations in this repo
-- are not applied automatically, and two have sat here unapplied while code
-- wrote to the columns they were meant to create.
--
-- WHY BOTH COLUMNS ARE NULLABLE WITH NO DEFAULT: they are overrides, not
-- replacements. BlogPostPage already feeds post.title and post.excerpt to the
-- SEO component, and 84 posts exist right now with both of these null, so the
-- consumers fall back and today's behaviour is unchanged. A default would have
-- written a value into 172 rows that no editor chose.
--
-- The fields live in ContentForm rather than in each page's field list, so all
-- seven content types gained them in one place. Seven copies of the same two
-- fields is how the peek and the record drifted apart.

alter table blog_posts        add column if not exists seo_title text, add column if not exists seo_description text;
alter table guides_playbooks  add column if not exists seo_title text, add column if not exists seo_description text;
alter table webinars_events   add column if not exists seo_title text, add column if not exists seo_description text;
alter table documentation     add column if not exists seo_title text, add column if not exists seo_description text;
alter table faqs              add column if not exists seo_title text, add column if not exists seo_description text;
alter table testimonials      add column if not exists seo_title text, add column if not exists seo_description text;
alter table job_openings      add column if not exists seo_title text, add column if not exists seo_description text;

comment on column blog_posts.seo_title is
  'Overrides the page title in search results and social cards. Falls back to title when empty.';
comment on column blog_posts.seo_description is
  'Overrides the meta description. Falls back to excerpt when empty.';
