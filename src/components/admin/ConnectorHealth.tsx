import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Clock, Radio } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Job {
  jobname: string;
  schedule: string;
  active: boolean;
  runs_7d: number;
  failed_7d: number;
  last_run: string | null;
  last_status: string | null;
  last_error: string | null;
}
interface Hook {
  function_name: string;
  runs: number;
  failures: number;
  last_run: string | null;
  avg_ms: number | null;
  last_error: string | null;
}
interface Result {
  success: boolean;
  error?: string;
  jobs?: Job[];
  webhooks?: Hook[];
  verdict?: string;
  caveat?: string;
}

const ago = (iso: string | null) => {
  if (!iso) return 'never';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

/**
 * Are the scheduled jobs and inbound webhooks actually working?
 *
 * Built because one was not and nothing said so: check-deleted-ghl-contacts
 * failed on every run for a week, because it read two vault secrets that do
 * not exist, so its URL came back null. A daily job can fail every day and
 * look exactly like a daily job that works.
 */
export function ConnectorHealth() {
  const { isAdmin } = usePermissions();
  const { data, isLoading, isError } = useQuery<Result>({
    queryKey: ['connector-health'],
    enabled: isAdmin,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('connector-health', { body: {} });
      if (error) throw error;
      return data as Result;
    },
  });

  if (!isAdmin) return null;

  const jobs = data?.jobs ?? [];
  const hooks = data?.webhooks ?? [];
  const anyBad = jobs.some((j) => j.failed_7d > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className="h-4 w-4 text-primary" /> Scheduled jobs &amp; webhooks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {isLoading && <Skeleton className="h-40 rounded-lg" />}
        {isError && <p className="text-destructive">Could not read connector health.</p>}
        {data && !data.success && <p className="text-destructive">{data.error}</p>}

        {data?.success && (
          <>
            <p className={cn('font-medium', anyBad ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400')}>
              {data.verdict}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Job</th>
                    <th className="pb-2 pr-3 font-medium">Every</th>
                    <th className="pb-2 pr-3 text-right font-medium">7d runs</th>
                    <th className="pb-2 pr-3 text-right font-medium">Failed</th>
                    <th className="pb-2 font-medium">Last</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j.jobname} className="border-b border-border/50 last:border-0 align-top">
                      <td className="py-2 pr-3">
                        <span className="flex items-center gap-1.5">
                          {j.failed_7d > 0 ? (
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                          ) : j.runs_7d === 0 ? (
                            <Clock className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          )}
                          <span className="font-medium">{j.jobname}</span>
                        </span>
                        {j.last_error && (
                          <span className="mt-1 block break-all font-mono text-[11px] text-destructive">
                            {j.last_error}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3 font-mono text-[11px] text-muted-foreground">{j.schedule}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{j.runs_7d}</td>
                      <td className={cn('py-2 pr-3 text-right tabular-nums', j.failed_7d > 0 && 'font-semibold text-destructive')}>
                        {j.failed_7d}
                      </td>
                      <td className="py-2 whitespace-nowrap text-muted-foreground">{ago(j.last_run)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hooks.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                  Functions that log their runs
                </p>
                <ul className="space-y-1">
                  {hooks.map((h) => (
                    <li key={h.function_name} className="flex flex-wrap items-baseline gap-x-2 text-xs">
                      <span className="font-medium">{h.function_name}</span>
                      <span className="text-muted-foreground">
                        {h.runs.toLocaleString()} runs · {h.failures} failed · {ago(h.last_run)}
                        {h.avg_ms ? ` · ~${h.avg_ms}ms` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.caveat && (
              <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-muted-foreground">
                {data.caveat}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ConnectorHealth;
