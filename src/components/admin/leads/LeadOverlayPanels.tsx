import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, Trophy, XCircle, UserPlus, StickyNote, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedLead } from '@/lib/unifiedLead';
import { LEAD_STAGES } from '@/lib/leadPipeline';
import { useSalesReps } from '@/hooks/useSalesReps';
import { useLeadActions } from '@/hooks/useLeadActions';
import {
  useGhlNotes,
  useGhlOpportunities,
  useGhlPipelines,
  ghlKeys,
  type GhlNote,
} from '@/hooks/useGhlLead';
import { useGhlOwner, ghlOwnerKey } from '@/hooks/useGhlOwner';
import { OwnerCommand } from './leadOverlayUi';
import { LeadAvatar } from './LeadOwnerCell';
import { useLeadFollowers } from '@/hooks/useLeadFollow';
import { ownerName } from './ownerName';
import { NoteContent } from './NoteContent';


const NO_STAGE = '__none__';

/** "Ownership & status" card for the lead record page. For GHL-backed leads
 *  the Stage control is bound to the real GHL opportunity (pipeline + stage)
 *  and pushes changes back via the update-ghl-opportunity-stage edge function.
 *  Non-GHL leads keep the local stage list. */
export function LeadOwnershipCard({ lead }: { lead: UnifiedLead }) {
  const qc = useQueryClient();
  const { data: reps = [], isLoading: repsLoading } = useSalesReps();
  const { setOwner, setStage, setOutcome } = useLeadActions();
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [savingGhl, setSavingGhl] = useState(false);

  const localOwnerId = lead.annotation?.owner_id ?? null;
  const stage = lead.annotation?.stage ?? null;
  const outcome = lead.annotation?.outcome ?? null;

  const ghlContactId =
    lead.ghl_contact_id ||
    (lead._merged ?? []).find((m) => m.ghl_contact_id)?.ghl_contact_id ||
    null;

  const followers = useLeadFollowers(lead);
  const { data: ghlOwner } = useGhlOwner(ghlContactId);
  const ghlOwnerRepId = ghlOwner?.email
    ? reps.find((r) => r.email?.toLowerCase() === ghlOwner.email!.toLowerCase())?.id ?? null
    : null;
  const ownerId = ghlContactId ? (ghlOwnerRepId ?? localOwnerId) : localOwnerId;
  const currentOwner =
    ownerName(ownerId, reps) ??
    (ghlContactId && ghlOwner?.name ? ghlOwner.name : null);

  const { data: opportunities = [], isLoading: oppsLoading } = useGhlOpportunities(ghlContactId);
  const { data: pipelines = [] } = useGhlPipelines(!!ghlContactId);

  // Pick the primary/most-recent opportunity when a contact has multiples.
  const primaryOpp = useMemo(() => {
    if (opportunities.length === 0) return null;
    return [...opportunities].sort((a, b) => {
      const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return tb - ta;
    })[0];
  }, [opportunities]);

  const activePipeline = useMemo(() => {
    if (!primaryOpp) return null;
    return (
      pipelines.find((p) => p.id === primaryOpp.pipelineId) ?? {
        id: primaryOpp.pipelineId,
        name: primaryOpp.pipelineName ?? 'Pipeline',
        stages: primaryOpp.stages,
      }
    );
  }, [primaryOpp, pipelines]);

  const pushStageUpdate = async (pipelineId: string, pipelineStageId: string) => {
    if (!primaryOpp) return;
    setSavingGhl(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-ghl-opportunity-stage', {
        body: {
          opportunity_id: primaryOpp.id,
          pipeline_id: pipelineId,
          pipeline_stage_id: pipelineStageId,
        },
      });
      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Update failed');
      }
      toast.success('Stage updated in GHL');
      qc.invalidateQueries({ queryKey: ghlKeys.opportunities(ghlContactId!) });
    } catch (err) {
      toast.error('Could not update stage in GHL', {
        description: (err instanceof Error ? err.message : String(err)).slice(0, 240),
      });
      // Revert by refetching the source of truth.
      qc.invalidateQueries({ queryKey: ghlKeys.opportunities(ghlContactId!) });
    } finally {
      setSavingGhl(false);
    }
  };

  const renderStageControl = () => {
    // Non-GHL lead: keep local stage picker.
    if (!ghlContactId) {
      return (
        <Select
          value={stage ?? NO_STAGE}
          onValueChange={(v) => setStage(lead, v === NO_STAGE ? null : v)}
        >
          <SelectTrigger className="min-h-[44px]">
            <SelectValue placeholder="No stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_STAGE}>No stage</SelectItem>
            {LEAD_STAGES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (oppsLoading && !primaryOpp) {
      return (
        <div className="min-h-[44px] flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading opportunity…
        </div>
      );
    }

    if (!primaryOpp) {
      return (
        <div className="min-h-[44px] flex items-center text-sm text-muted-foreground">
          No opportunity in GHL yet
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {/* Pipeline picker */}
        <Select
          value={primaryOpp.pipelineId}
          disabled={savingGhl || pipelines.length === 0}
          onValueChange={(newPipelineId) => {
            if (newPipelineId === primaryOpp.pipelineId) return;
            const p = pipelines.find((pp) => pp.id === newPipelineId);
            const firstStageId = p?.stages[0]?.id;
            if (!firstStageId) {
              toast.error('That pipeline has no stages');
              return;
            }
            void pushStageUpdate(newPipelineId, firstStageId);
          }}
        >
          <SelectTrigger className="min-h-[44px]">
            <SelectValue>
              {activePipeline?.name ?? primaryOpp.pipelineName ?? 'Pipeline'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(pipelines.length > 0 ? pipelines : activePipeline ? [activePipeline] : []).map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Stage picker (belongs to active pipeline) */}
        <Select
          value={primaryOpp.pipelineStageId}
          disabled={savingGhl || !activePipeline || activePipeline.stages.length === 0}
          onValueChange={(newStageId) => {
            if (newStageId === primaryOpp.pipelineStageId) return;
            void pushStageUpdate(primaryOpp.pipelineId, newStageId);
          }}
        >
          <SelectTrigger className="min-h-[44px]">
            <SelectValue placeholder="Select stage" />
          </SelectTrigger>
          <SelectContent>
            {(activePipeline?.stages ?? []).map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <p className="text-[11px] text-muted-foreground">
          Synced with GHL opportunity{opportunities.length > 1 ? ` (primary of ${opportunities.length})` : ''}
          {savingGhl && ' · saving…'}
        </p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" /> Ownership &amp; status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Owner */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Owner</Label>
          <Popover open={ownerOpen} onOpenChange={setOwnerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between min-h-[44px] font-normal">
                {currentOwner ?? 'Unassigned'}
                <UserPlus className="h-4 w-4 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-64 z-[100]" align="start">
              <OwnerCommand
                reps={reps}
                loading={repsLoading}
                value={ownerId}
                onSelect={async (id, name) => {
                  setOwner(lead, id, name);
                  setOwnerOpen(false);
                  if (ghlContactId) {
                    const rep = reps.find((r) => r.id === id);
                    try {
                      const { data } = await supabase.functions.invoke('ghl-set-owner', {
                        body: {
                          contact_id: ghlContactId,
                          opportunity_ids: opportunities.map((o) => o.id),
                          rep_email: rep?.email ?? null,
                        },
                      });
                      if (data?.success && data.matched === false) {
                        toast('Saved — no matching GHL user to assign to');
                      } else if (data?.success) {
                        toast.success('Owner synced to GHL');
                      } else {
                        toast.error('Could not sync owner to GHL');
                      }
                    } catch {
                      toast.error('Could not sync owner to GHL');
                    }
                    qc.invalidateQueries({ queryKey: ghlOwnerKey(ghlContactId) });
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Followers.
            The record had an Owner and no Followers at all, so a follow made
            in GoHighLevel — or here, from the row menu — was invisible on the
            one screen meant to answer "who is on this lead". The Standard puts
            Ownership in the record's side panel; followers are part of
            ownership, not a row-list decoration.
            Read-only here on purpose: following is a per-person action and
            belongs on the row menu, which is where it already lives. This
            answers who, it does not set it. */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Followers</Label>
          {followers.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {followers.map((f) => (
                <span key={f.id} className="inline-flex items-center gap-1.5 text-sm">
                  <LeadAvatar name={f.name} />
                  <span className="break-words">{f.name}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No followers</p>
          )}
        </div>

        {/* Stage — GHL-bound when the lead has a contact, local otherwise */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Stage</Label>
          {renderStageControl()}
        </div>



        {/* Outcome */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Outcome</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={outcome === 'won' ? 'default' : 'outline'}
              className={cn(
                'flex-1 min-h-[44px]',
                outcome === 'won' && 'bg-emerald-600 hover:bg-emerald-600/90'
              )}
              onClick={() => setOutcome(lead, outcome === 'won' ? null : 'won')}
            >
              {outcome === 'won' ? <Check className="h-4 w-4 mr-1.5" /> : <Trophy className="h-4 w-4 mr-1.5" />}
              Won
            </Button>
            <Button
              type="button"
              variant={outcome === 'lost' ? 'default' : 'outline'}
              className={cn(
                'flex-1 min-h-[44px]',
                outcome === 'lost' && 'bg-rose-600 hover:bg-rose-600/90'
              )}
              onClick={() => setOutcome(lead, outcome === 'lost' ? null : 'lost')}
            >
              {outcome === 'lost' ? <Check className="h-4 w-4 mr-1.5" /> : <XCircle className="h-4 w-4 mr-1.5" />}
              Lost
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MergedNote {
  id: string;             // display key
  ghlId?: string;         // raw GHL note id (used for delete)
  localId?: string;       // raw local note id
  body: string;
  created_at: string;
  author: string;
  fromGhl: boolean;
}

/** "Notes" card — thread newest-first with an add-note box. Local notes are
 *  merged with notes pulled from GHL (labelled "from GHL") when the lead has a
 *  ghl_contact_id. GHL fetch fails quietly — local notes always show.
 *  Delete: two-way — deleting a GHL note here removes it in GHL too. */
/**
 * The ONLY surface that shows a lead's notes. Do not remove it on the
 * assumption the Conversation thread already covers them — it does not.
 *
 * The amber "Note" bubbles inside LeadConversationTab are conversation
 * internal COMMENTS. This card shows contact NOTES, from
 * /contacts/{id}/notes via useGhlNotes, merged with our own lead_notes.
 * They are different GoHighLevel objects and LeadGhlTabs fetches no notes
 * at all. Taking this card out once made every note disappear from the
 * record; it belongs in the Conversation tab, under the thread.
 */
export function LeadNotesCard({ lead }: { lead: UnifiedLead }) {
  const { data: reps = [] } = useSalesReps();
  const { addNote, deleteNote } = useLeadActions();
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const authorFor = (id: string | null) => (id ? ownerName(id, reps) ?? '—' : '—');

  const ghlContactId =
    lead.ghl_contact_id ||
    (lead._merged ?? []).find((m) => m.ghl_contact_id)?.ghl_contact_id ||
    null;

  const { data: ghlNotes = [], isLoading: ghlLoading, isFetching } = useGhlNotes(ghlContactId);

  const localNotes: MergedNote[] = (lead.notes ?? []).map((n) => ({
    id: `local-${n.id}`,
    localId: n.id,
    body: n.body,
    created_at: n.created_at,
    author: authorFor(n.author_id),
    fromGhl: false,
  }));

  // A note added here is saved locally AND pushed to GHL with an attribution
  // header, so the same note comes back from GHL and used to render twice.
  // Strip the header, match it against local bodies, and keep ONE row (the
  // local one, carrying the GHL id so delete removes both sides).
  const stripAttribution = (s: string) =>
    s.replace(/^\s*\[[^\]]*via alfred ai website\]\s*/i, '').trim();

  const usedRemote = new Set<string>();
  const localNotesMerged: MergedNote[] = localNotes.map((n) => {
    const match = ghlNotes.find(
      (g) => !usedRemote.has(g.id) && stripAttribution(g.body || '') === n.body.trim(),
    );
    if (match) {
      usedRemote.add(match.id);
      return { ...n, ghlId: match.id };
    }
    return n;
  });

  const remoteNotes: MergedNote[] = ghlNotes
    .filter((n) => !usedRemote.has(n.id))
    .map((n) => ({
      id: `ghl-${n.id}`,
      ghlId: n.id,
      body: n.body,
      created_at: n.createdAt ?? new Date(0).toISOString(),
      author: (n.author && n.author.trim()) || 'GoHighLevel',
      fromGhl: true,
    }));

  const allNotes: MergedNote[] = [...localNotesMerged, ...remoteNotes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );


  const submit = async () => {
    setSaving(true);
    const ok = await addNote(lead, body);
    setSaving(false);
    if (ok) {
      setBody('');
      // Refresh GHL-side notes since addNote also pushes to GHL.
      if (ghlContactId) qc.invalidateQueries({ queryKey: ghlKeys.notes(ghlContactId) });
    }
  };

  const handleDelete = async (n: MergedNote) => {
    setDeletingId(n.id);
    try {
      // Remove the GHL copy first when one exists (a synced local note carries
      // both ids), then the local row. GHL failure never blocks the local delete.
      let ghlFailed = false;
      if (n.ghlId && ghlContactId) {
        const prev = qc.getQueryData<GhlNote[]>(ghlKeys.notes(ghlContactId));
        qc.setQueryData<GhlNote[]>(
          ghlKeys.notes(ghlContactId),
          (old) => (old ?? []).filter((x) => x.id !== n.ghlId),
        );
        const { data, error } = await supabase.functions.invoke('ghl-delete-note', {
          body: { contact_id: ghlContactId, note_id: n.ghlId },
        });
        if (error || data?.success === false) {
          qc.setQueryData(ghlKeys.notes(ghlContactId), prev);
          ghlFailed = true;
          if (!n.localId) {
            throw new Error(data?.error || (error as Error)?.message || 'Delete failed');
          }
        } else {
          qc.invalidateQueries({ queryKey: ghlKeys.notes(ghlContactId) });
        }
      }
      if (n.localId) {
        const ok = await deleteNote(lead, n.localId);
        if (!ok) throw new Error('Delete failed');
      }
      toast[ghlFailed ? 'warning' : 'success'](
        ghlFailed ? 'Deleted here — GHL copy could not be removed' : 'Note deleted',
      );
    } catch (e) {
      toast.error(e?.message || 'Could not delete note');
    } finally {
      setDeletingId(null);
    }
  };


  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-primary" /> Notes
          {allNotes.length > 0 && <span className="text-xs text-muted-foreground">({allNotes.length})</span>}
          {(ghlLoading || isFetching) && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a note about this lead…"
            rows={3}
          />
          <div className="flex justify-end">
            <Button size="sm" className="min-h-[40px]" onClick={submit} disabled={saving || !body.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add note'}
            </Button>
          </div>
        </div>

        {allNotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {ghlLoading ? 'Loading notes…' : 'No notes yet.'}
          </p>
        ) : (
          <ul className="divide-y rounded-md border bg-muted/20">
            {allNotes.map((n) => (
              <li key={n.id} className="p-3 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {n.author}
                    {n.created_at && new Date(n.created_at).getTime() > 0
                      ? ` · ${format(new Date(n.created_at), 'd MMM yyyy, h:mma')}`
                      : ''}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] px-1.5 py-0 h-4',
                      n.fromGhl
                        ? 'border-primary/30 text-primary'
                        : 'border-muted-foreground/30 text-muted-foreground',
                    )}
                  >
                    {n.fromGhl ? 'From GHL' : 'From Website'}
                  </Badge>
                  <div className="ml-auto">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          disabled={deletingId === n.id}
                          aria-label="Delete note"
                        >
                          {deletingId === n.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this note?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {n.fromGhl
                              ? 'This will delete the note in GoHighLevel too. You can’t undo this.'
                              : 'This will delete the note. You can’t undo this.'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDelete(n)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <NoteContent value={n.body} />
              </li>
            ))}
          </ul>

        )}
      </CardContent>
    </Card>
  );
}

