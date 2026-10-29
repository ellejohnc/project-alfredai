import { LeadRowActions } from './LeadRowActions';
import { useLeadOverlay } from '@/hooks/useLeadOverlay';
import type { UnifiedLead, LeadSource } from '@/lib/unifiedLead';

interface Props {
  source: LeadSource;
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  status?: string | null;
  createdAt?: string;
  sourceUrl?: string | null;
  ghlContactId?: string | null;
  appointmentId?: string | null;
  raw?: Record<string, unknown>;
  /** Optional focused edit hook — currently used by WebinarLeadsAdmin only. */
  onEdit?: () => void;
}

/**
 * Wraps `LeadRowActions` for the legacy per-source admin pages (Booked,
 * Demo, Webinar, ...). Builds a lightweight UnifiedLead + attaches the
 * shared overlay (annotation / notes) so the same "…" menu, owner picker,
 * add-note, and open-in-GHL actions work everywhere.
 */
export function LegacyLeadActions(props: Props) {
  const overlay = useLeadOverlay(props.source, props.id);
  const lead: UnifiedLead = {
    id: props.id,
    source: props.source,
    name: props.name || 'Lead',
    email: props.email ?? null,
    phone: props.phone ?? null,
    company: props.company ?? null,
    status: props.status ?? null,
    created_at: props.createdAt ?? new Date().toISOString(),
    source_url: props.sourceUrl ?? null,
    referrer: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    ghl_contact_id: props.ghlContactId ?? null,
    appointment_id: props.appointmentId ?? null,
    raw: (props.raw ?? {}) as Record<string, unknown>,
    annotation: overlay.annotation,
    notes: overlay.notes,
    notesCount: overlay.notesCount,
  };
  return <LeadRowActions lead={lead} onEdit={props.onEdit} />;
}
