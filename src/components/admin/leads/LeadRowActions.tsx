import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, UserPlus, ListChecks, GitBranch, Trophy, XCircle, StickyNote, Loader2, ExternalLink, Cloud, Link as LinkIcon, Archive, ArchiveRestore, Trash2, RefreshCw, Pencil, Bell, BellOff } from 'lucide-react';
import { getGHLContactUrl } from '@/lib/ghlConfig';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import {
  archiveLead,
  restoreLead,
  deleteLead,
  canArchive,
  canDelete,
  isArchived,
  LEGACY_LIST_KEYS,
} from '@/lib/leadArchive';
import { usePermissions } from '@/hooks/usePermissions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UnifiedLead } from '@/lib/unifiedLead';
import { distinctPanelForLead } from '@/lib/leadAdminLinks';
import { isB2bMatchmaking, isIncomplete } from '@/lib/leadSegments';
import { useSalesReps } from '@/hooks/useSalesReps';
import { useLeadActions } from '@/hooks/useLeadActions';
import { useLeadFollow } from '@/hooks/useLeadFollow';
import { useGhlOpportunities, useGhlPipelines, ghlKeys } from '@/hooks/useGhlLead';
import { useGhlOwner, ghlOwnerKey } from '@/hooks/useGhlOwner';
import { OwnerCommand } from './leadOverlayUi';
import { supabase } from '@/integrations/supabase/client';
import { canResyncGhl, resyncGhlLead } from '@/lib/leadResync';

/**
 * Row-level "⋯" menu — the ONLY visible action on lead list rows. Assign owner,
 * set GHL pipeline + stage (GHL-synced leads only), won/lost, add note,
 * "Open in <panel>", and source-specific "Push to GHL".
 */
