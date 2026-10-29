// Shared helpers for jumping between the unified Leads Inbox and the legacy
// admin panel that owns a given record (Phase 4 "perfect sync").
//
// Kept in one place so the Inbox row dialog, the row ⋯ actions menu and the
// Inbox record page all deep-link to the SAME panel + record.

import { UnifiedLead, LEAD_SOURCE_META, LeadSource } from '@/lib/unifiedLead';

/** True when a ghl_submissions lead is really a booked/appointment record. */
function isBookingRecord(lead: Pick<UnifiedLead, 'source' | 'status' | 'raw'>): boolean {
  if (lead.source !== 'ghl_submissions') return false;
  const raw = (lead.raw ?? {}) as Record<string, unknown>;
  return (
    ['confirmed', 'cancelled', 'rescheduled'].includes(lead.status ?? '') ||
    raw.lead_source === 'calendar_widget' ||
    raw.source_medium === 'ghl_direct_booking'
  );
}

/**
 * Priority order of sources that have a real, DISTINCT legacy admin panel.
 *
 * IMPORTANT: 'leads' (Site Leads) is intentionally EXCLUDED — its "legacy path"
 * is '/admin/leads', which IS the unified Inbox itself, so routing there just
 * bounces back to the Inbox instead of opening a dedicated record view.
 */
const DISTINCT_PANEL_PRIORITY: LeadSource[] = [
  'ghl_submissions',
  'investor_leads',
  'meta_leads',
  'alpha_digital_leads',
  'webinar_registrations',
];

export interface DistinctPanelTarget {
  /** Deep-link path to the exact record inside its legacy panel. */
  path: string;
  /** Friendly name of the panel (for the "Open in <panel>" button). */
  name: string;
}

/** Expand a lead into its full record set (primary + merged sub-records). */
export function allRecordsOf(lead: UnifiedLead): UnifiedLead[] {
  return [lead, ...(lead._merged ?? [])];
}

/**
 * Given a person's FULL set of records (primary + merged sub-records), return
 * the best DISTINCT panel target, or null if none exists (a pure Site Lead).
 *
 * Booking records win first (Booked Leads panel), then the ordered priority of
 * sources that own a real dedicated panel. 'leads' is always ignored because it
 * collides with the unified Inbox.
 */
export function bestDistinctPanel(records: UnifiedLead[]): DistinctPanelTarget | null {
  // 1. A GHL booking → the Booked Leads panel.
  const booking = records.find((r) => isBookingRecord(r));
  if (booking) {
    return { path: `/admin/leads-booked?record=${booking.id}`, name: 'Booked Leads' };
  }

  // 2. First record whose source has a dedicated (non-Inbox) panel.
  for (const source of DISTINCT_PANEL_PRIORITY) {
    const match = records.find((r) => r.source === source);
    if (match) {
      const meta = LEAD_SOURCE_META[source];
      return { path: `${meta.legacyPath}?record=${match.id}`, name: meta.label };
    }
  }

  // 3. Pure Site Lead (or unknown) — no distinct panel exists.
  return null;
}

/** Convenience: compute the distinct panel target from a single lead object. */
export function distinctPanelForLead(lead: UnifiedLead): DistinctPanelTarget | null {
  return bestDistinctPanel(allRecordsOf(lead));
}

/**
 * Record ROUTE (not `?record=` deep-link) for each source that owns a page:
 * `/admin/<list>/<id>`. Booked leads live under /admin/leads-booked.
 */
const RECORD_ROUTE_BASE: Partial<Record<LeadSource, { base: string; name: string }>> = {
  ghl_submissions: { base: '/admin/leads-booked', name: 'Booked Leads' },
  investor_leads: { base: '/admin/investor-leads', name: 'Investor Leads' },
  meta_leads: { base: '/admin/meta-leads', name: 'Meta Leads' },
  alpha_digital_leads: { base: '/admin/alpha-digital-leads', name: 'Alpha Digital Leads' },
  webinar_registrations: { base: '/admin/webinar-leads', name: 'Webinar Leads' },
};

export interface RecordRouteTarget {
  /** Route to the full record page. */
  path: string;
  /** Button label, e.g. "Open in Booked Leads" or "Open full record". */
  label: string;
}

/**
 * Where the peek's primary button should go: the source's OWN record route when
 * it has a dedicated page, otherwise the Inbox record (`/admin/leads/{id}`),
 * which is the only home Site Leads has.
 */
export function recordRouteForLead(
  lead: Pick<UnifiedLead, 'id' | 'source'>,
): RecordRouteTarget {
  const target = RECORD_ROUTE_BASE[lead.source];
  if (!target) return { path: `/admin/leads/${lead.id}`, label: 'Open full record' };
  return { path: `${target.base}/${lead.id}`, label: `Open in ${target.name}` };
}
