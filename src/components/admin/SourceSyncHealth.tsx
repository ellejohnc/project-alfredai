import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, MinusCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { PostgrestQuery } from '@/lib/supabasePaging';

/**
 * How much of each lead source actually reached GoHighLevel.
 *
 * The sync page reported on ghl_submissions alone, which is the source that
 * was already fine — 794 of 802. The gaps were in the sources it never looked
 * at, and nothing on the site would have told you: alpha_digital_leads holds
 * thousands of rows with a push function that has barely ever run.
 *
 * Counts come from the server with `head: true`, so these are exact totals and
 * cannot disagree with the tables they describe — no rows are transferred and
 * no 1000-row cap applies.
 */

interface SourceHealth {
  label: string;
  total: number;
  synced: number | null; // null = this source has no way to record a GHL id
  note?: string;
}

/**
 * One count, and it never throws.
 *
 * These used to run in a single Promise.all, so ONE failing query blanked the
 * entire panel with "Could not read the source counts" — and said nothing
 * about which of the nine had failed. A per-source panel should degrade per
 * source: a row we cannot read says so, and the other eight still report.
 */
async function countRows(
  table: string,
  filter?: (q: PostgrestQuery) => PostgrestQuery,
): Promise<number | null> {
  try {
    const from = (supabase as unknown as { from: (t: string) => PostgrestQuery }).from;
    let q: PostgrestQuery = from(table).select('*', { count: 'exact', head: true });
    if (filter) q = filter(q);
    const { count, error } = await q;
    if (error) {
      console.warn(`[SourceSyncHealth] ${table}: ${error.message}`);
      return null;
    }
    return count ?? 0;
  } catch (e) {
    console.warn(`[SourceSyncHealth] ${table} threw`, e);
    return null;
  }
}

async function loadHealth(): Promise<SourceHealth[]> {
  const [
    subTotal, subSynced,
    metaTotal, metaSynced,
    alphaTotal, alphaSynced,
    leadsTotal, investorTotal, webinarTotal,
  ] = await Promise.all([
    countRows('ghl_submissions', (q) => q.is('archived_at', null)),
    countRows('ghl_submissions', (q) => q.is('archived_at', null).not('ghl_response->>ghl_contact_id', 'is', null)),
    countRows('meta_leads'),
    countRows('meta_leads', (q) => q.not('ghl_contact_id', 'is', null)),
    countRows('alpha_digital_leads'),
    countRows('alpha_digital_leads', (q) => q.not('ghl_contact_id', 'is', null)),
    countRows('leads'),
    countRows('investor_leads'),
    countRows('webinar_registrations'),
  ]);

  const n = (v: number | null) => v ?? 0;
  const unreadable = (v: number | null) => v === null;

  return [
    {
      label: 'Bookings & forms',
      total: n(subTotal),
      synced: unreadable(subSynced) ? null : n(subSynced),
      note: unreadable(subTotal) ? 'Could not read this source — see the console for the reason.' : undefined,
    },
    { label: 'Meta Lead Ads', total: n(metaTotal), synced: unreadable(metaSynced) ? null : n(metaSynced) },
    { label: 'Alpha Digital', total: n(alphaTotal), synced: unreadable(alphaSynced) ? null : n(alphaSynced) },
    {
      label: 'Site Leads',
      total: n(leadsTotal),
      synced: null,
      note: 'This table has no column to record a GoHighLevel id, so sync cannot be reported either way — not zero, unknown.',
    },
    { label: 'Investor Leads', total: n(investorTotal), synced: null, note: 'No GHL push exists for this source yet.' },
    { label: 'Webinar Leads', total: n(webinarTotal), synced: null, note: 'No GHL push exists for this source yet.' },
  ];
}

export function SourceSyncHealth() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['source-sync-health'],
    queryFn: loadHealth,
    staleTime: 60_000,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Every source, and how much of it reached GHL</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-40 rounded-lg" />}
        {isError && <p className="text-sm text-destructive">Could not read the source counts.</p>}
        {data && (
          <div className="space-y-3">
            {data.map((s) => {
              const pct = s.synced !== null && s.total > 0 ? Math.round((s.synced / s.total) * 100) : null;
              const gap = s.synced !== null ? s.total - s.synced : null;
              const bad = pct !== null && pct < 50 && s.total > 0;
              const good = pct !== null && pct >= 95;
              return (
                <div key={s.label} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex items-center gap-1.5 font-medium">
                      {s.synced === null ? (
                        <MinusCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      ) : good ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      ) : (
                        <AlertTriangle className={cn('h-3.5 w-3.5 shrink-0', bad ? 'text-destructive' : 'text-amber-500')} />
                      )}
                      {s.label}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {s.synced === null
                        ? `${s.total.toLocaleString()} rows · sync not tracked`
                        : `${s.synced.toLocaleString()} of ${s.total.toLocaleString()} in GHL${pct !== null ? ` · ${pct}%` : ''}`}
                    </span>
                  </div>

                  {pct !== null && (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn('h-full rounded-full', bad ? 'bg-destructive' : good ? 'bg-emerald-500' : 'bg-amber-500')}
                        style={{ width: `${Math.max(pct, 1)}%` }}
                      />
                    </div>
                  )}

                  {gap !== null && gap > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {gap.toLocaleString()} not in GoHighLevel.
                    </p>
                  )}
                  {s.note && <p className="text-xs text-muted-foreground">{s.note}</p>}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SourceSyncHealth;
