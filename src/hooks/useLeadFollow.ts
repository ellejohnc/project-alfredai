import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedLead, leadKey } from '@/lib/unifiedLead';
import { LEAD_OVERLAY_QK, useLeadOverlayData } from '@/hooks/useLeadOverlay';
import { useSalesReps } from '@/hooks/useSalesReps';

/**
 * A lightweight "keep me in the loop" flag on a lead. A merged lead is ONE
 * person, so a follow is written to the primary record AND every merged
 * sub-record, and reads are deduped the same way — otherwise the same human
 * would look followed on one row and not on another.
 *
 * This was built local-only on the stated basis that GoHighLevel had no
 * followers concept. It does: POST/DELETE /contacts/{id}/followers. The local
 * table stays the source of truth for OUR state — it covers every source,
 * including leads with no GHL contact at all — and the GHL push is a
 * best-effort mirror on top, so a GHL failure never blocks following a lead
 * here.
 */
function recordsFor(lead: UnifiedLead) {
  return [lead, ...(lead._merged ?? [])].map((l) => ({
    lead_source: l.source as string,
    lead_id: l.id,
  }));
}

export function useLeadFollow(lead: UnifiedLead | null | undefined) {
  const qc = useQueryClient();
  const { data: overlay } = useLeadOverlayData();
  const { data: reps = [] } = useSalesReps();
  const [saving, setSaving] = useState(false);

  const keys = useMemo(
    () => (lead ? recordsFor(lead).map((r) => leadKey(r.lead_source, r.lead_id)) : []),
    [lead],
  );

  const followerIds = useMemo(() => {
    const set = new Set<string>();
    for (const f of overlay?.followers ?? []) {
      if (keys.includes(leadKey(f.lead_source, f.lead_id))) set.add(f.follower_id);
    }
    return Array.from(set);
  }, [overlay?.followers, keys]);

  const followers = useMemo(
    () =>
      followerIds.map((id) => ({
        id,
        name: reps.find((r) => r.id === id)?.display_name ?? 'Team member',
      })),
    [followerIds, reps],
  );

  const toggleFollow = useCallback(async () => {
    if (!lead) return;
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error('You need to be signed in to follow a lead.');
      const isFollowing = followerIds.includes(uid);
      const rows = recordsFor(lead);

      if (isFollowing) {
        await Promise.all(
          rows.map((r) =>
            supabase
              .from('lead_followers')
              .delete()
              .eq('lead_source', r.lead_source)
              .eq('lead_id', r.lead_id)
              .eq('follower_id', uid),
          ),
        );
        toast.success('You are no longer following this lead');
      } else {
        const { error } = await supabase
          .from('lead_followers')
          .upsert(
            rows.map((r) => ({ ...r, follower_id: uid })),
            { onConflict: 'lead_source,lead_id,follower_id' },
          );
        if (error) throw error;
        toast.success('Following this lead');
      }

      // Mirror to GHL when this person exists there. Deliberately after the
      // local write and deliberately not awaited into the error path: the local
      // follow is the thing the user asked for, and a GHL hiccup must not undo
      // it or show them a failure for something that did succeed.
      const ghlContactId = lead.ghl_contact_id ?? null;
      const email = auth.user?.email;
      if (ghlContactId && email) {
        supabase.functions
          .invoke('ghl-set-followers', {
            body: {
              contact_id: ghlContactId,
              [isFollowing ? 'remove' : 'add']: [email],
            },
          })
          .catch((e) => console.warn('[useLeadFollow] GHL follower sync failed', e));
      }

      await qc.invalidateQueries({ queryKey: LEAD_OVERLAY_QK });
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Couldn't update following. Please try again or email us.",
      );
    } finally {
      setSaving(false);
    }
  }, [lead, followerIds, qc]);

  return { followerIds, followers, toggleFollow, saving };
}

/** Read-only variant for rows/cards that only need to render the avatars. */
export function useLeadFollowers(lead: UnifiedLead | null | undefined) {
  const { followers } = useLeadFollow(lead);
  return followers;
}
