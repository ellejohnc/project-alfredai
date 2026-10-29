import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, FileWarning } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Which content has gone stale, and what has been orphaned.
 *
 * NOT a drafts-vs-published view, which is what was originally asked for —
 * every one of the seven content types is 100% published and there is not a
 * single draft anywhere, so that split would render an empty panel and call it
 * health. What is actually wrong is age: several types have not been touched
 * since December.
 *
 * Counts are server-side with head:true, so they are exact and no rows travel.
 */

const STALE_DAYS = 120;

interface Row {
  label: string;
  table: string;
  path: string;
  total: number;
  lastTouched: string | null;
  orphanNote?: string;
  /** Where the note's subject actually lives, when it is not this row's own page. */
  notePath?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST's builder type is not nameable for a dynamic table string.
type Q = any;
const from = (t: string) => (supabase as unknown as { from: (t: string) => Q }).from(t);

async function loadRow(label: string, table: string, path: string, dateCol = 'updated_at'): Promise<Row> {
  const [{ count }, { data }] = await Promise.all([
    from(table).select('*', { count: 'exact', head: true }),
    from(table).select(dateCol).order(dateCol, { ascending: false }).limit(1),
  ]);
  return {
    label,
    table,
    path,
    total: count ?? 0,
    lastTouched: (data?.[0] as Record<string, string> | undefined)?.[dateCol] ?? null,
  };
}

async function loadHealth(): Promise<Row[]> {
  const rows = await Promise.all([
    loadRow('Blog posts', 'blog_posts', '/admin/blog'),
    loadRow('Guides & playbooks', 'guides_playbooks', '/admin/guides'),
    loadRow('Webinars', 'webinars_events', '/admin/webinars'),
    loadRow('Documentation', 'documentation', '/admin/docs'),
    loadRow('FAQs', 'faqs', '/admin/faqs'),
    loadRow('Testimonials', 'testimonials', '/admin/testimonials'),
    loadRow('Job openings', 'job_openings', '/admin/jobs'),
  ]);

  // This used to read "N applications on file with no openings to belong to",
  // and it was WRONG — it went into a finding and onto the board from here.
  // All three applications carry is_general_application = true and job_id =
  // null, because the Careers page deliberately offers a general form when
  // there are no openings. They are not orphans; they are exactly what that
  // form is for.
  //
  // What IS wrong is that nobody has looked at them. Every one is still
  // status 'new', the oldest since January, and no surface anywhere counts
  // them — so three real people applied and nothing said so. That is the
  // number worth putting on a health panel.
  const { count: unreviewed } = await from('job_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new');
  const { data: oldest } = await from('job_applications')
    .select('created_at')
    .eq('status', 'new')
    .order('created_at', { ascending: true })
    .limit(1);
  const jobs = rows.find((r) => r.table === 'job_openings');
  if (jobs && (unreviewed ?? 0) > 0) {
    const since = (oldest?.[0] as Record<string, string> | undefined)?.created_at;
    const waited = since
      ? Math.floor((Date.now() - new Date(since).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    jobs.orphanNote =
      `${unreviewed} job application${unreviewed === 1 ? '' : 's'} not yet reviewed` +
      (waited !== null ? ` — the oldest has waited ${waited} days.` : '.');
    // The applications are not on the openings page, so the note needs its own
    // destination. A number nobody can click through to is how these sat for
    // seven months.
    jobs.notePath = '/admin/job-applications';
  }

  // The loudest content fault we have was not on the content-health panel at
  // all — it lived in the findings log, which is not where anyone looks to ask
  // "what needs attention?". Every published event has already happened, so
  // the public site has nothing to advertise and both registration tables read
  // zero as a consequence rather than as a bug.
  //
  // Age does not catch this: a webinar edited yesterday can still be an event
  // from April. It needs its own question — how many are still ahead of us.
  const nowIso = new Date().toISOString();
  const { count: upcoming } = await from('webinars_events')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .gte('event_date', nowIso);
  const webinars = rows.find((r) => r.table === 'webinars_events');
  if (webinars && webinars.total > 0 && (upcoming ?? 0) === 0) {
    const { data: latest } = await from('webinars_events')
      .select('event_date')
      .eq('status', 'published')
      .order('event_date', { ascending: false })
      .limit(1);
    const last = (latest?.[0] as Record<string, string> | undefined)?.event_date;
    webinars.orphanNote =
      'Every published event is in the past' +
      (last ? ` — the most recent was ${new Date(last).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}.` : '.') +
      ' Nothing upcoming to advertise.';
    webinars.notePath = '/admin/webinars';
  }

  return rows;
}

const daysSince = (iso: string | null) =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : null;

export function ContentHealth() {
  const { isAdmin } = usePermissions();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['content-health'],
    enabled: isAdmin,
    staleTime: 5 * 60_000,
    queryFn: loadHealth,
  });

  if (!isAdmin) return null;

  const stale = (data ?? []).filter((r) => {
    const d = daysSince(r.lastTouched);
    return d !== null && d > STALE_DAYS;
  });
  const empty = (data ?? []).filter((r) => r.total === 0);
  // A row can be current and full and still need attention — the webinars note
  // is the case in point. Counting only stale and empty would call the panel
  // "Everything current" while every event on the site had already happened.
  const flagged = (data ?? []).filter((r) => r.orphanNote);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileWarning className="h-4 w-4 text-primary" /> Content health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {isLoading && <Skeleton className="h-40 rounded-lg" />}
        {isError && <p className="text-destructive">Could not read content health.</p>}

        {data && (
          <>
            <p className={cn('font-medium', stale.length || empty.length || flagged.length ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')}>
              {stale.length || empty.length || flagged.length
                ? [
                    stale.length ? `${stale.length} type${stale.length === 1 ? '' : 's'} untouched for over ${STALE_DAYS} days` : null,
                    empty.length ? `${empty.length} empty` : null,
                    flagged.length ? `${flagged.length} needing attention` : null,
                  ].filter(Boolean).join(' · ')
                : 'Everything current.'}
            </p>

            <ul className="space-y-2">
              {data.map((r) => {
                const d = daysSince(r.lastTouched);
                const isStale = d !== null && d > STALE_DAYS;
                const isEmpty = r.total === 0;
                return (
                  <li key={r.table} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-border/50 pb-2 last:border-0">
                    <Link to={r.path} className="flex items-center gap-1.5 font-medium hover:underline">
                      {isEmpty || isStale ? (
                        <AlertTriangle className={cn('h-3.5 w-3.5 shrink-0', isEmpty ? 'text-destructive' : 'text-amber-500')} />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      )}
                      {r.label}
                    </Link>
                    <span className="tabular-nums text-xs text-muted-foreground">
                      {r.total.toLocaleString()} item{r.total === 1 ? '' : 's'}
                      {d !== null ? ` · last edited ${d}d ago` : ' · never edited'}
                    </span>
                    {r.orphanNote && (
                      r.notePath ? (
                        <Link to={r.notePath} className="w-full text-xs text-destructive underline-offset-2 hover:underline">
                          {r.orphanNote}
                        </Link>
                      ) : (
                        <span className="w-full text-xs text-destructive">{r.orphanNote}</span>
                      )
                    )}
                  </li>
                );
              })}
            </ul>

            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-muted-foreground">
              This deliberately does not chart drafts against published. Every type is 100% published
              and there is not one draft on the system, so that split would show an empty bar and
              call it health. Age and orphans are what is actually wrong.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ContentHealth;
