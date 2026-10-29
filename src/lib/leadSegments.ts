// Segment classification for the unified Leads Inbox (Phase 1).
//
// Segments are Gmail-style LABELS over ONE merged list — they are pure,
// client-side filtered views of the same UnifiedLead[]. They are NOT separate
// data sources. Keep every rule here so the inbox and the lead detail page
// classify a lead identically (a lead that lives in "Booked" must open in
// booked context).

import { UnifiedLead } from '@/lib/unifiedLead';
import { getGHLSyncStatus, isBenignBookingSkip } from '@/lib/ghlSyncStatus';

export type LeadSegment =
  | 'all'
  | 'booked'
  | 'incomplete'
  | 'website'
  | 'demo'
  | 'meta'
  | 'matchmaking'
  | 'sync'
  | 'investors'
  | 'alpha'
  | 'webinar';

export interface SegmentDef {
  id: LeadSegment;
  label: string;
  /** Primary tabs show in the main row; non-primary fold into the "More" menu. */
  primary: boolean;
}

export const SEGMENT_DEFS: SegmentDef[] = [
  { id: 'all', label: 'All', primary: true },
  { id: 'booked', label: 'Booked', primary: true },
  { id: 'incomplete', label: 'Incomplete', primary: true },
  { id: 'website', label: 'Website', primary: true },
  { id: 'demo', label: 'Demo', primary: true },
  { id: 'meta', label: 'Meta', primary: true },
  { id: 'matchmaking', label: 'B2B Matchmaking', primary: true },
  { id: 'sync', label: 'Sync', primary: true },
  { id: 'investors', label: 'Investors', primary: true },
  { id: 'alpha', label: 'Alpha Digital', primary: true },
  { id: 'webinar', label: 'Webinar / Events', primary: true },
];


/** Source badge shown on each row. */
export type SourceBadge = 'Website' | 'Meta' | 'Booked' | 'Referral';

/**
 * Every status that means THIS LEAD BOOKED A MEETING.
 *
 * `completed` and `no_show` joined the vocabulary on 6 Sep, when the booking
 * webhook stopped guessing appointment status by substring and started mapping
 * it — and nothing that READS the status was updated to match. An attended
 * meeting became `completed`, which no consumer recognised, so the lead fell
 * out of the booked counts and reappeared in the incomplete list: the most
 * booked thing that can happen to a lead made it look un-booked.
 *
 * A no-show belongs here too. The meeting was booked; somebody did not turn
 * up. That is a different fact from never having booked, and only one of them
 * is this list's question.
 *
 * Exported so there is ONE copy. There were four — here, the incomplete
 * predicate below, isConfirmed below that, and leadCounts — and they drifted
 * exactly as two hand-copied lists of routes did.
 */
export const BOOKED_STATUSES = ['confirmed', 'rescheduled', 'completed', 'no_show'];

/** GHL-backed sources. Only these carry a real GHL sync status. */
const GHL_SOURCES = ['ghl_submissions', 'leads'];

/** True when the lead's source is tied to GoHighLevel sync. */
export function isGHLSource(lead: Pick<UnifiedLead, 'source' | 'ghl_contact_id'>): boolean {
  if (GHL_SOURCES.includes(lead.source)) return true;
  // Meta leads imported from GHL carry a real contact id — they ARE in GHL,
  // so they get sync status + View-in-GHL (unlike investor/webinar leads).
  if (lead.source === 'meta_leads' && !!lead.ghl_contact_id) return true;
  // Alpha Digital leads that have been manually pushed to GHL (via
  // push-alpha-lead-to-ghl) also carry a real contact id.
  if (lead.source === 'alpha_digital_leads' && !!lead.ghl_contact_id) return true;
  return false;
}

/**
 * True when the lead has a GENUINELY CONFIRMED appointment.
 * Booked = a real confirmed appointment: an attached appointment_id, or a
 * status of confirmed/rescheduled (on this record OR a merged sub-record).
 *
 * NOTE: we intentionally do NOT treat `lead_source === 'calendar_widget'` or
 * `source_medium === 'ghl_direct_booking'` as booked on their own — those also
 * fire for `booking_shown` (calendar shown but NOT yet confirmed). Those leads
 * belong in Incomplete, never Booked.
 */
export function isBooked(lead: UnifiedLead): boolean {
  if (lead.appointment_id) return true;
  if (lead.status && BOOKED_STATUSES.includes(lead.status)) return true;
  // A merged/attached record may carry the confirmed appointment.
  if ((lead._merged ?? []).some((m) => m.appointment_id || BOOKED_STATUSES.includes(m.status ?? ''))) {
    return true;
  }
  return false;
}

/** True when the lead came from Meta (Facebook / Instagram) paid social. */
export function isMeta(lead: UnifiedLead): boolean {
  if (lead.source === 'meta_leads') return true;
  const src = (lead.utm_source ?? '').toLowerCase();
  const med = (lead.utm_medium ?? '').toLowerCase();
  if (['meta', 'facebook', 'instagram', 'fb', 'ig'].includes(src)) return true;
  if (med === 'paid_social') return true;
  return false;
}

