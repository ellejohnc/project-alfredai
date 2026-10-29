import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  UnifiedLead,
  LeadAnnotation,
  LeadNote,
  leadKey,
} from '@/lib/unifiedLead';
import { LeadOutcome } from '@/lib/leadPipeline';
import type { UnifiedLeadsResult } from '@/hooks/useUnifiedLeads';
import { LEAD_OVERLAY_QK, LeadOverlayData } from '@/hooks/useLeadOverlay';

const QK = ['unified-leads'] as const;
const OVERLAY_QK = LEAD_OVERLAY_QK;

type AnnotationPatch = Partial<Pick<LeadAnnotation, 'owner_id' | 'stage' | 'outcome' | 'owner_source'>>;

/**
 * Local-CRM mutations for the shared lead overlay tables (lead_annotations /
 * lead_notes). Optimistically patches BOTH the ['unified-leads'] cache (inbox +
 * record page) and the ['lead-overlay'] cache (legacy panels), then invalidates
 * both on settle so every surface showing the same (lead_source, lead_id) stays
 * in sync with no drift. Rolls back with a retry toast on error. Never writes to
 * the source lead tables.
 */
export function useLeadActions() {
  const qc = useQueryClient();
  const { user } = useAdminAuth();
  const adminName =
    (user?.user_metadata?.display_name as string | undefined)?.trim() ||
    user?.email ||
    '';


  const patchLeadInCache = useCallback(
    (source: string, id: string, updater: (l: UnifiedLead) => UnifiedLead): UnifiedLeadsResult | undefined => {
      const prev = qc.getQueryData<UnifiedLeadsResult>(QK);
      if (!prev) return undefined;
      const targetKey = leadKey(source, id);
      const leads = prev.leads.map((l) =>
        leadKey(l.source, l.id) === targetKey ? updater(l) : l
      );
      qc.setQueryData<UnifiedLeadsResult>(QK, { ...prev, leads });
      return prev;
    },
    [qc]
  );

  /** Optimistically upsert an annotation into the shared overlay cache. */
  const patchOverlayAnnotation = useCallback(
    (ann: LeadAnnotation): LeadOverlayData | undefined => {
      const prev = qc.getQueryData<LeadOverlayData>(OVERLAY_QK);
      if (!prev) return undefined;
      const k = leadKey(ann.lead_source, ann.lead_id);
      const rest = prev.annotations.filter((a) => leadKey(a.lead_source, a.lead_id) !== k);
      qc.setQueryData<LeadOverlayData>(OVERLAY_QK, { ...prev, annotations: [...rest, ann] });
      return prev;
    },
    [qc]
  );

  /** Optimistically prepend a note into the shared overlay cache. */
  const patchOverlayNote = useCallback(
    (note: LeadNote): LeadOverlayData | undefined => {
      const prev = qc.getQueryData<LeadOverlayData>(OVERLAY_QK);
      if (!prev) return undefined;
      qc.setQueryData<LeadOverlayData>(OVERLAY_QK, { ...prev, notes: [note, ...prev.notes] });
      return prev;
    },
    [qc]
  );

  const invalidateOverlays = useCallback(() => {
    qc.invalidateQueries({ queryKey: QK });
    qc.invalidateQueries({ queryKey: OVERLAY_QK });
  }, [qc]);

  const currentUserId = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  }, []);

  /** Upsert owner / stage / outcome for a lead (keyed to its own source+id). */
  const setAnnotation = useCallback(
    async (lead: UnifiedLead, patch: AnnotationPatch, successMsg?: string) => {
      const uid = await currentUserId();
      const existing = lead.annotation ?? null;
      const optimistic: LeadAnnotation = {
        id: existing?.id ?? `optimistic-${lead.source}-${lead.id}`,
        lead_source: lead.source,
        lead_id: lead.id,
        owner_id: patch.owner_id !== undefined ? patch.owner_id : existing?.owner_id ?? null,
        owner_source:
          patch.owner_source !== undefined ? patch.owner_source : existing?.owner_source ?? null,
        stage: patch.stage !== undefined ? patch.stage : existing?.stage ?? null,
        outcome: patch.outcome !== undefined ? patch.outcome : existing?.outcome ?? null,
        updated_by: uid,
        updated_at: new Date().toISOString(),
      };
      const prev = patchLeadInCache(lead.source, lead.id, (l) => ({ ...l, annotation: optimistic }));
      const prevOverlay = patchOverlayAnnotation(optimistic);

      const { error } = await supabase
        .from('lead_annotations')
        .upsert(
          {
            lead_source: lead.source,
            lead_id: lead.id,
            owner_id: optimistic.owner_id,
            owner_source: optimistic.owner_source,
            stage: optimistic.stage,
            outcome: optimistic.outcome,
            updated_by: uid,
            updated_at: optimistic.updated_at,
          },
          { onConflict: 'lead_source,lead_id' }
        );


      if (error) {
        if (prev) qc.setQueryData(QK, prev);
        if (prevOverlay) qc.setQueryData(OVERLAY_QK, prevOverlay);
        toast.error('Could not save. Please try again.', {
          action: { label: 'Retry', onClick: () => setAnnotation(lead, patch, successMsg) },
        });
        return false;
      }
      if (successMsg) toast.success(successMsg);
      invalidateOverlays();
      return true;
    },
    [currentUserId, patchLeadInCache, patchOverlayAnnotation, invalidateOverlays, qc]
  );

  const setOwner = useCallback(
    async (lead: UnifiedLead, ownerId: string | null, ownerName?: string) => {
      // Ownership belongs to the PERSON, not to one source row. A merged lead
      // has an annotation per sub-record; writing only the primary left the
      // others stale, so the inbox and the record page could disagree.
      // 'manual' marks a human decision, which the GHL sync never overwrites.
      const patch = { owner_id: ownerId, owner_source: ownerId ? 'manual' as const : null };
      const message = ownerId ? `Assigned to ${ownerName ?? 'owner'}` : 'Owner cleared';
      const targets = [lead, ...(lead._merged ?? [])];
      const results = await Promise.all(
        targets.map((t, i) => setAnnotation(t, patch, i === 0 ? message : undefined)),
      );
      return results.every(Boolean);
    },
    [setAnnotation]
  );


  const setStage = useCallback(
    (lead: UnifiedLead, stage: string | null) =>
      setAnnotation(lead, { stage }, stage ? `Stage set to ${stage}` : 'Stage cleared'),
    [setAnnotation]
  );

  const setOutcome = useCallback(
    (lead: UnifiedLead, outcome: LeadOutcome | null) =>
      setAnnotation(lead, { outcome }, outcome ? `Marked ${outcome}` : 'Outcome cleared'),
    [setAnnotation]
  );

  /** Add a note (keyed to the lead's own source+id). */
  const addNote = useCallback(
    async (lead: UnifiedLead, body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return false;
      const uid = await currentUserId();
      const optimistic: LeadNote = {
        id: `optimistic-${Date.now()}`,
        lead_source: lead.source,
        lead_id: lead.id,
        body: trimmed,
        author_id: uid,
        created_at: new Date().toISOString(),
      };
      const prev = patchLeadInCache(lead.source, lead.id, (l) => {
        const notes = [optimistic, ...(l.notes ?? [])];
        return { ...l, notes, notesCount: notes.length };
      });
      const prevOverlay = patchOverlayNote(optimistic);

      const { error } = await supabase.from('lead_notes').insert({
        lead_source: lead.source,
        lead_id: lead.id,
        body: trimmed,
        author_id: uid,
      });

      if (error) {
        if (prev) qc.setQueryData(QK, prev);
        if (prevOverlay) qc.setQueryData(OVERLAY_QK, prevOverlay);
        toast.error('Could not add note. Please try again.', {
          action: { label: 'Retry', onClick: () => addNote(lead, trimmed) },
        });
        return false;
      }
      invalidateOverlays();

      // Push the note to GHL when the lead has a genuine GHL contact id
      // (its own, or one from a merged dupe). Never block the local save on this.
      const ghlContactId =
        lead.ghl_contact_id ||
        (lead._merged ?? []).find((m) => m.ghl_contact_id)?.ghl_contact_id ||
        null;

      if (!ghlContactId) {
        toast.success('Note added (not synced — no GHL contact)');
        return true;
      }

      toast.success('Note added');
      try {
        const { data, error: fnError } = await supabase.functions.invoke('ghl-add-note', {
          body: { contact_id: ghlContactId, body: trimmed, author_name: adminName },
        });
        if (fnError || (data && data.success === false)) {
          throw new Error(fnError?.message || data?.error || 'GHL sync failed');
        }
        toast.success('Note synced to GHL');
      } catch {
        toast.error('Saved locally — GHL sync failed');
      }
      return true;
    },
    [currentUserId, patchLeadInCache, patchOverlayNote, invalidateOverlays, qc, adminName]
  );


  /** Delete a local lead_note by id (optimistic).
   *  Purely local — never calls the GHL edge function. The GHL two-way delete
   *  path lives in the Notes card where a GHL note id is known. */
  const deleteNote = useCallback(
    async (lead: UnifiedLead, noteId: string) => {
      // Guard: optimistic ids are not in the DB yet — treat as no-op success so
      // the row disappears from the UI without hitting the network.
      if (!noteId || noteId.startsWith('optimistic-')) {
        patchLeadInCache(lead.source, lead.id, (l) => {
          const notes = (l.notes ?? []).filter((n) => n.id !== noteId);
          return { ...l, notes, notesCount: notes.length };
        });
        return true;
      }
      const prev = patchLeadInCache(lead.source, lead.id, (l) => {
        const notes = (l.notes ?? []).filter((n) => n.id !== noteId);
        return { ...l, notes, notesCount: notes.length };
      });
      const prevOverlay = qc.getQueryData<LeadOverlayData>(OVERLAY_QK);
      if (prevOverlay) {
        qc.setQueryData<LeadOverlayData>(OVERLAY_QK, {
          ...prevOverlay,
          notes: prevOverlay.notes.filter((n) => n.id !== noteId),
        });
      }
      const { error } = await supabase.from('lead_notes').delete().eq('id', noteId);
      if (error) {
        console.error('lead_notes delete failed', error);
        if (prev) qc.setQueryData(QK, prev);
        if (prevOverlay) qc.setQueryData(OVERLAY_QK, prevOverlay);
        return false;
      }
      invalidateOverlays();
      return true;
    },
    [patchLeadInCache, invalidateOverlays, qc]
  );

  return { setAnnotation, setOwner, setStage, setOutcome, addNote, deleteNote };
}

