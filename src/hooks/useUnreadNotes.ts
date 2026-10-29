import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useGhlNotes } from '@/hooks/useGhlLead';
import type { UnifiedLead } from '@/lib/unifiedLead';
import { getNotesSeenAtRaw, setNotesSeenAt } from '@/lib/notesSeen';

/**
 * Unread-notes indicator for a lead record. A note is "unread" when it was added
 * by someone else, or synced from GHL, AFTER the current admin first encountered
 * this lead (baseline = first view). markSeen() clears it (called when the Notes
 * tab is opened).
 */
export function useUnreadNotes(lead: UnifiedLead | null, ghlContactId: string | null) {
  const { user } = useAdminAuth();
  const uid = user?.id ?? null;
  const adminName = (((user?.user_metadata?.display_name as string) || user?.email || '')).trim().toLowerCase();
  const { data: ghlNotes = [] } = useGhlNotes(ghlContactId);

  const source = lead?.source ?? '';
  const id = lead?.id ?? '';
  const [seenAt, setSeenAt] = useState(0);

  // Resolve (or baseline) the "last seen" timestamp once the lead + user are known.
  useEffect(() => {
    if (!id) return;
    const stored = getNotesSeenAtRaw(uid, source, id);
    if (stored == null) {
      const now = Date.now();
      setNotesSeenAt(uid, source, id, now);
      setSeenAt(now);
    } else {
      setSeenAt(stored);
    }
  }, [uid, source, id]);

  const items = useMemo(() => {
    const local = (lead?.notes ?? []).map((n) => ({
      at: new Date(n.created_at).getTime(),
      mine: n.author_id === uid,
    }));
    const remote = (ghlNotes ?? []).map((n) => ({
      at: new Date(n.createdAt ?? 0).getTime(),
      mine: !!adminName && (n.author ?? '').trim().toLowerCase() === adminName,
    }));
    return [...local, ...remote];
  }, [lead?.notes, ghlNotes, uid, adminName]);

  const newestAt = useMemo(() => items.reduce((m, n) => Math.max(m, n.at || 0), 0), [items]);
  const unreadCount = useMemo(
    () => items.filter((n) => n.at > seenAt && !n.mine).length,
    [items, seenAt],
  );

  const markSeen = useCallback(() => {
    if (!id) return;
    const ts = Math.max(newestAt, seenAt, Date.now());
    setNotesSeenAt(uid, source, id, ts);
    setSeenAt(ts);
  }, [uid, source, id, newestAt, seenAt]);

  return { unreadCount, markSeen };
}
