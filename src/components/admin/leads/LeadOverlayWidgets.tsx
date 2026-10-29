import { UnifiedLead, LeadSource } from '@/lib/unifiedLead';
import { useSalesReps } from '@/hooks/useSalesReps';
import { useLeadOverlay } from '@/hooks/useLeadOverlay';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { hasUnreadLocalNotes } from '@/lib/notesSeen';
import { OwnerBadge, OutcomePill, NoteCountBadge, StagePill } from './leadOverlayUi';
import { LeadOwnershipCard, LeadNotesCard } from './LeadOverlayPanels';


/**
 * Build a minimal UnifiedLead carrying just the identity + overlay fields the
 * shared cards / actions need. The overlay is keyed by (lead_source, lead_id),
 * so the same annotation/notes surface on the inbox and every legacy panel for
 * the same record.
 */
function makeOverlayLead(
  source: LeadSource,
  id: string,
  name: string,
  overlay: ReturnType<typeof useLeadOverlay>
): UnifiedLead {
  return {
    id,
    source,
    name: name || 'Lead',
    email: null,
    phone: null,
    company: null,
    status: null,
    created_at: new Date().toISOString(),
    source_url: null,
    referrer: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    ghl_contact_id: null,
    appointment_id: null,
    raw: {},
    annotation: overlay.annotation,
    notes: overlay.notes,
    notesCount: overlay.notesCount,
  };
}

/**
 * Read-only overlay badges (owner / won-lost / note count) for a legacy panel
 * row. Renders nothing when there's no overlay data, so it slots into any row
 * layout without taking space when empty.
 */
export function LeadOverlayBadges({
  source,
  id,
  className,
}: {
  source: LeadSource;
  id: string | null | undefined;
  className?: string;
}) {
  const { data: reps = [] } = useSalesReps();
  const { user } = useAdminAuth();
  const overlay = useLeadOverlay(source, id);
  const { annotation, notes, notesCount } = overlay;
  const hasAny =
    annotation?.owner_id || annotation?.stage || annotation?.outcome || notesCount > 0;
  if (!hasAny) return null;
  const unread = id
    ? hasUnreadLocalNotes({ source, id, notes }, user?.id ?? null)
    : false;

  return (
    <span className={className ?? 'inline-flex flex-wrap items-center gap-1.5'}>
      <OwnerBadge ownerId={annotation?.owner_id} reps={reps} />
      <StagePill stage={annotation?.stage} />
      <OutcomePill outcome={annotation?.outcome} />
      <NoteCountBadge count={notesCount} unread={unread} />
    </span>
  );
}

/**
 * Full read/write overlay for a legacy panel's detail view: the SAME
 * Ownership & status + Notes cards used on the inbox record page. Writes go
 * through useLeadActions, which invalidates the shared overlay + unified-leads
 * queries so every surface stays in sync.
 */
export function LeadOverlaySection({
  source,
  id,
  name,
  className,
}: {
  source: LeadSource;
  id: string | null | undefined;
  name?: string;
  className?: string;
}) {
  const overlay = useLeadOverlay(source, id);
  if (!id) return null;
  const lead = makeOverlayLead(source, id, name ?? '', overlay);
  return (
    <div className={className ?? 'grid gap-3 sm:grid-cols-2'}>
      <LeadOwnershipCard lead={lead} />
      <LeadNotesCard lead={lead} />
    </div>
  );
}
