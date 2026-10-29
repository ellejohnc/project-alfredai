import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadAnnotation, LeadNote, leadKey } from '@/lib/unifiedLead';

/**
 * Shared read model for the CRM overlay (owner / stage / outcome + notes) that
 * powers BOTH the unified Leads Inbox and the legacy admin panels. It reads the
 * SAME side tables (lead_annotations / lead_notes) the inbox uses so every
 * surface renders identical overlay state for the same (lead_source, lead_id).
 *
 * `useLeadActions` invalidates this query key alongside ['unified-leads'] and
 * optimistically patches this cache, so a change made anywhere (inbox row,
 * record page, or any panel) is reflected everywhere with no drift.
 */
export const LEAD_OVERLAY_QK = ['lead-overlay'] as const;

export interface LeadFollower {
  id: string;
  lead_source: string;
  lead_id: string;
  follower_id: string;
}

export interface LeadOverlayData {
  annotations: LeadAnnotation[];
  notes: LeadNote[];
  followers: LeadFollower[];
}

async function fetchLeadOverlay(): Promise<LeadOverlayData> {
  const [aRes, nRes, fRes] = await Promise.all([
    supabase.from('lead_annotations').select('*'),
    supabase.from('lead_notes').select('*').order('created_at', { ascending: false }),
    supabase.from('lead_followers').select('id, lead_source, lead_id, follower_id'),
  ]);
  if (aRes.error) throw aRes.error;
  if (nRes.error) throw nRes.error;
  return {
    annotations: (aRes.data ?? []) as LeadAnnotation[],
    notes: (nRes.data ?? []) as LeadNote[],
    // Followers are a nice-to-have: never fail the whole overlay over them.
    followers: fRes.error ? [] : ((fRes.data ?? []) as LeadFollower[]),
  };
}


/** Underlying query — deduped by react-query so every row/card shares one fetch. */
export function useLeadOverlayData() {
  return useQuery({
    queryKey: LEAD_OVERLAY_QK,
    queryFn: fetchLeadOverlay,
    // Never dead-end a panel if the overlay tables can't be read.
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export interface LeadOverlayFor {
  annotation: LeadAnnotation | null;
  notes: LeadNote[];
  notesCount: number;
  followerIds: string[];
}

/**
 * Overlay for a single (source, id) — used by the read-only row badges and to
 * build the minimal lead passed to the shared Ownership / Notes cards.
 */
export function useLeadOverlay(source: string, id: string | null | undefined): LeadOverlayFor {
  const { data } = useLeadOverlayData();
  const key = id ? leadKey(source, id) : null;
  if (!key || !data) return { annotation: null, notes: [], notesCount: 0, followerIds: [] };

  const annotation =
    data.annotations.find((a) => leadKey(a.lead_source, a.lead_id) === key) ?? null;
  const notes = data.notes
    .filter((n) => leadKey(n.lead_source, n.lead_id) === key)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const followerIds = Array.from(
    new Set(
      (data.followers ?? [])
        .filter((f) => leadKey(f.lead_source, f.lead_id) === key)
        .map((f) => f.follower_id),
    ),
  );

  return { annotation, notes, notesCount: notes.length, followerIds };
}

