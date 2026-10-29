import { useState } from 'react';
import { Loader2, Upload, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Result {
  success: boolean;
  error?: string;
  dry_run?: boolean;
  remaining?: number;
  not_enrichable?: number;
  batch_tag?: string | null;
  would_push?: number;
  pushed?: number;
  skipped?: number;
  failed?: number;
  sample?: { name: string | null; reachable_by: string }[];
  failures?: { name: string | null; error: string }[];
  note?: string;
  triaged_only?: boolean;
  triaged_matching?: number;
  runs_to_finish?: number;
  warning?: string;
}

/**
 * Push the Alpha Digital backlog into GoHighLevel, a batch at a time.
 *
 * ELIGIBILITY IS NOT "EVERY ROW" ANY MORE. This panel used to say all of them
 * could go, because the push only needs a name and a LinkedIn URL. Will's
 * answer on syncing the backlog was that we need their emails first, and only
 * a fifth of these rows have one — so the run defaults to email-only, and the
 * rest are reported as held back rather than counted in the same queue.
 *
 * Every contact is tagged with the batch tag below as well as "Alpha Digital"
 * and "LinkedIn Lead". A GoHighLevel Smart List is a saved filter over tags,
 * not a container — there is no API that adds a contact to one — so tagging on
 * push is what makes a sync addressable as a list afterwards.
 *
 * Check first is the default and the primary button, because the real run
 * creates CRM contacts and GHL automations can fire on contact creation. The
 * real run asks for confirmation and says the number out loud before doing it.
 */
export function AlphaBackfillPanel() {
  const { isAdmin } = usePermissions();
  const [busy, setBusy] = useState<'check' | 'push' | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [batch, setBatch] = useState(25);
  const [includeNoEmail, setIncludeNoEmail] = useState(false);
  // Defaults ON. Alpha Digital's own triage lives in raw_data.tags, and 25 of
  // the tagged rows say Negative or Not Interested — so the unfiltered run is
  // the one that needs a deliberate choice, not this one.
  const [triagedOnly, setTriagedOnly] = useState(true);

  // One tag per day, so "the leads we synced today" is a filter anyone can
  // build in GoHighLevel without us having to keep a list on this side.
  const batchTag = `Alpha Sync ${new Date().toISOString().slice(0, 10)}`;

  if (!isAdmin) return null;

  const run = async (dryRun: boolean) => {
    setBusy(dryRun ? 'check' : 'push');
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('alpha-backfill-ghl', {
        body: {
          dry_run: dryRun,
          limit: batch,
          require_email: !includeNoEmail,
          batch_tag: batchTag,
          triaged_only: triagedOnly,
        },
      });
      if (error) throw error;
      // Stamped here because the push response does not echo it, and the
      // display must follow the run that happened, not the checkbox now.
      setResult({ ...(data as Result), triaged_only: triagedOnly });
    } catch (e) {
      setResult({ success: false, error: e instanceof Error ? e.message : 'The run failed.' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4 text-primary" /> Push the backlog to GoHighLevel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Sends leads tagged <span className="font-medium text-foreground">{batchTag}</span> so you can build a
            Smart List on this sync in GoHighLevel. Leads with no email are held back and counted
            separately — they need enriching before they are worth pushing.
          </p>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={triagedOnly}
              onChange={(e) => setTriagedOnly(e.target.checked)}
            />
            <span>
              <span className="font-medium">Only leads triaged as interested</span>
              <span className="block text-xs text-muted-foreground">
                Alpha Digital records reply quality as tags, not as a status — statuses
                &ldquo;Not interested&rdquo; and &ldquo;Meeting booked&rdquo; have never been used.
                This sends only leads tagged Interested, Hot Lead or Positive, and excludes anyone
                tagged Negative or Not Interested. Untick to send the whole backlog.
              </span>
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-muted-foreground" htmlFor="alpha-batch">
              Batch size
            </label>
            <select
              id="alpha-batch"
              value={batch}
              onChange={(e) => setBatch(Number(e.target.value))}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs"
            >
              {[10, 25, 50, 100, 200].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={includeNoEmail}
                onChange={(e) => setIncludeNoEmail(e.target.checked)}
                className="h-3.5 w-3.5 accent-primary"
              />
              Include leads with no email
            </label>

            <Button variant="default" size="sm" onClick={() => run(true)} disabled={!!busy} className="h-8 text-xs">
              {busy === 'check' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Check first
            </Button>
            <Button variant="outline" size="sm" onClick={() => setConfirm(true)} disabled={!!busy} className="h-8 text-xs">
              {busy === 'push' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Push this batch
            </Button>
          </div>

          {result && !result.success && (
            <p className="text-destructive">{result.error ?? 'The run did not complete.'}</p>
          )}

          {result?.success && (
            <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
              {/* With the triage on, `remaining` is every unpushed row with an
                  email — about a thousand — not the people this run is about.
                  The panel used to print it as "eligible in total" beside a
                  56-lead triage, so Check first read as a thousand-contact push
                  and "run again until 0 left" could never finish. The function
                  already returned the triage count; nothing displayed it. */}
              {result.dry_run && result.triaged_only ? (
                <p className="font-medium">
                  {result.triaged_matching?.toLocaleString()} triaged as interested and not yet in GoHighLevel
                  {' '}· would push {result.would_push?.toLocaleString()} now
                  {result.runs_to_finish ? <> · {result.runs_to_finish} run{result.runs_to_finish === 1 ? '' : 's'} at this batch size</> : null}
                </p>
              ) : !result.dry_run && result.triaged_only ? (
                <p className="font-medium">
                  Pushed {result.pushed?.toLocaleString()} · skipped {result.skipped?.toLocaleString()} ·
                  failed {result.failed?.toLocaleString()} · press Check first to see how many triaged leads are left
                </p>
              ) : result.dry_run ? (
                <p className="font-medium">
                  Would push {result.would_push?.toLocaleString()} now · {result.remaining?.toLocaleString()} eligible in total
                  {typeof result.not_enrichable === 'number' && result.not_enrichable > 0 && (
                    <> · {result.not_enrichable.toLocaleString()} held back for having no email</>
                  )}
                </p>
              ) : (
                <p className="font-medium">
                  Pushed {result.pushed?.toLocaleString()} · skipped {result.skipped?.toLocaleString()} ·
                  failed {result.failed?.toLocaleString()} · {result.remaining?.toLocaleString()} left
                  {typeof result.not_enrichable === 'number' && result.not_enrichable > 0 && (
                    <> · {result.not_enrichable.toLocaleString()} held back for having no email</>
                  )}
                </p>
              )}

              {result.sample && result.sample.length > 0 && (
                <ul className="space-y-0.5 text-xs text-muted-foreground">
                  {result.sample.map((s, i) => (
                    <li key={i}>{s.name ?? 'Unnamed'} · via {s.reachable_by}</li>
                  ))}
                </ul>
              )}

              {result.failures && result.failures.length > 0 && (
                <ul className="space-y-0.5 text-xs text-destructive">
                  {result.failures.map((f, i) => (
                    <li key={i}>{f.name ?? 'Unnamed'}: {f.error}</li>
                  ))}
                </ul>
              )}

              {result.warning && <p className="text-xs text-destructive">{result.warning}</p>}
              {/* The note counts the whole emailable backlog, so it contradicts
                  the triage line above; it is only shown for the untriaged run. */}
              {result.note && !result.triaged_only && (
                <p className="text-xs text-muted-foreground">{result.note}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Create up to {batch} contacts in GoHighLevel?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This writes to your CRM. Any GoHighLevel automation that runs on contact creation
              will fire for each one. Nothing already linked is touched twice, and the run stops
              after {batch} — but the contacts it makes are real. Each one is tagged {batchTag}.
              {includeNoEmail && ' Leads with no email address are INCLUDED in this run.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {/* No preventDefault here. It used to hold the dialog open for the
                duration of the run, but the dialog shows no progress of its own,
                so a 25-row push just looked frozen. Let Radix close it on click
                and let the spinner on "Push this batch" report the run. */}
            <AlertDialogAction onClick={() => run(false)}>
              Push {batch}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default AlphaBackfillPanel;
