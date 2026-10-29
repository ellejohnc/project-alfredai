import type { UnifiedLead } from '@/lib/unifiedLead';

/** Per-admin, per-lead "notes last seen" timestamps in localStorage.
 *  Powers the unread-notes badge with no DB round-trip. */
function seenKey(userId: string | null, source: string, id: string): string {
  return `notes-seen:${userId ?? 'anon'}:${source}:${id}`;
}

export function getNotesSeenAtRaw(userId: string | null, source: string, id: string): number | null {
  try {
    const v = localStorage.getItem(seenKey(userId, source, id));
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function setNotesSeenAt(userId: string | null, source: string, id: string, ts: number): void {
  try {
    localStorage.setItem(seenKey(userId, source, id), String(ts));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

/** True when a lead has a local note from someone else, newer than the admin's
 *  last-seen baseline for that lead. Baseline is only set once the record has
 *  been opened, so brand-new/never-opened leads don't light up retroactively. */
export function hasUnreadLocalNotes(
  lead: Pick<UnifiedLead, 'source' | 'id' | 'notes'>,
  userId: string | null,
): boolean {
  const seen = getNotesSeenAtRaw(userId, lead.source, lead.id);
  if (seen == null) return false;
  return (lead.notes ?? []).some((n) => {
    const t = new Date(n.created_at).getTime();
    return t > seen && n.author_id !== userId;
  });
}
