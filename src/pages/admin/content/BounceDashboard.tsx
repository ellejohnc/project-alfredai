import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/supabasePaging";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, TrendingDown, MousePointerClick, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";

interface FunnelRow {
  day: string;
  device: string;
  sessions: number;
  bounces: number;
  bounce_rate: number | null;
  demo_clicks: number;
  book_clicks: number;
  avg_scroll_pct: number | null;
  avg_seconds_on_page: number | null;
}

interface ExitRow {
  exit_section: string | null;
  count: number;
}

const BounceDashboard = () => {
  const [rows, setRows] = useState<FunnelRow[] | null>(null);
  const [exits, setExits] = useState<ExitRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data: funnel, error: funnelErr } = await supabase
          .from("bounce_funnel" as never)
          .select("*")
          .limit(60);
        if (funnelErr) throw funnelErr;

        // Paged, not `.limit(1000)`. PostgREST caps a response at 1000 rows, so
        // the cap this used to carry meant "the first thousand, silently" — and
        // there were 1,418 bounced rows in the window when it was found, so the
        // exit breakdown below was built from about 70% of the data and drawn as
        // if it were the whole picture. The aggregation is client-side, which is
        // exactly why the missing 30% was invisible: the chart still rendered.
        const since = new Date(Date.now() - 14 * 86400_000).toISOString();
        const exitRows = await fetchAllRows<{ exit_section: string | null }>(
          "page_engagement",
          (q) => q.eq("bounced", true).eq("is_bot", false).gte("landed_at", since),
          "exit_section",
          "landed_at",
        );

        if (cancelled) return;
        setRows((funnel as unknown as FunnelRow[]) ?? []);

        // Aggregate exit sections client-side
        const counts = new Map<string, number>();
        (exitRows ?? []).forEach((r) => {
          const key = (r.exit_section as string | null) ?? "(none — left immediately)";
          counts.set(key, (counts.get(key) ?? 0) + 1);
        });
        const aggregated = [...counts.entries()]
          .map(([exit_section, count]) => ({ exit_section, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        setExits(aggregated);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load bounce data");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Roll up KPIs from last 7 days ----
  const last7 = (rows ?? []).filter(
    (r) => new Date(r.day).getTime() >= Date.now() - 7 * 86400_000
  );
  const sumSessions = last7.reduce((a, r) => a + (r.sessions ?? 0), 0);
  const sumBounces = last7.reduce((a, r) => a + (r.bounces ?? 0), 0);
  const sumDemoClicks = last7.reduce((a, r) => a + (r.demo_clicks ?? 0), 0);
  const sumBookClicks = last7.reduce((a, r) => a + (r.book_clicks ?? 0), 0);
  const mobileSessions = last7
    .filter((r) => r.device === "mobile")
    .reduce((a, r) => a + (r.sessions ?? 0), 0);

  const bounceRate = sumSessions ? Math.round((sumBounces / sumSessions) * 1000) / 10 : 0;
  const demoCTR = sumSessions ? Math.round((sumDemoClicks / sumSessions) * 1000) / 10 : 0;
  const bookCTR = sumSessions ? Math.round((sumBookClicks / sumSessions) * 1000) / 10 : 0;
  const mobilePct = sumSessions ? Math.round((mobileSessions / sumSessions) * 1000) / 10 : 0;

  // ---- Device breakdown (last 7 days) ----
  const deviceOrder = ["mobile", "tablet", "desktop"] as const;
  const deviceBreakdown = deviceOrder.map((dev) => {
    const rowsForDev = last7.filter((r) => r.device === dev);
    const sessions = rowsForDev.reduce((a, r) => a + (r.sessions ?? 0), 0);
    const bounces = rowsForDev.reduce((a, r) => a + (r.bounces ?? 0), 0);
    const demoClicks = rowsForDev.reduce((a, r) => a + (r.demo_clicks ?? 0), 0);
    const bookClicks = rowsForDev.reduce((a, r) => a + (r.book_clicks ?? 0), 0);
    return {
      device: dev,
      sessions,
      bounces,
      bounceRate: sessions ? Math.round((bounces / sessions) * 1000) / 10 : 0,
      demoCTR: sessions ? Math.round((demoClicks / sessions) * 1000) / 10 : 0,
      bookCTR: sessions ? Math.round((bookClicks / sessions) * 1000) / 10 : 0,
      demoClicks,
      bookClicks,
    };
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold">Bounce & engagement</h1>
        <p className="text-sm text-muted-foreground">
          How visitors behave on the homepage. A visit is{" "}
          <strong>engaged</strong> if they scroll past 50%, stay 10+ seconds, or click
          a primary CTA. Anything else is a <strong>bounce</strong>.{" "}
          <Link to="/admin/analytics" className="underline">Back to analytics</Link>
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive" />
            <div>
              <p className="font-medium">Couldn't load bounce data.</p>
              <p className="text-muted-foreground mt-1">{error}</p>
              <p className="mt-2">
                Try{" "}
                <Link to="/admin/analytics" className="underline">
                  the main analytics dashboard
                </Link>{" "}
                or email{" "}
                <a
                  href={`mailto:support@alfredai.bot?subject=${encodeURIComponent(
                    "Bounce dashboard error"
                  )}&body=${encodeURIComponent(
                    `Page: ${window.location.href}\nError: ${error}`
                  )}`}
                  className="underline"
                >
                  support@alfredai.bot
                </a>{" "}
                with this URL.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI tiles */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Kpi icon={TrendingDown} label="7-day bounce rate" value={rows ? `${bounceRate}%` : null} hint={`${sumSessions} sessions`} />
        <Kpi icon={Smartphone} label="Mobile share" value={rows ? `${mobilePct}%` : null} hint={`${mobileSessions} mobile`} />
        <Kpi icon={MousePointerClick} label="Demo-CTA CTR" value={rows ? `${demoCTR}%` : null} hint={`${sumDemoClicks} clicks`} />
        <Kpi icon={MousePointerClick} label="Book CTA CTR" value={rows ? `${bookCTR}%` : null} hint={`${sumBookClicks} clicks`} />
      </div>

      {/* Device breakdown of CTRs (last 7 days) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CTR by device (last 7 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {rows === null ? (
            <Skeleton className="h-32 w-full" />
          ) : sumSessions === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                    <TableHead className="text-right">Bounce rate</TableHead>
                    <TableHead className="text-right">Demo CTR</TableHead>
                    <TableHead className="text-right">Book CTR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deviceBreakdown.map((d) => (
                    <TableRow key={d.device}>
                      <TableCell className="capitalize font-medium">{d.device}</TableCell>
                      <TableCell className="text-right">{d.sessions}</TableCell>
                      <TableCell className="text-right">{d.bounceRate}%</TableCell>
                      <TableCell className="text-right">
                        {d.demoCTR}%
                        <span className="text-xs text-muted-foreground ml-1">({d.demoClicks})</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {d.bookCTR}%
                        <span className="text-xs text-muted-foreground ml-1">({d.bookClicks})</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Funnel table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily funnel (last 60 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {rows === null ? (
            <Skeleton className="h-40 w-full" />
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No data yet. Visit the homepage from an incognito window to generate a row.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                    <TableHead className="text-right">Bounces</TableHead>
                    <TableHead className="text-right">Bounce rate</TableHead>
                    <TableHead className="text-right">Demo clicks</TableHead>
                    <TableHead className="text-right">Book clicks</TableHead>
                    <TableHead className="text-right">Avg scroll</TableHead>
                    <TableHead className="text-right">Avg time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={`${r.day}-${r.device}-${i}`}>
                      <TableCell className="whitespace-nowrap">{new Date(r.day).toLocaleDateString("en-AU")}</TableCell>
                      <TableCell className="capitalize">{r.device}</TableCell>
                      <TableCell className="text-right">{r.sessions}</TableCell>
                      <TableCell className="text-right">{r.bounces}</TableCell>
                      <TableCell className="text-right">{r.bounce_rate ?? 0}%</TableCell>
                      <TableCell className="text-right">{r.demo_clicks}</TableCell>
                      <TableCell className="text-right">{r.book_clicks}</TableCell>
                      <TableCell className="text-right">{r.avg_scroll_pct ?? 0}%</TableCell>
                      <TableCell className="text-right">{Math.round(r.avg_seconds_on_page ?? 0)}s</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Where they leave */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Where bounced visitors leave (last 14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {exits === null ? (
            <Skeleton className="h-32 w-full" />
          ) : exits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bounce data yet.</p>
          ) : (
            <ul className="space-y-2">
              {exits.map((row) => {
                const max = exits[0]?.count || 1;
                const pct = Math.round((row.count / max) * 100);
                return (
                  <li key={row.exit_section ?? "none"} className="flex items-center gap-3 text-sm">
                    <span className="w-48 truncate" title={row.exit_section ?? ""}>
                      {row.exit_section ?? "(none — left immediately)"}
                    </span>
                    <div className="flex-1 h-2 rounded bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 text-right tabular-nums">{row.count}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Kpi = ({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
  hint: string;
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">
        {value ?? <Skeleton className="h-7 w-16" />}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>
    </CardContent>
  </Card>
);

export default BounceDashboard;
