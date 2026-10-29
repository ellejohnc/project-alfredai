import { useState } from 'react';
import { Loader2, Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AuditResult {
  success: boolean;
  error?: string;
  counts?: {
    sampled: number;
    fetched: number;
    failed: number;
    withAttribution: number;
    withCampaign: number;
    withCampaignId: number;
    withUtmSource: number;
    withReferrer: number;
  };
  distinctCampaigns?: { campaign: string; leads: number }[];
  verdict?: string;
}

/**
 * Answers one question with evidence: does GoHighLevel hold the campaign
 * attribution we never captured?
 *
 * `meta_leads.campaign_id` and `utm_campaign` are null on all 1,514 rows, which
 * is why the design deck's "Campaigns" tile is absent from this page — it could
 * only ever read 0. But the v3 contact carries attributionSource and
 * lastAttributionSource, so the data may exist on GHL's side.
 *
 * The edge function needs the live API key, so this has to be run from the
 * panel rather than from a script. Admin-only, read-only, and sequential with
 * a delay between calls on the server side, because the failure we have
 * actually hit is parallel reads turning a soft 429 into an outage.
 */
export function MetaAttributionAudit() {
  const { isAdmin } = usePermissions();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);

  if (!isAdmin) return null;

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('ghl-attribution-audit', {
        body: { sample: 25 },
      });
      if (error) throw error;
      setResult(data as AuditResult);
    } catch (e) {
      setResult({
        success: false,
        error: e instanceof Error ? e.message : 'Could not run the audit.',
      });
    } finally {
      setRunning(false);
    }
  };

  const c = result?.counts;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Megaphone className="h-4 w-4 text-primary" /> Campaign attribution check
        </CardTitle>
        <Button variant="outline" size="sm" onClick={run} disabled={running} className="h-8 text-xs">
          {running ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
          {running ? 'Checking 25 contacts…' : 'Run check'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Campaign is empty on every Meta lead we store, so the Campaigns tile from the design deck
          is not on this page — it could only show 0. This samples 25 recent leads and asks
          GoHighLevel directly, so the tile gets built on evidence rather than a guess.
        </p>

        {result && !result.success && (
          <p className="text-destructive">{result.error ?? 'The check could not complete.'}</p>
        )}

        {result?.success && c && (
          <div className="space-y-3">
            <p className="font-medium">{result.verdict}</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline">{c.fetched} fetched</Badge>
              {c.failed > 0 && <Badge variant="outline">{c.failed} failed</Badge>}
              <Badge variant={c.withCampaign ? 'default' : 'secondary'}>
                {c.withCampaign} with campaign
              </Badge>
              <Badge variant="secondary">{c.withCampaignId} with campaign ID</Badge>
              <Badge variant="secondary">{c.withUtmSource} with UTM source</Badge>
              <Badge variant="secondary">{c.withReferrer} with referrer</Badge>
            </div>
            {result.distinctCampaigns && result.distinctCampaigns.length > 0 && (
              <div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Campaigns found
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.distinctCampaigns.map((d) => (
                    <Badge key={d.campaign} variant="outline" className="text-[11px]">
                      {d.campaign} · {d.leads}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MetaAttributionAudit;
