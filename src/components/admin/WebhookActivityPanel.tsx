import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Activity, ArrowUpRight, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Webhook activity, on the page that asks the question.
 *
 * The board's Phase 4 · S2 task reads: "every submission with its GHL sync
 * state — synced / not-synced / failed — filter by state and re-push the
 * failed ones. Consolidated with Webhook logs."
 *
 * The filtering and the retry were already built. The consolidation was not:
 * webhook_logs lived only on /admin/webhook-logs, so answering "why did this
 * one not sync?" meant leaving the page, losing the filter, and matching rows
 * up by eye.
 *
 * This is NOT a merge of the two pages. The full log keeps its own page for
 * searching and payload inspection; this shows the recent traffic beside the
 * submissions so the two are read together. Deliberately capped and ordered
 * newest-first — it answers "what has GoHighLevel been doing", not "find me
 * that one request from March", which is what the full page is for.
 *
 * It does NOT go in the peek. The Standard is explicit that the peek never
 * grows, and GHL Submissions is a sync-health view rather than a lead surface,
 * so the panel belongs on the page itself.
 */

const RECENT_LIMIT = 25;

interface WebhookLogRow {
  id: string;
  function_name: string | null;
  status: string | null;
  http_status: number | null;
  lead_email: string | null;
  message: string | null;
  error_message: string | null;
  created_at: string;
}

type StateFilter = 'all' | 'trouble';

/** Colour by outcome, not by decoration — green synced, amber waiting, red failed. */
function toneFor(status: string | null, httpStatus: number | null): string {
  if (status === 'error' || status === 'rejected' || (httpStatus !== null && httpStatus >= 400)) {
    return 'bg-red-500/15 text-red-700 border-red-500/30';
  }
  if (status === 'processed' || status === 'matched') {
    return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30';
  }
  return 'bg-amber-500/15 text-amber-700 border-amber-500/30';
}

function isTrouble(l: WebhookLogRow): boolean {
  return (
    l.status === 'error' ||
    l.status === 'rejected' ||
    (l.http_status !== null && l.http_status >= 400) ||
    !!l.error_message
  );
}

export function WebhookActivityPanel() {
  const [filter, setFilter] = useState<StateFilter>('all');

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ['webhook-activity-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('id, function_name, status, http_status, lead_email, message, error_message, created_at')
        .order('created_at', { ascending: false })
        .limit(RECENT_LIMIT);
      if (error) throw error;
      return (data ?? []) as WebhookLogRow[];
    },
    staleTime: 60 * 1000,
  });

  const rows = useMemo(() => {
    const all = data ?? [];
    return filter === 'trouble' ? all.filter(isTrouble) : all;
  }, [data, filter]);

  const troubleCount = useMemo(() => (data ?? []).filter(isTrouble).length, [data]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          What GoHighLevel has been sending us
        </CardTitle>
        <div className="flex items-center gap-1.5">
          <Button
            variant={filter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setFilter('all')}
          >
            Last {RECENT_LIMIT}
          </Button>
          <Button
            variant={filter === 'trouble' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setFilter('trouble')}
          >
            Rejected &amp; errors{troubleCount ? ` (${troubleCount})` : ''}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh webhook activity"
          >
            {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        {error && (
          <p className="text-destructive">
            We could not load webhook activity. Refresh, or open the full log below.
          </p>
        )}

        {isLoading && (
          <p className="text-muted-foreground">Loading recent webhook activity…</p>
        )}

        {!isLoading && !error && rows.length === 0 && (
          <p className="text-muted-foreground">
            {filter === 'trouble'
              ? `Nothing rejected or errored in the last ${RECENT_LIMIT} deliveries.`
              : 'No webhook deliveries recorded yet.'}
          </p>
        )}

        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <ul className="min-w-[560px] divide-y divide-border">
              {rows.map((l) => (
                <li key={l.id} className="grid grid-cols-[auto_1fr_auto] items-start gap-3 py-2">
                  <span
                    className={cn(
                      'rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                      toneFor(l.status, l.http_status),
                    )}
                  >
                    {l.status ?? 'unknown'}
                    {l.http_status !== null ? ` ${l.http_status}` : ''}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-foreground">
                      {l.message ?? l.error_message ?? '—'}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {l.function_name ?? 'unknown function'}
                      {l.lead_email ? ` · ${l.lead_email}` : ''}
                    </span>
                  </span>
                  <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                    {new Date(l.created_at).toLocaleString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-1">
          <Link
            to="/admin/webhook-logs"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Full webhook log — search, filter and read payloads
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default WebhookActivityPanel;
