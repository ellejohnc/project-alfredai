import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UnifiedLead, LEAD_SOURCE_META, LeadSource } from '@/lib/unifiedLead';
import { isBooked } from '@/lib/leadSegments';
import { cn } from '@/lib/utils';

/**
 * Which sources actually produce meetings.
 *
 * Deliberately NOT called ROI. ROI needs spend, and we capture none: every one
 * of the 1,514 Meta rows has a null campaign_id and a null utm_campaign, so a
 * cost-per-lead column would be an invented number wearing a currency symbol.
 * What IS knowable is volume and conversion, and that already answers the
 * question people ask a ROI table — where the meetings come from.
 *
 * Computed from the leads already in memory using the shared isBooked
 * classifier, so this can never disagree with the tiles above it.
 */
export function LeadSourcePerformance({
  leads,
  scopeLabel,
}: {
  leads: UnifiedLead[];
  scopeLabel: string;
}) {
  const rows = useMemo(() => {
    const acc = new Map<LeadSource, { total: number; booked: number }>();
    for (const l of leads) {
      const e = acc.get(l.source) ?? { total: 0, booked: 0 };
      e.total += 1;
      if (isBooked(l)) e.booked += 1;
      acc.set(l.source, e);
    }
    return [...acc.entries()]
      .map(([source, v]) => ({
        source,
        label: LEAD_SOURCE_META[source]?.label ?? source,
        ...v,
        rate: v.total > 0 ? (v.booked / v.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [leads]);

  const totals = useMemo(
    () => rows.reduce((a, r) => ({ total: a.total + r.total, booked: a.booked + r.booked }), { total: 0, booked: 0 }),
    [rows],
  );

  if (rows.length === 0) return null;
  const best = Math.max(...rows.map((r) => r.rate));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" /> Where the meetings come from
          <span className="ml-1 text-xs font-normal text-muted-foreground">· {scopeLabel}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Source</th>
                <th className="pb-2 pr-3 text-right font-medium">Leads</th>
                <th className="pb-2 pr-3 text-right font-medium">Booked</th>
                <th className="pb-2 text-right font-medium">Books at</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.source} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-3">{r.label}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{r.total.toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{r.booked.toLocaleString()}</td>
                  <td
                    className={cn(
                      'py-2 text-right tabular-nums',
                      r.rate === best && r.booked > 0 && 'font-semibold text-emerald-600 dark:text-emerald-400',
                    )}
                  >
                    {r.rate.toFixed(1)}%
                  </td>
                </tr>
              ))}
              <tr className="font-medium">
                <td className="pt-2 pr-3">All sources</td>
                <td className="pt-2 pr-3 text-right tabular-nums">{totals.total.toLocaleString()}</td>
                <td className="pt-2 pr-3 text-right tabular-nums">{totals.booked.toLocaleString()}</td>
                <td className="pt-2 text-right tabular-nums">
                  {totals.total > 0 ? ((totals.booked / totals.total) * 100).toFixed(1) : '0.0'}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-muted-foreground">
          <b className="text-foreground">Cost per lead is now possible.</b> This panel long said it was
          not, because <code>campaign_id</code> and <code>utm_campaign</code> are null on all 1,514 Meta
          rows we store. The attribution check on 20 Aug proved that wrong: GoHighLevel holds a campaign
          for <b className="text-foreground">25 of 25</b> sampled contacts. Nothing new has to be
          captured — the data has been there the whole time, on their side. Add spend and this table
          earns a cost column.
        </p>
      </CardContent>
    </Card>
  );
}

export default LeadSourcePerformance;