export function LeadRowActions({ lead, onEdit }: { lead: UnifiedLead; onEdit?: () => void }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: reps = [], isLoading: repsLoading } = useSalesReps();
  const { setOwner, setOutcome, addNote } = useLeadActions();
  const { followerIds, toggleFollow, saving: followSaving } = useLeadFollow(lead);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (alive) setMyUserId(data.user?.id ?? null);
    });
    return () => { alive = false; };
  }, []);
  const isFollowing = !!myUserId && followerIds.includes(myUserId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteBody, setNoteBody] = useState('');
  const noteRef = useRef<HTMLTextAreaElement | null>(null);

  const [savingNote, setSavingNote] = useState(false);
  const { isAdmin } = usePermissions();
  const [pushing, setPushing] = useState(false);
  const [savingGhl, setSavingGhl] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [resyncing, setResyncing] = useState(false);

  const outcome = lead.annotation?.outcome ?? null;

  const ghlContactId =
    lead.ghl_contact_id ||
    (lead._merged ?? []).find((m) => m.ghl_contact_id)?.ghl_contact_id ||
    null;

  // Only fetch GHL pipeline/stage while the menu is open — keeps the list cheap
  // (no per-row opportunity fetch until a row's menu is actually opened).
  const oppContactId = menuOpen ? ghlContactId : null;
  const { data: opportunities = [], isLoading: oppsLoading } = useGhlOpportunities(oppContactId);
  const { data: pipelines = [] } = useGhlPipelines(menuOpen && !!ghlContactId);
  const { data: ghlOwner } = useGhlOwner(menuOpen ? ghlContactId : null);
  const ghlOwnerRepId = ghlOwner?.email
    ? reps.find((r) => r.email?.toLowerCase() === ghlOwner.email!.toLowerCase())?.id ?? null
    : null;
  const ownerValue = ghlContactId
    ? (ghlOwnerRepId ?? lead.annotation?.owner_id ?? null)
    : (lead.annotation?.owner_id ?? null);

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
    if (!primaryOpp || !ghlContactId) return;
    setSavingGhl(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-ghl-opportunity-stage', {
        body: { opportunity_id: primaryOpp.id, pipeline_id: pipelineId, pipeline_stage_id: pipelineStageId },
      });
      if (error || !data?.success) throw new Error(error?.message || data?.error || 'Update failed');
      toast.success('Stage updated in GHL');
      qc.invalidateQueries({ queryKey: ghlKeys.opportunities(ghlContactId) });
    } catch (err) {
      toast.error('Could not update stage in GHL', {
        description: (err instanceof Error ? err.message : String(err)).slice(0, 240),
      });
      qc.invalidateQueries({ queryKey: ghlKeys.opportunities(ghlContactId) });
    } finally {
      setSavingGhl(false);
    }
  };

  // Push eligibility per source.
  const isMerged = (lead._merged ?? []).some((m) => m.ghl_contact_id);
  const hasContactInfo = !!(lead.email || lead.phone);
  const canPushIncomplete =
    lead.source === 'ghl_submissions' && !lead.ghl_contact_id && !isMerged && isIncomplete(lead) && hasContactInfo;
  const canPushAlpha = lead.source === 'alpha_digital_leads' && !lead.ghl_contact_id;
  const canPushB2b =
    lead.source === 'leads' && isB2bMatchmaking(lead) && !lead.ghl_contact_id && hasContactInfo;
  const pushKind: 'incomplete' | 'alpha' | 'b2b' | null =
    canPushIncomplete ? 'incomplete' : canPushAlpha ? 'alpha' : canPushB2b ? 'b2b' : null;

  const runPush = async () => {
    if (!pushKind || pushing) return;
    setPushing(true);
    try {
      const cfg =
        pushKind === 'incomplete'
          ? { fn: 'push-lead-to-ghl', body: { submission_id: lead.id } }
          : pushKind === 'alpha'
          // require_email:false on purpose — see PushAlphaLeadToGhlButton. The
          // edge function defaults it TRUE so nothing pushes hundreds of
          // emailless contacts unattended, but this is one person acting on one
          // lead, and most Alpha rows are LinkedIn-only by design.
          ? { fn: 'push-alpha-lead-to-ghl', body: { alpha_lead_id: lead.id, require_email: false } }
          : { fn: 'push-b2b-lead-to-ghl', body: { lead_id: lead.id } };
      const { data, error } = await supabase.functions.invoke(cfg.fn, { body: cfg.body });
      if (error || !data?.success) throw new Error(error?.message || data?.error || 'Push failed');
      toast.success(
        data.alreadyPushed
          ? 'Already in GHL — refreshed'
          : data.opportunity_id
          ? 'Pushed to GHL — contact + opportunity created'
          : data.linked
          ? 'Linked to existing GHL contact'
          : 'Pushed to GHL — contact created',
        data.warning ? { description: String(data.warning).slice(0, 300) } : undefined,
      );
      qc.invalidateQueries({ queryKey: ['unified-leads'] });
      qc.invalidateQueries({ queryKey: ['lead-overlay'] });
      qc.invalidateQueries({ queryKey: ['ghl-lead'] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Push to GHL failed', {
        description: msg.slice(0, 240),
        action: {
          label: 'Email support',
          onClick: () => {
            const subject = encodeURIComponent(`Push to GHL failed — ${lead.name}`);
            const body = encodeURIComponent(
              `Lead: ${lead.name}\nID: ${lead.id}\nURL: ${window.location.href}\nError: ${msg}`,
            );
            window.location.href = `mailto:support@alfredai.bot?subject=${subject}&body=${body}`;
          },
        },
      });
    } finally {
      setPushing(false);
    }
  };

  const submitNote = async () => {
    setSavingNote(true);
    const ok = await addNote(lead, noteBody);
    setSavingNote(false);
    if (ok) { setNoteBody(''); setNoteOpen(false); }
  };

  const panel = distinctPanelForLead(lead);
  const sourceUrl = lead.source_url || null;

  const itemCls =
    'focus:bg-muted/60 focus:text-foreground data-[state=open]:bg-muted/60 data-[highlighted]:bg-muted/60 data-[highlighted]:text-foreground';

  const invalidateAllLeadCaches = () => {
    qc.invalidateQueries({ queryKey: ['unified-leads'] });
    qc.invalidateQueries({ queryKey: ['lead-overlay'] });
    for (const key of LEGACY_LIST_KEYS) qc.invalidateQueries({ queryKey: [key] });
  };


  return (
    <>
      <div className="inline-flex items-center" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] w-11 px-0 justify-center"
              title="Lead actions"
              onClick={(e) => e.stopPropagation()}
            >
              {pushing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" collisionPadding={8} className="w-60" onClick={(e) => e.stopPropagation()} onCloseAutoFocus={(e) => e.preventDefault()}>
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Owner &amp; status
            </DropdownMenuLabel>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className={itemCls}>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign owner
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="p-0 w-64">
                <OwnerCommand
                  reps={reps}
                  loading={repsLoading}
                  value={ownerValue}
                  onSelect={async (id, name) => {
                    setOwner(lead, id, name);
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
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* GHL pipeline + stage — only for leads that have a GHL contact. */}
            {ghlContactId && (
              <>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className={itemCls}>
                    <GitBranch className="h-4 w-4 mr-2" />
                    Set pipeline
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent
                    className="max-h-[min(60vh,320px)] w-56 overflow-y-auto"
                    sideOffset={2}
                    collisionPadding={8}
                  >
                    {oppsLoading && !primaryOpp ? (
                      <DropdownMenuItem disabled><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading…</DropdownMenuItem>
                    ) : !primaryOpp ? (
                      <DropdownMenuItem disabled>No opportunity in GHL yet</DropdownMenuItem>
                    ) : (
                      <DropdownMenuRadioGroup
                        value={primaryOpp.pipelineId}
                        onValueChange={(newPid) => {
                          if (newPid === primaryOpp.pipelineId) return;
                          const p = pipelines.find((pp) => pp.id === newPid);
                          const firstStageId = p?.stages[0]?.id;
                          if (!firstStageId) { toast.error('That pipeline has no stages'); return; }
                          void pushStageUpdate(newPid, firstStageId);
                        }}
                      >
                        {(pipelines.length > 0 ? pipelines : activePipeline ? [activePipeline] : []).map((p) => (
                          <DropdownMenuRadioItem key={p.id} value={p.id} className={itemCls} disabled={savingGhl}>
                            {p.name}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className={itemCls}>
                    <ListChecks className="h-4 w-4 mr-2" />
                    Set stage
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent
                    className="max-h-[min(60vh,320px)] w-56 overflow-y-auto"
                    sideOffset={2}
                    collisionPadding={8}
                  >
                    {oppsLoading && !primaryOpp ? (
                      <DropdownMenuItem disabled><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading…</DropdownMenuItem>
                    ) : !primaryOpp ? (
                      <DropdownMenuItem disabled>No opportunity in GHL yet</DropdownMenuItem>
                    ) : (
                      <DropdownMenuRadioGroup
                        value={primaryOpp.pipelineStageId}
                        onValueChange={(newSid) => {
                          if (newSid === primaryOpp.pipelineStageId) return;
                          void pushStageUpdate(primaryOpp.pipelineId, newSid);
                        }}
                      >
                        {(activePipeline?.stages ?? []).map((s) => (
                          <DropdownMenuRadioItem key={s.id} value={s.id} className={itemCls} disabled={savingGhl}>
                            {s.name}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </>
            )}

            <DropdownMenuItem className={itemCls} onClick={() => setOutcome(lead, outcome === 'won' ? null : 'won')}>
              <Trophy className="h-4 w-4 mr-2 text-emerald-600" />
              {outcome === 'won' ? 'Clear won' : 'Mark won'}
            </DropdownMenuItem>
            <DropdownMenuItem className={itemCls} onClick={() => setOutcome(lead, outcome === 'lost' ? null : 'lost')}>
              <XCircle className="h-4 w-4 mr-2 text-rose-600" />
              {outcome === 'lost' ? 'Clear lost' : 'Mark lost'}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Actions
            </DropdownMenuLabel>
            <DropdownMenuItem
              className={itemCls}
              onSelect={(e) => { e.preventDefault(); void toggleFollow(); }}
              disabled={followSaving}
            >
              {isFollowing ? <BellOff className="h-4 w-4 mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
              {isFollowing ? 'Unfollow' : 'Follow'}
            </DropdownMenuItem>
            <DropdownMenuItem
              className={itemCls}
              onSelect={() => setNoteOpen(true)}
            >
              <StickyNote className="h-4 w-4 mr-2" />
              Add note
            </DropdownMenuItem>

            {pushKind && (
              <DropdownMenuItem className={itemCls} onSelect={(e) => { e.preventDefault(); void runPush(); }} disabled={pushing}>
                <Cloud className="h-4 w-4 mr-2" />
                Push to GHL
              </DropdownMenuItem>
            )}
            {canResyncGhl(lead) && (
              <DropdownMenuItem
                className={itemCls}
                disabled={resyncing}
                onSelect={async (e) => {
                  e.preventDefault();
                  setResyncing(true);
                  try {
                    await resyncGhlLead(lead);
                    toast.success('Re-sync triggered');
                    qc.invalidateQueries({ queryKey: ['unified-leads'] });
                    qc.invalidateQueries({ queryKey: ['ghl-lead'] });
                  } catch (err) {
                    toast.error('Re-sync failed', { description: err instanceof Error ? err.message : String(err) });
                  } finally {
                    setResyncing(false);
                  }
                }}
              >
                {resyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Re-sync GHL
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem className={itemCls} onSelect={(e) => { e.preventDefault(); onEdit(); }}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}

            {isAdmin && (canArchive(lead) || canDelete(lead)) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Record
                </DropdownMenuLabel>
                {canArchive(lead) && (
                  isArchived(lead) ? (
                    <DropdownMenuItem
                      className={itemCls}
                      disabled={archiving}
                      onSelect={async (e) => {
                        e.preventDefault();
                        setArchiving(true);
                        try {
                          await restoreLead(lead);
                          toast.success('Lead restored');
                          invalidateAllLeadCaches();
                        } catch (err) {
                          toast.error('Failed to restore lead', {
                            description: err instanceof Error ? err.message : undefined,
                          });
                        } finally {
                          setArchiving(false);
                          setMenuOpen(false);
                        }
                      }}
                    >
                      <ArchiveRestore className="h-4 w-4 mr-2" />
                      Restore
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      className={itemCls}
                      disabled={archiving}
                      onSelect={async (e) => {
                        e.preventDefault();
                        setArchiving(true);
                        try {
                          await archiveLead(lead);
                          toast.success('Lead archived', { description: 'Restore it from the Archived tab.' });
                          invalidateAllLeadCaches();
                        } catch (err) {
                          toast.error('Failed to archive lead', {
                            description: err instanceof Error ? err.message : undefined,
                          });
                        } finally {
                          setArchiving(false);
                          setMenuOpen(false);
                        }
                      }}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  )
                )}
                {canDelete(lead) && (
                  <DropdownMenuItem
                    className={`${itemCls} text-destructive focus:text-destructive`}
                    onSelect={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </>
            )}


            {(ghlContactId || sourceUrl || panel) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Open
                </DropdownMenuLabel>
                {ghlContactId && (
                  <DropdownMenuItem className={itemCls} onSelect={(e) => { e.preventDefault(); window.open(getGHLContactUrl(ghlContactId), '_blank', 'noopener,noreferrer'); }}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in GHL
                  </DropdownMenuItem>
                )}
                {sourceUrl && (
                  <DropdownMenuItem className={itemCls} onSelect={(e) => { e.preventDefault(); window.open(sourceUrl, '_blank', 'noopener,noreferrer'); }}>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Open source page
                  </DropdownMenuItem>
                )}
                {panel && (
                  <DropdownMenuItem className={itemCls} onSelect={(e) => { e.preventDefault(); navigate(panel.path); }}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in {panel.name}
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent
          className="max-w-md"
          onClick={(e) => e.stopPropagation()}
          onOpenAutoFocus={(e) => {
            // Keep focus inside the dialog: without this the trigger button keeps
            // focus and Space/Enter re-opens the quick-actions menu while typing.
            e.preventDefault();
            noteRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>Add note — {lead.name}</DialogTitle>
          </DialogHeader>
          <Textarea
            ref={noteRef}
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Write a quick note about this lead…"
            rows={4}
          />

          <p className="text-[11px] text-muted-foreground">
            Saved to this lead's notes{ghlContactId ? ' and synced to GHL' : ''}.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button onClick={submitNote} disabled={savingNote || !noteBody.trim()}>
              {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <strong>{lead.name}</strong> from the {lead.source.replace(/_/g, ' ')} table.
              This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async (e) => {
                e.preventDefault();
                setDeleting(true);
                try {
                  await deleteLead(lead);
                  toast.success('Lead deleted');
                  invalidateAllLeadCaches();
                  setConfirmDelete(false);
                } catch (err) {
                  toast.error('Failed to delete lead', {
                    description: err instanceof Error ? err.message : undefined,
                  });
                } finally {
                  setDeleting(false);
                }
              }}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
