import { useState } from 'react';
import { Loader2, Plug, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Probe {
  resource: string;
  status: 'ok' | 'failed' | 'skipped';
  httpStatus?: number;
  detail?: string | null;
}

interface HealthResult {
  success: boolean;
  error?: string;
  version?: { sending: string; legacyDefault: string };
  results?: Probe[];
  verdict?: string;
  caveat?: string;
}

/**
 * Does GoHighLevel still accept what we send it?
 *
 * Every call moved from the legacy `2021-07-28` date header to `v3`. Reads were
 * verified against the vendored v3 types; the write paths moved on
 * shape-checking alone, and a broken write loses data rather than showing an
 * empty panel. This probes one read per resource so a wholesale version
 * rejection surfaces here rather than in a customer's record.
 */
export function GhlHealthCheck() {
  const { isAdmin } = usePermissions();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<HealthResult | null>(null);

  if (!isAdmin) return null;

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('ghl-health', { body: {} });
      if (error) throw error;
      setResult(data as HealthResult);
    } catch (e) {
      setResult({ success: false, error: e instanceof Error ? e.message : 'Check failed.' });
    } finally {
      setRunning(false);
    }
  };

  const icon = (s: Probe['status']) =>
    s === 'ok' ? (
      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
    ) : s === 'failed' ? (
      <XCircle className="h-4 w-4 shrink-0 text-destructive" />
    ) : (
      <MinusCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
    );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Plug className="h-4 w-4 text-primary" /> GHL API version check
        </CardTitle>
        <Button variant="outline" size="sm" onClick={run} disabled={running} className="h-8 text-xs">
          {running ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
          {running ? 'Probing…' : 'Run check'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Every call moved from the old <code className="text-xs">2021-07-28</code> header to{' '}
          <code className="text-xs">v3</code>. This asks each resource for one read, so a version
          GoHighLevel has stopped accepting shows up here rather than in a client's record.
        </p>

        {result && !result.success && (
          <p className="text-destructive">{result.error ?? 'The check could not complete.'}</p>
        )}

        {result?.success && result.results && (
          <div className="space-y-3">
            <p className="font-medium">{result.verdict}</p>
            <ul className="space-y-1.5">
              {result.results.map((p) => (
                <li key={p.resource} className="flex items-start gap-2">
                  {icon(p.status)}
                  <span className="min-w-0">
                    <span className="font-medium capitalize">{p.resource}</span>
                    {p.httpStatus ? (
                      <span className="ml-2 text-xs tabular-nums text-muted-foreground">
                        HTTP {p.httpStatus}
                      </span>
                    ) : null}
                    {p.detail ? (
                      <span className="block break-all text-xs text-muted-foreground">
                        {p.detail}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
            {result.caveat && (
              <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-muted-foreground">
                {result.caveat}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default GhlHealthCheck;