/** True when a single record is a demo-share ghl_submission. */
function isDemoShareRecord(rec: Pick<UnifiedLead, 'source' | 'raw'>): boolean {
  return (
    rec.source === 'ghl_submissions' &&
    ((rec.raw as Record<string, unknown> | undefined)?.lead_source === 'demo_share')
  );
}

/**
 * True when the lead is a demo-share lead (submitted contact details via a
 * shared demo link) — checking the primary record OR any merged sub-record, so
 * demo leads that got merged into another record (same person booked/submitted
 * elsewhere) still count as Demo and never vanish from the tab.
 */
export function isDemo(lead: UnifiedLead): boolean {
  if (isDemoShareRecord(lead)) return true;
  return (lead._merged ?? []).some(isDemoShareRecord);
}

/** Return the underlying demo-share record for a unified lead (primary or merged). */
export function demoShareRecord(lead: UnifiedLead): UnifiedLead | null {
  if (isDemoShareRecord(lead)) return lead;
  return (lead._merged ?? []).find(isDemoShareRecord) ?? null;
}

/**
 * True when this lead is a reply to the alfred ai B2B Matchmaking outreach —
 * manually added to the `leads` table with source_campaign =
 * 'alfred_b2b_matchmaking' (also matches source_page starting with the same
 * slug, or a ghl_response.campaign that names the outreach).
 */
export function isB2bMatchmaking(lead: UnifiedLead): boolean {
  if (lead.source !== 'leads') return false;
  const campaign = (lead.source_campaign ?? '').toLowerCase();
  if (campaign === 'alfred_b2b_matchmaking') return true;
  const page = (lead.source_page ?? '').toLowerCase();
  if (page.startsWith('alfred_b2b_matchmaking')) return true;
  const respCampaign = String(
    ((lead.raw as Record<string, unknown>)?.ghl_response as Record<string, unknown> | undefined)?.campaign ?? '',
  ).toLowerCase();
  if (respCampaign.includes('b2b matchmaking')) return true;
  return false;
}

/** True when the lead came from our own website (form / enquiry request). */
export function isWebsite(lead: UnifiedLead): boolean {
  if (isMeta(lead)) return false;
  if (isDemo(lead)) return false;
  // B2B Matchmaking replies have their own dedicated tab — never Website.
  if (isB2bMatchmaking(lead)) return false;
  // Referral / outbound / event sources have their own tabs — never Website.
  if (
    lead.source === 'investor_leads' ||
    lead.source === 'alpha_digital_leads' ||
    lead.source === 'webinar_registrations'
  ) {
    return false;
  }
  // ghl_submissions and the legacy `leads` table are our website forms.
  return lead.source === 'ghl_submissions' || lead.source === 'leads';
}


/** True when the lead is a referral / investor-network lead. */
export function isReferral(lead: UnifiedLead): boolean {
  if (lead.source === 'investor_leads') return true;
  if (lead.source === 'alpha_digital_leads' && lead.referrer) return true;
  return false;
}

/**
 * True when the lead STARTED a booking but never confirmed — i.e. a
 * ghl_submissions row in `booking_shown` (or whose ghl_response marks the
 * booking flow as reached) with NO confirmed appointment and not already
 * confirmed / cancelled / archived. View-only "Incomplete" segment.
 */
export function isIncomplete(lead: UnifiedLead): boolean {
  // A confirmed appointment is never "incomplete".
  if (isBooked(lead)) return false;
  if (lead.source !== 'ghl_submissions') return false;
  // Only exclude when the person is a real GHL contact on their CURRENT
  // (latest) booking attempt. Cross-source merges may pick an older attempt
  // as primary and inherit a stale contact id from it — that must not hide
  // a fresh booking_shown attempt whose own row never made it into GHL.
  const bookingShown = [lead, ...(lead._merged ?? [])].filter(
    (r) =>
      r.source === 'ghl_submissions' &&
      (r.status ?? '').toLowerCase() === 'booking_shown',
  );
  const latestBookingShown = bookingShown.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0];
  if (latestBookingShown) {
    if (latestBookingShown.ghl_contact_id) return false;
  } else if (lead.ghl_contact_id) {
    return false;
  }


  const status = (lead.status ?? '').toLowerCase();
  if ([...BOOKED_STATUSES, 'cancelled', 'archived'].includes(status)) return false;
  const raw = (lead.raw ?? {}) as Record<string, unknown>;
  const resp = (raw.ghl_response ?? {}) as Record<string, unknown>;
  const startedBooking =
    isBenignBookingSkip({ ghl_status: lead.status, ghl_response: resp }) ||
    resp.booking_completed_in_frame != null;
  return startedBooking;
}

