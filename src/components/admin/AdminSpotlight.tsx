import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useUnifiedLeads } from '@/hooks/useUnifiedLeads';
import { useSpotlightRecords } from '@/hooks/useSpotlightRecords';
import { usePermissions } from '@/hooks/usePermissions';
import { matchesLeadSearch } from '@/lib/leadSearch';
import { LEAD_SOURCE_META, leadStatusLabel, type UnifiedLead } from '@/lib/unifiedLead';
import { recordRouteForLead } from '@/lib/leadAdminLinks';
import {
  SPOTLIGHT_PAGES,
  isPageAllowed,
  type SpotlightPage,
  type SpotlightSection,
} from '@/lib/adminSpotlightPages';
import {
  User,
  Settings,
  LayoutGrid,
  FileText,
  Receipt,
  Users,
  BarChart3,
  Inbox,
} from 'lucide-react';

/**
 * Admin Spotlight — sample S7.
 *
 * The public site already had a ⌘K palette, but it only navigates marketing
 * pages. This is the admin one: it searches the actual data — leads first,
 * then content, quotes and people, then the pages you can open — grouped by
 * type with a highlighted top result, and every result role-checked so a sales
 * rep never sees a Settings row they cannot open.
 *
 * Two faults found by using it, 21 Aug:
 *
 * 1. `Users & Roles` navigated to `/admin/users`, which is not a route, so
 *    choosing it landed on the 404 page. The destinations now live in
 *    `adminSpotlightPages.ts` and `spotlightRecordPath`, and a test walks the
 *    real `<Route>` table in `App.tsx` and fails on any that cannot resolve.
 * 2. Only fifteen pages were listed, so "global search" reached about a
 *    quarter of the admin. The registry now covers every admin route.
 *
 * A third, latent: a row matched on its KEYWORDS was then filtered back out by
 * cmdk, which matches the input against `value` — so searching "permissions"
 * found Users & Roles and then hid it. Keywords are part of `value` now.
 *
 * Leads come from the query cache the Inbox already fills, so opening this
 * costs nothing: no fetch, no spinner, and results appear as you type.
 */

const MAX_LEADS = 6;

/** Dispatch this on `document` to open Spotlight from anywhere. */
export const SPOTLIGHT_OPEN_EVENT = 'admin-spotlight:open';

/** Narrowing chips, per S7. "All" is the default and is never hidden. */
type Scope = 'all' | 'leads' | 'records' | 'pages';
const SCOPES: { key: Scope; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'leads', label: 'Leads' },
  { key: 'records', label: 'Content' },
  { key: 'pages', label: 'Pages' },
];

const SECTION_ICON: Record<SpotlightSection, typeof LayoutGrid> = {
  Leads: Inbox,
  Content: FileText,
  Insights: BarChart3,
  Settings,
};

/**
 * The row shell every result shares: a bordered icon tile, the title with its
 * detail underneath, and a muted chip on the right saying what kind of thing
 * this is. Selection is Signal Pink — a tinted ground and an inset rail on the
 * leading edge — because the Standard allows exactly one accent, and "which
 * row will Enter open" is the one thing in here worth spending it on.
 */
function rowClass() {
  return [
    'group gap-3 rounded-lg px-2 py-2',
    "data-[selected=true]:bg-primary/10 data-[selected=true]:text-foreground",
    "data-[selected=true]:shadow-[inset_2px_0_0_hsl(var(--primary))]",
  ].join(' ');
}

function RowIcon({ icon: Icon }: { icon: typeof LayoutGrid }) {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50
                 text-muted-foreground group-data-[selected=true]:border-primary/40
                 group-data-[selected=true]:bg-primary/15 group-data-[selected=true]:text-primary"
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

function RowText({ title, detail }: { title: string; detail?: string | null }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-medium leading-tight">{title}</span>
      {detail ? (
        <span className="block truncate text-xs leading-tight text-muted-foreground">{detail}</span>
      ) : null}
    </span>
  );
}

function RowChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium
                     uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
      {children}
    </kbd>
  );
}

