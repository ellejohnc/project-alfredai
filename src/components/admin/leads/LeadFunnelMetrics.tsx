import { useMemo, useState, useEffect } from 'react';
import { ChevronDown, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { UnifiedLead, LEAD_SOURCE_META, LeadSource } from '@/lib/unifiedLead';
import { isBooked, isIncomplete, isConfirmed } from '@/lib/leadSegments';

const COLLAPSE_KEY = 'leads-inbox-metrics-open';

const pct = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 100) : 0;

interface Props {
  /** The leads to compute the funnel over. */
  leads: UnifiedLead[];
  /** Label shown next to the heading (e.g. "all leads" or "filtered"). */
  scopeLabel: string;
}

/**
 * Read-only, collapsible lead funnel summary. Computed entirely from the passed
 * leads using the same single-source classifiers (isBooked / isIncomplete /
 * isConfirmed). No new data source, no new query. Collapse state persists.
 */
export function LeadFunnelMetrics({ leads, scopeLabel }: Props) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setOpen(window.localStorage.getItem(COLLAPSE_KEY) === '1');
  }, []);
  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      }
      return next;
    });
  };

  const { funnel, sources } = useMemo(() => {
    const captured = leads.length;
    const incomplete = leads.filter(isIncomplete).length;
    const booked = leads.filter(isBooked).length;
    const confirmed = leads.filter(isConfirmed).length;

    const funnel = [
      { key: 'captured', label: 'Captured', count: captured },
      { key: 'incomplete', label: 'Incomplete', count: incomplete },
      { key: 'booked', label: 'Booked', count: booked },
      { key: 'confirmed', label: 'Confirmed', count: confirmed },
    ];

    const bySource = new Map<LeadSource, { total: number; booked: number }>();
    for (const l of leads) {
      const s = bySource.get(l.source) ?? { total: 0, booked: 0 };
      s.total += 1;
      if (isBooked(l)) s.booked += 1;
      bySource.set(l.source, s);
    }
    const sources = Array.from(bySource.entries())
      .map(([source, v]) => ({
        source,
        label: LEAD_SOURCE_META[source]?.label ?? source,
        total: v.total,
        booked: v.booked,
        conv: pct(v.booked, v.total),
      }))
      .sort((a, b) => b.total - a.total);

    return { funnel, sources };
  }, [leads]);

  const captured = funnel[0].count;

  return (
    <Card className="border-border/60">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium min-h-[44px]"
      >
        <BarChart3 className="h-4 w-4 text-primary shrink-0" />
        <span>Funnel metrics</span>
        <span className="text-xs font-normal text-muted-foreground">({scopeLabel})</span>
        <ChevronDown
          className={cn('h-4 w-4 ml-auto text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <CardContent className="pt-0 pb-4 space-y-4">
          {/* Funnel steps */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {funnel.map((step) => (
              <div key={step.key} className="rounded-lg border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground">{step.label}</div>
                <div className="text-xl font-semibold tabular-nums">{step.count}</div>
                {step.key !== 'captured' && (
                  <div className="text-[11px] text-muted-foreground">
                    {pct(step.count, captured)}% of captured
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Source rollup */}
          {sources.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground">
                By source · booked conversion
              </div>
              <div className="space-y-1">
                {sources.map((s) => (
                  <div key={s.source} className="flex items-center gap-2 text-xs">
                    <span className="w-40 shrink-0 truncate">{s.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary/70"
                        style={{ width: `${s.conv}%` }}
                      />
                    </div>
                    <span className="w-28 shrink-0 text-right tabular-nums text-muted-foreground">
                      {s.booked}/{s.total} · {s.conv}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