/** Awaiting or failed GHL sync — the "Sync" health view. Non-GHL sources are never included. */
export function needsSyncAttention(lead: UnifiedLead): boolean {
  if (!isGHLSource(lead)) return false;
  const status = getGHLSyncStatus(lead.raw as Record<string, unknown>);
  return status.icon === 'awaiting' || status.icon === 'error' || status.icon === 'pending';
}

/** The primary source badge for a row. Booked wins, then Meta, Referral, Website. */
export function sourceBadge(lead: UnifiedLead): SourceBadge {
  if (isBooked(lead)) return 'Booked';
  if (isMeta(lead)) return 'Meta';
  if (isReferral(lead)) return 'Referral';
  return 'Website';
}

/** Which segment "context" a lead belongs to (used by the detail page). */
export function leadContext(lead: UnifiedLead): 'booked' | 'meta' | 'demo' | 'website' | 'referral' {
  if (isBooked(lead)) return 'booked';
  if (isMeta(lead)) return 'meta';
  if (isDemo(lead)) return 'demo';
  if (isReferral(lead)) return 'referral';
  return 'website';
}

/** Does this lead belong to the given segment tab? */
export function inSegment(lead: UnifiedLead, segment: LeadSegment): boolean {
  switch (segment) {
    case 'all':
      return true;
    case 'booked':
      return isBooked(lead);
    case 'incomplete':
      return isIncomplete(lead);
    case 'meta':
      return isMeta(lead);
    case 'demo':
      return isDemo(lead);
    case 'website':
      return isWebsite(lead) && !isBooked(lead);
    case 'matchmaking':
      return isB2bMatchmaking(lead);

    case 'sync':
      return needsSyncAttention(lead);
    case 'investors':
      return lead.source === 'investor_leads';
    case 'alpha':
      return lead.source === 'alpha_digital_leads';
    case 'webinar':
      return lead.source === 'webinar_registrations';
    default:
      return true;
  }
}

// ---- Junk / invalid-number ad-lead detection -------------------------------

/** Digits only. */
const digitsOnly = (v: string) => v.replace(/[^\d]/g, '');

/**
 * A "junk number" per the Meta spam rule:
 *  - digits-only length < 10, OR
 *  - AU-formatted number whose local part (after an optional 61 country code)
 *    starts with 0 or 1 (never a valid AU mobile/landline leading digit here).
 */
export function isJunkNumber(value?: string | null): boolean {
  if (!value) return false;
  const digits = digitsOnly(value);
  if (digits.length === 0) return false;
  if (digits.length < 10) return true;
  let local = digits;
  if (local.startsWith('61')) local = local.slice(2);
  if (local[0] === '0' || local[0] === '1') return true;
  return false;
}

/**
 * A junk Meta ad lead: the name is really a number, or the phone is a junk
 * number. Only meaningful for Meta-sourced leads (called from the Meta tab).
 */
export function isJunkMetaLead(lead: UnifiedLead): boolean {
  const nameLooksNumeric = /^[\d\s()+-]+$/.test((lead.name ?? '').trim()) && !!lead.name?.trim();
  if (nameLooksNumeric && isJunkNumber(lead.name)) return true;
  if (isJunkNumber(lead.phone)) return true;
  return false;
}

/** True when a lead has a real, usable email address. */
function hasUsableEmail(lead: UnifiedLead): boolean {
  const email = (lead.email ?? '').trim();
  return !!email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

/**
 * CONSERVATIVE, system-wide junk detection (safe to run on every tab).
 * A lead with a real email is NEVER hidden. Otherwise treat as junk when:
 *  (a) the name is essentially just a phone number AND that number is junk, OR
 *  (b) there is no usable email AND the phone is a junk number.
 */
export function isJunkLead(lead: UnifiedLead): boolean {
  // Never hide a lead we can actually email.
  if (hasUsableEmail(lead)) return false;
  const name = (lead.name ?? '').trim();
  const nameLooksNumeric = !!name && /^[\d\s()+-]+$/.test(name);
  if (nameLooksNumeric && isJunkNumber(name)) return true;
  if (isJunkNumber(lead.phone)) return true;
  return false;
}

/**
 * True when the lead reached a genuinely confirmed appointment state — a
 * confirmed/rescheduled status, or an attached appointment id. Used by the
 * read-only funnel metrics. (Reuses isBooked's appointment/booking signals.)
 */
export function isConfirmed(lead: UnifiedLead): boolean {
  const status = (lead.status ?? '').toLowerCase();
  // completed and no_show both REACHED confirmation — one was attended, one
  // was not. Excluding them made the funnel narrow as meetings went ahead.
  if (BOOKED_STATUSES.includes(status)) return true;
  if (lead.appointment_id) return true;
  if ((lead._merged ?? []).some((m) => {
    const s = (m.status ?? '').toLowerCase();
    return BOOKED_STATUSES.includes(s) || !!m.appointment_id;
  })) {
    return true;
  }
  return false;
}
