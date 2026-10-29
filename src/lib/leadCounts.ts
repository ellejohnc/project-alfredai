// Phase 2 — SINGLE SOURCE OF TRUTH for lead counts.
//
// Every place that shows a lead "count" (the Leads Inbox tabs/sources, each
// legacy panel header, and the /admin dashboard "Leads & CRM" cards) MUST
// derive its number from THIS utility, computed over the SAME unified dataset
// (useUnifiedLeads) using the SAME classifiers already used by the Inbox
// (isBooked / inSegment / countsBySource). Do NOT invent a parallel count.
//
// ------------------------------------------------------------------------
// Reconciled inclusion rules (documented so every surface applies them the
// same way):
//
// 1. ARCHIVED: rows with a non-null `archived_at` are EXCLUDED. Only three
//    source tables actually have an `archived_at` column — ghl_submissions,
//    alpha_digital_leads and leads — and the Inbox fetchers already filter
//    `.is('archived_at', null)` for exactly those. meta_leads, investor_leads,
//    webinar_registrations have NO such column, so there is
//    nothing to filter. The rule is therefore "exclude archived wherever the
//    column exists", applied identically in the Inbox fetchers and the panels.
//
// 2. DEMO: a Demo lead is a `ghl_submissions` row with lead_source =
//    'demo_share' (someone who submitted contact details via a shared demo
//    link). The anonymous `demo_engagement` telemetry table is NOT a lead
//    source and is never counted here.
// ------------------------------------------------------------------------

import { UnifiedLead, LeadSource } from '@/lib/unifiedLead';
import { BOOKED_STATUSES } from './leadSegments';
import { LeadSegment, SEGMENT_DEFS, inSegment, isBooked } from '@/lib/leadSegments';



/**
 * The EXACT predicate the GHLSubmissionsAdmin panel uses to exclude
 * calendar-originated / booked rows from its list (see GHLSubmissionsAdmin
 * query: excludes ghl_status in (confirmed,cancelled,rescheduled), lead_source
 * = calendar_widget, source_medium = ghl_direct_booking). Reused verbatim here
 * so the dashboard "GHL Sync" card and the panel header are guaranteed equal.
 * Operates on the raw ghl_submissions row (archived rows are already excluded
 * upstream by the unified fetcher's `.is('archived_at', null)`).
 */
export function isGhlSubmissionNonBooked(raw: Record<string, unknown>): boolean {
  const status = String(raw.ghl_status ?? '');
  // Reuses the one vocabulary rather than a fourth copy of it. `completed` and
  // `no_show` were missing here too, so an attended meeting counted as a
  // non-booked submission on the dashboard card and in the panel header.
  if (BOOKED_STATUSES.includes(status) || status === 'cancelled') {
    return false;
  }
  if (raw.lead_source === 'calendar_widget') return false;
  if (raw.source_medium === 'ghl_direct_booking') return false;
  return true;
}

export interface LeadCounts {
  /** Post-merge total (matches the Inbox "All" tab). */
  total: number;
  /** Per-source counts (matches the Inbox source tabs / countsBySource). */
  bySource: Record<LeadSource, number>;
  /** Per-segment counts over the merged list (matches the Inbox segment tabs). */
  bySegment: Record<LeadSegment, number>;
  /** Convenience derived numbers used by the dashboard cards. */
  booked: number; // isBooked — dashboard "Booked" card + Inbox "Booked" tab + Booked Leads page
  ghlSubmissions: number; // ghl_submissions source — Inbox "Website / Booking" source tab
  /**
   * ghl_submissions rows that are NOT booked/calendar-originated, using the
   * EXACT GHLSubmissionsAdmin panel predicate — dashboard "GHL Sync" card.
   * Guaranteed equal to the GHLSubmissionsAdmin panel header count.
   */
  ghlSubmissionsNonBooked: number;
  investors: number; // investor_leads source — dashboard "Investors" card
  events: number; // webinar_registrations source — dashboard "Events" card
}

const EMPTY_BY_SOURCE = {} as Record<LeadSource, number>;

/**
 * Compute all lead counts from the unified dataset. `leads` is the post-merge
 * UnifiedLead[] (data.leads); `countsBySource` is data.countsBySource from the
 * same hook. Returns a stable shape even when data is not yet loaded.
 */
export function computeLeadCounts(
  leads: UnifiedLead[] | undefined,
  countsBySource: Record<LeadSource, number> | undefined,
): LeadCounts {
  const list = leads ?? [];
  const bySource = countsBySource ?? EMPTY_BY_SOURCE;

  const bySegment = {} as Record<LeadSegment, number>;
  SEGMENT_DEFS.forEach((def) => (bySegment[def.id] = 0));
  list.forEach((lead) => {
    SEGMENT_DEFS.forEach((def) => {
      if (inSegment(lead, def.id)) bySegment[def.id] += 1;
    });
  });

  // Count non-booked ghl_submissions over the full set (primary rows + any
  // merged sub-records) so merge-dedup never diverges from the panel, which
  // does not dedupe.
  let ghlSubmissionsNonBooked = 0;
  const countGhl = (l: UnifiedLead) => {
    if (l.source === 'ghl_submissions' && isGhlSubmissionNonBooked(l.raw)) {
      ghlSubmissionsNonBooked += 1;
    }
  };
  list.forEach((lead) => {
    countGhl(lead);
    (lead._merged ?? []).forEach(countGhl);
  });

  return {
    total: list.length,
    bySource,
    bySegment,
    booked: list.filter((l) => isBooked(l)).length,
    ghlSubmissions: bySource.ghl_submissions ?? 0,
    ghlSubmissionsNonBooked,
    investors: bySource.investor_leads ?? 0,
    events: bySource.webinar_registrations ?? 0,
  };
}