export function AdminSpotlight() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const navigate = useNavigate();
  const perms = usePermissions();
  const { canViewLeads, userRole } = perms;

  // Reads the same cached query the Inbox fills, so this adds no fetch of its
  // own on a page that already has leads, and shares the 60s staleness rather
  // than keeping a second copy.
  const { data } = useUnifiedLeads();
  const leads = useMemo(() => data?.leads ?? [], [data]);

  // Content, quotes and people. Fetched on demand rather than cached like
  // leads, and only for the tables this role can open — see the hook.
  const records = useSpotlightRecords(query);

  // ⌘K, plus a plain DOM event so a visible button can open this without any
  // prop drilling. It was keyboard-only, which made it invisible: a feature
  // that had shipped and was working could not be found.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener('keydown', onKey);
    document.addEventListener(SPOTLIGHT_OPEN_EVENT, onOpen);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener(SPOTLIGHT_OPEN_EVENT, onOpen);
    };
  }, []);

  const pages: SpotlightPage[] = useMemo(
    () => SPOTLIGHT_PAGES.filter((p) => isPageAllowed(p.gate, perms)),
    // Only the flags the gates read — re-filtering on every render of the
    // permissions object would rebuild this list on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      perms.canViewLeads,
      perms.canManageContent,
      perms.canViewUsers,
      perms.canViewActivityLogs,
      perms.canManageScheduledJobs,
      perms.isAdmin,
      perms.isSuperAdmin,
    ],
  );

  const q = query.trim();

  const leadHits = useMemo(() => {
    if (!q || !canViewLeads) return [] as UnifiedLead[];
    const hits: UnifiedLead[] = [];
    for (const lead of leads) {
      if (
        matchesLeadSearch(q, {
          text: [lead.name, lead.email, lead.company],
          phones: [lead.phone],
        })
      ) {
        hits.push(lead);
        if (hits.length >= MAX_LEADS) break;
      }
    }
    return hits;
  }, [q, leads, canViewLeads]);

  const pageHits = useMemo(() => {
    if (!q) return pages;
    const needle = q.toLowerCase();
    return pages.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        (p.keywords ?? '').toLowerCase().includes(needle),
    );
  }, [pages, q]);

  const go = (path: string) => {
    setOpen(false);
    setQuery('');
    setScope('all');
    navigate(path);
  };

  const showLeads = scope === 'all' || scope === 'leads';
  const showRecords = scope === 'all' || scope === 'records';
  const showPages = scope === 'all' || scope === 'pages';

  const topResult = showLeads ? leadHits[0] ?? null : null;
  const restLeads = showLeads ? leadHits.slice(topResult ? 1 : 0) : [];

  const leadRow = (lead: UnifiedLead) => {
    const route = recordRouteForLead(lead);
    const source = LEAD_SOURCE_META[lead.source]?.label ?? lead.source;
    const status = leadStatusLabel(lead);
    const detail = [lead.email, lead.company, status].filter(Boolean).join(' · ');
    return (
      <CommandItem
        key={`${lead.source}:${lead.id}`}
        // Everything searchable has to be in `value` too, or cmdk hides a row
        // this component already decided was a match.
        value={`lead ${lead.source} ${lead.id} ${lead.name ?? ''} ${lead.email ?? ''} ${lead.company ?? ''} ${lead.phone ?? ''}`}
        onSelect={() => go(route.path)}
        className={rowClass()}
      >
        <RowIcon icon={User} />
        <RowText title={lead.name || lead.email || 'Lead'} detail={detail || null} />
        <RowChip>{source}</RowChip>
      </CommandItem>
    );
  };

  const totalShown =
    (showLeads ? leadHits.length : 0) +
    (showRecords ? records.length : 0) +
    (showPages ? pageHits.length : 0);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search leads, content, quotes, people, pages…"
        value={query}
        onValueChange={setQuery}
      />

      <div className="flex flex-wrap items-center gap-1.5 border-b px-3 py-2">
        {SCOPES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setScope(s.key)}
            aria-pressed={scope === s.key}
            className={
              scope === s.key
                ? 'rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground'
                : 'rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground'
            }
          >
            {s.label}
          </button>
        ))}
        <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
          {totalShown} {totalShown === 1 ? 'result' : 'results'}
        </span>
      </div>

      <CommandList className="max-h-[min(60vh,420px)] px-2 py-1">
        <CommandEmpty>
          <span className="block text-sm font-medium">Nothing matches “{q}”.</span>
          <span className="mt-1 block text-xs text-muted-foreground">
            Try a name, an email, a company, a quote reference, or a page.
          </span>
        </CommandEmpty>

        {topResult && (
          <>
            <CommandGroup heading="Top result">{leadRow(topResult)}</CommandGroup>
            <CommandSeparator />
          </>
        )}

        {restLeads.length > 0 && (
          <>
            <CommandGroup heading="Leads">{restLeads.map(leadRow)}</CommandGroup>
            <CommandSeparator />
          </>
        )}

        {showRecords &&
          (['Content', 'Quotes', 'People'] as const).map((group) => {
            const rows = records.filter((r) => r.group === group);
            if (!rows.length) return null;
            const Icon = group === 'Quotes' ? Receipt : group === 'People' ? Users : FileText;
            return (
              <div key={group}>
                <CommandGroup heading={group}>
                  {rows.map((r) => (
                    <CommandItem
                      key={r.id}
                      value={`${group} ${r.id} ${r.title} ${r.subtitle ?? ''}`}
                      onSelect={() => go(r.path)}
                      className={rowClass()}
                    >
                      <RowIcon icon={Icon} />
                      <RowText title={r.title} detail={r.subtitle} />
                      <RowChip>{group}</RowChip>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </div>
            );
          })}

        {showPages && pageHits.length > 0 && (
          <CommandGroup heading="Pages">
            {pageHits.map((p) => (
              <CommandItem
                key={p.path}
                value={`page ${p.title} ${p.keywords ?? ''}`}
                onSelect={() => go(p.path)}
                className={rowClass()}
              >
                <RowIcon icon={SECTION_ICON[p.section]} />
                <RowText title={p.title} />
                <RowChip>{p.section}</RowChip>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-3 py-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Key>↑</Key>
          <Key>↓</Key> navigate
        </span>
        <span className="flex items-center gap-1.5">
          <Key>↵</Key> open
        </span>
        <span className="flex items-center gap-1.5">
          <Key>esc</Key> close
        </span>
        {userRole ? (
          <span className="ml-auto rounded-full border border-border px-2 py-0.5 font-mono uppercase tracking-wide">
            {userRole.replace(/_/g, ' ')}
          </span>
        ) : null}
      </div>
    </CommandDialog>
  );
}

export default AdminSpotlight;
