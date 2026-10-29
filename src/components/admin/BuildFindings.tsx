import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LeadPanelErrorState } from '@/components/admin/LeadPanelErrorState';
import type { PostgrestQuery } from '@/lib/supabasePaging';

/**
 * The findings log, read from the database instead of retyped into a doc.
 *
 * It lived in the Leads Build artifact, which meant every fault had to be
 * hand-copied into HTML — so it went stale constantly, in both directions:
 * gaps that were long fixed still listed, and things recorded as done that
 * were not. The working agreement already said to prefer linking to the live
 * surface over restating its numbers; this is that surface.
 *
 * Written once, when the fault is found or fixed. Never transcribed again.
 */
interface Finding {
  id: string;
  found_on: string;
  area: string;
  title: string;
  what_broke: string;
  state: 'open' | 'fixed' | 'blocked' | 'wont_fix' | 'monitoring';
  resolution: string | null;
  phase: string | null;
  is_doc_error: boolean;
}

const STATE_TONE: Record<Finding['state'], string> = {
  open: 'border-amber-500/40 bg-amber-500/10 text-amber-500',
  fixed: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500',
  blocked: 'border-rose-500/40 bg-rose-500/10 text-rose-500',
  wont_fix: 'border-border bg-muted text-muted-foreground',
  monitoring: 'border-sky-500/40 bg-sky-500/10 text-sky-500',
};

const STATE_LABEL: Record<Finding['state'], string> = {
  open: 'Open',
  fixed: 'Fixed',
  blocked: 'Blocked',
  wont_fix: "Won't fix",
  monitoring: 'Monitoring',
};

export function BuildFindings() {
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['build-findings'],
    queryFn: async (): Promise<Finding[]> => {
      // build_findings is newer than the generated Database types, which
      // Lovable regenerates on its own schedule. Same escape hatch
      // supabasePaging uses rather than blocking on that regeneration.
      const { data, error } = await (supabase as unknown as {
        from: (t: string) => PostgrestQuery;
      })
        .from('build_findings')
        .select('id, found_on, area, title, what_broke, state, resolution, phase, is_doc_error')
        .order('found_on', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Finding[];
    },
    staleTime: 60_000,
  });

  const findings = useMemo(() => data ?? [], [data]);
  // Open ones first — the list exists to make what is still wrong findable.
  const sorted = useMemo(
    () => [...findings].sort((a, b) => Number(b.state === 'open') - Number(a.state === 'open')),
    [findings],
  );
  const shown = showAll ? sorted : sorted.slice(0, 8);
  const openCount = findings.filter((f) => f.state === 'open').length;
  const docErrors = findings.filter((f) => f.is_doc_error).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <ClipboardList className="h-4 w-4 text-primary" /> Findings log
          <span className="text-xs font-normal text-muted-foreground">
            {findings.length} total · {openCount} open
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Every fault found while building, including the ones already fixed — and especially the
          ones where a doc was wrong. Read from the database, so it cannot drift from what was
          actually recorded.
        </p>

        {docErrors > 0 && (
          <p className="flex items-start gap-1.5 text-xs text-amber-500">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
            {docErrors} of these were a doc claiming something the code did not do. Those are the
            expensive ones — a wrong guide stops anyone looking.
          </p>
        )}

        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {error && (
          <LeadPanelErrorState
            message="Could not read the findings log."
            panelName="Findings log"
          />
        )}

        {shown.map((f) => (
          <div key={f.id} className="space-y-1 rounded-lg border border-border bg-muted/40 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={`text-[10px] ${STATE_TONE[f.state]}`}>
                {STATE_LABEL[f.state]}
              </Badge>
              <span className="font-medium">{f.title}</span>
              <span className="ml-auto text-[11px] text-muted-foreground">
                {f.area}
                {f.phase ? ` · Phase ${f.phase}` : ''} · {f.found_on}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{f.what_broke}</p>
            {f.resolution && (
              <p className="text-xs text-emerald-500/90">{f.resolution}</p>
            )}
          </div>
        ))}

        {sorted.length > 8 && (
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Show fewer' : `Show all ${sorted.length}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default BuildFindings;
