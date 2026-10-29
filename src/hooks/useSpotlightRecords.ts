import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';

/**
 * The non-lead half of Spotlight.
 *
 * Spotlight searched leads and a hardcoded list of 13 page names, which made
 * "global search" true only for leads — a quote, a blog post or a webinar was
 * unreachable from it. The Master Plan calls for a role-protected GLOBAL
 * search, so this adds the records the rest of the admin is made of.
 *
 * Leads deliberately stay where they are: they come from the Inbox's query
 * cache and cost nothing. These do not, so they are fetched only once someone
 * has typed something worth searching for, and only for the tables that
 * person's role can open — the gate is applied BEFORE the query is built, so
 * an editor's search never even asks the database about quotes.
 */

/**
 * Every destination this hook can produce, in one place.
 *
 * Two of these were wrong and both ended on the 404 page: documentation
 * pointed at `/admin/documentation` (the route is `/admin/docs`) and a person
 * at `/admin/users` (the route is `/admin/settings/users`). They are builders
 * rather than strings so `adminSpotlightRoutes.test.ts` can call each one and
 * check the result against the real `<Route>` table.
 *
 * Content now opens the RECORD, not the list it sits in — searching for a post
 * by name and landing on a list of every post is barely better than not
 * finding it. Quotes have no record route yet, so they still open the list.
 */
export const spotlightRecordPath = {
  blogPost: (id: string) => `/admin/blog/${id}`,
  documentation: (id: string) => `/admin/docs/${id}`,
  webinar: (id: string) => `/admin/webinars/${id}`,
  quotes: () => '/admin/quotes',
  person: () => '/admin/settings/users',
} as const;

export interface SpotlightRecord {
  id: string;
  group: 'Content' | 'Quotes' | 'People';
  title: string;
  subtitle: string | null;
  path: string;
}

/** Below this a search matches almost everything and is just noise. */
const MIN_QUERY = 2;
const PER_TABLE = 5;

/** PostgREST `or` needs commas escaped or the filter list is split wrongly. */
const safe = (q: string) => q.replace(/[,()]/g, ' ').trim();

async function search(q: string, perms: {
  content: boolean;
  quotes: boolean;
  people: boolean;
}): Promise<SpotlightRecord[]> {
  const needle = `%${safe(q)}%`;
  const out: SpotlightRecord[] = [];

  const tasks: PromiseLike<void>[] = [];

  if (perms.content) {
    tasks.push(
      supabase.from('blog_posts').select('id, title, slug, status').ilike('title', needle).limit(PER_TABLE)
        .then(({ data }) => {
          for (const r of data ?? []) {
            out.push({ id: `blog:${r.id}`, group: 'Content', title: r.title ?? 'Untitled',
              subtitle: `Blog · ${r.status ?? 'draft'}`, path: spotlightRecordPath.blogPost(r.id) });
          }
        }),
      supabase.from('documentation').select('id, title, slug, status').ilike('title', needle).limit(PER_TABLE)
        .then(({ data }) => {
          for (const r of data ?? []) {
            out.push({ id: `doc:${r.id}`, group: 'Content', title: r.title ?? 'Untitled',
              subtitle: `Documentation · ${r.status ?? 'draft'}`, path: spotlightRecordPath.documentation(r.id) });
          }
        }),
      supabase.from('webinars_events').select('id, title, event_date, status').ilike('title', needle).limit(PER_TABLE)
        .then(({ data }) => {
          for (const r of data ?? []) {
            const when = r.event_date ? new Date(r.event_date).toLocaleDateString() : null;
            out.push({ id: `event:${r.id}`, group: 'Content', title: r.title ?? 'Untitled',
              subtitle: when ? `Webinar · ${when}` : 'Webinar', path: spotlightRecordPath.webinar(r.id) });
          }
        }),
    );
  }

  if (perms.quotes) {
    tasks.push(
      supabase.from('quotes')
        .select('id, quote_id, company_name, contact_name, status')
        // A quote is looked up by its reference as often as by the client name.
        .or(`company_name.ilike.${needle},contact_name.ilike.${needle},quote_id.ilike.${needle}`)
        .limit(PER_TABLE)
        .then(({ data }) => {
          for (const r of data ?? []) {
            out.push({ id: `quote:${r.id}`, group: 'Quotes',
              title: r.company_name || r.contact_name || r.quote_id || 'Quote',
              subtitle: [r.quote_id, r.status].filter(Boolean).join(' · ') || null,
              path: spotlightRecordPath.quotes() });
          }
        }),
    );
  }

  if (perms.people) {
    tasks.push(
      supabase.from('admin_users').select('id, display_name, email, role')
        .or(`display_name.ilike.${needle},email.ilike.${needle}`)
        .limit(PER_TABLE)
        .then(({ data }) => {
          for (const r of data ?? []) {
            out.push({ id: `user:${r.id}`, group: 'People',
              title: r.display_name || r.email || 'Team member',
              subtitle: [r.email, r.role].filter(Boolean).join(' · ') || null,
              path: spotlightRecordPath.person() });
          }
        }),
    );
  }

  // Never dead-end the palette: one failing table must not blank the rest,
  // and a search that errors should return what it found, not nothing.
  await Promise.allSettled(tasks);
  return out;
}

export function useSpotlightRecords(query: string) {
  const { canManageContent, isAdmin, isSuperAdmin, canViewUsers } = usePermissions();
  const q = query.trim();

  const perms = {
    content: canManageContent || isAdmin,
    quotes: isAdmin,
    people: isSuperAdmin || canViewUsers,
  };
  const anyAllowed = perms.content || perms.quotes || perms.people;

  const { data } = useQuery({
    queryKey: ['spotlight-records', q, perms.content, perms.quotes, perms.people],
    queryFn: () => search(q, perms),
    enabled: q.length >= MIN_QUERY && anyAllowed,
    staleTime: 30_000,
  });

  return data ?? [];
}
