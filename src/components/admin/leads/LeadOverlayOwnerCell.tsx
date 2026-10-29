import { useSalesReps } from '@/hooks/useSalesReps';
import { useLeadOverlay } from '@/hooks/useLeadOverlay';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { hasUnreadLocalNotes } from '@/lib/notesSeen';
import { OutcomePill } from './leadOverlayUi';
import { ownerName } from './ownerName';
import { LeadOwnerCell } from './LeadOwnerCell';
import type { LeadSource } from '@/lib/unifiedLead';

/**
 * The Owner column for a legacy lead page, rendered in the shared row shape.
 *
 * The legacy pages each fetch their own narrow row type, which has no owner on
 * it — ownership lives in the shared overlay, keyed by (source, id). This
 * bridges the two so a legacy page can fill the kit's Owner column without
 * changing the shape it fetches.
 *
 * `useLeadOverlay` and `useSalesReps` are react-query hooks, so rendering this
 * once per row costs one cache read per row, not one request.
 */
export function LeadOverlayOwnerCell({
  source,
  id,
}: {
  source: LeadSource;
  id: string | null | undefined;
}) {
  const { data: reps = [] } = useSalesReps();
  const { user } = useAdminAuth();
  const { annotation, notes, notesCount } = useLeadOverlay(source, id);

  const ownerId = annotation?.owner_id ?? null;
  const name = ownerName(ownerId, reps);
  const unread = id ? hasUnreadLocalNotes({ source, id, notes }, user?.id ?? null) : false;

  return (
    <LeadOwnerCell
      owner={ownerId ? { id: ownerId, name: name ?? 'Owner' } : null}
      noteCount={notesCount}
      unreadNotes={unread}
    />
  );
}

/**
 * Won / Lost pill for a legacy row, read from the same overlay cache as the
 * Owner cell above. Renders nothing when the lead has no outcome yet.
 */
export function LeadOverlayOutcome({
  source,
  id,
}: {
  source: LeadSource;
  id: string | null | undefined;
}) {
  const { annotation } = useLeadOverlay(source, id);
  if (!annotation?.outcome) return null;
  return <OutcomePill outcome={annotation.outcome} />;
}
