// Unified lead model — normalises every lead source table into one shape
// so the unified Leads inbox can render them consistently.
import { formatName } from '@/lib/textFormatting';
import { alphaStatusLabel } from '@/lib/alphaDigitalStatus';


/**
 * Display-clean a name: trim, collapse whitespace, and title-case (handling
 * McName / O'Name / hyphens). Used at normalize time so every consumer of a
 * UnifiedLead (inbox row, detail page, dialogs) reads the same name.
 */
const displayName = (raw: string | null | undefined): string => {
  const clean = formatName(raw ?? '');
  return clean || 'Unknown';
};

export type LeadSource =
  | 'ghl_submissions'
  | 'meta_leads'
  | 'investor_leads'
  | 'alpha_digital_leads'
  | 'leads'
  | 'webinar_registrations';

export interface UnifiedLead {
  id: string;
  source: LeadSource;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string | null;
  created_at: string;
  source_url: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  ghl_contact_id: string | null;
  appointment_id: string | null;
  /**
   * Raw source_campaign / source_page for the `leads` table, exposed as
   * first-class fields so segment classifiers (e.g. B2B Matchmaking) can
   * match on them without every consumer having to reach into `raw`.
   * Null for sources that don't carry these columns.
   */
  source_campaign?: string | null;
  source_page?: string | null;
  raw: Record<string, unknown>;

  // Persistent merges (from the lead_merges table). Present on a primary record;
  // each entry carries the merge row id + reason so it can be explained / undone.
  _merged?: UnifiedLead[];
  _mergeId?: string | null;
  _matchedOn?: string | null;
  _matchReason?: string | null;
  // Overlay CRM data (from lead_annotations / lead_notes side tables), attached
  // by source+id (including merged sub-records). See useUnifiedLeads.
  annotation?: LeadAnnotation | null;
  notes?: LeadNote[];
  notesCount?: number;
}

/** One-per-lead overlay: owner, pipeline stage, won/lost outcome. */
export interface LeadAnnotation {
  id: string;
  lead_source: string;
  lead_id: string;
  owner_id: string | null;
  /** Where the owner came from: 'ghl' can be refreshed by sync, 'manual' never is. */
  owner_source?: 'ghl' | 'manual' | null;

  stage: string | null;
  outcome: 'won' | 'lost' | null;
  updated_by: string | null;
  updated_at: string;
}

/** Many-per-lead overlay note. */
export interface LeadNote {
  id: string;
  lead_source: string;
  lead_id: string;
  body: string;
  author_id: string | null;
  created_at: string;
}

/** Stable cross-source key for a lead ("source:id"). */
export const leadKey = (source: string, id: string) => `${source}:${id}`;

export const LEAD_SOURCE_META: Record<LeadSource, { label: string; legacyPath: string }> = {
  ghl_submissions: { label: 'Website / Booking', legacyPath: '/admin/ghl-submissions' },
  meta_leads: { label: 'Meta Lead Ads', legacyPath: '/admin/meta-leads' },
  investor_leads: { label: 'Investors', legacyPath: '/admin/investor-leads' },
  alpha_digital_leads: { label: 'Alpha Digital', legacyPath: '/admin/alpha-digital-leads' },
  leads: { label: 'Site Leads', legacyPath: '/admin/leads' },
  webinar_registrations: { label: 'Webinar / Events', legacyPath: '/admin/webinar-leads' },
};

/**
 * SINGLE SOURCE OF TRUTH for the human-readable status label shown for a lead,
 * so the Inbox row, the Inbox record page and the legacy admin panel all render
 * the IDENTICAL text for the same record.
 *
 * Only sources with a real status column produce a label; sources whose status
 * was previously a mislabelled non-status field (leads/webinar/demo) are null.
 * The raw `lead.status` value is left untouched for the segment classifiers
 * (isBooked/isIncomplete rely on ghl_submissions.ghl_status).
 */
const INVESTOR_STATUS_LABELS: Record<string, string> = {
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export function leadStatusLabel(lead: Pick<UnifiedLead, 'source' | 'status'>): string | null {
  const status = lead.status;
  if (!status) return null;
  if (lead.source === 'investor_leads') {
    return humanizeStatusCode(INVESTOR_STATUS_LABELS[status] ?? status);
  }
  // ghl_submissions carries machine status codes (booking_shown, confirmed…) —
  // humanize so the row AND the detail view show a friendly label.
  if (lead.source === 'ghl_submissions') {
    return humanizeStatusCode(status);
  }
  // meta_leads carries the real status column verbatim (e.g. "new") — title-case it.
  if (lead.source === 'meta_leads') {
    return humanizeStatusCode(status);
  }
  // alpha_digital_leads stores MultiLead's numeric leadStatusId as a string
  // ("1".."6"). Translate then title-case for consistency.
  if (lead.source === 'alpha_digital_leads') {
    return humanizeStatusCode(alphaStatusLabel(status));
  }
  // Any other source (incl. `leads`) — title-case the raw stored value so a
  // record whose status is "new" reads "New" everywhere.
  return humanizeStatusCode(status);
}


/**
 * Human-readable labels for raw status / tag codes, so the inbox and detail
 * views never show machine codes like `booking_shown` or `calendar_widget`.
 */
const STATUS_CODE_LABELS: Record<string, string> = {
  booking_shown: 'Booking Shown',
  confirmed: 'Confirmed',
  rescheduled: 'Rescheduled',
  cancelled: 'Cancelled',
  canceled: 'Cancelled',
  calendar_widget: 'Calendar Widget',
  ghl_direct_booking: 'Direct Booking',
  synced: 'Synced',
  pending: 'Pending',
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  archived: 'Archived',
  deleted_from_ghl: 'Deleted from GHL',
  paid_social: 'Paid Social',
};

/** Turn any raw status/tag code into a friendly Title Case label. */
export function humanizeStatusCode(code?: string | null): string | null {
  if (!code) return null;
  const key = code.trim().toLowerCase();
  if (!key) return null;
  if (STATUS_CODE_LABELS[key]) return STATUS_CODE_LABELS[key];
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Human-readable demo title from a demo_id slug (e.g. "vendor-compliance" → "Vendor Compliance"). */
export function humanizeDemoTitle(demoId?: string | null): string | null {
  if (!demoId) return null;
  const cleaned = demoId.trim();
  if (!cleaned) return null;
  return cleaned
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const joinName = (...parts: (string | null | undefined)[]) =>
  parts.filter(Boolean).join(' ').trim();

const asObj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' ? (v as Record<string, unknown>) : {};

const str = (v: unknown): string | null =>
  v === null || v === undefined || v === '' ? null : String(v);

// ---- Per-source normalisers ----

export function normalizeGhlSubmission(row: Record<string, any>): UnifiedLead {
  const resp = asObj(row.ghl_response);
  return {
    id: row.id,
    source: 'ghl_submissions',
    name: displayName(
      joinName(row.lead_first_name, row.lead_last_name) ||
        str(row.lead_name) ||
        ''
    ),
    email: str(row.lead_email),
    phone: str(row.lead_phone),
    company: str(row.lead_company),
    status: str(row.ghl_status),
    created_at: row.created_at,
    source_url: str(resp.source_url) ?? str(row.source_page),
    referrer: str(resp.referrer),
    utm_source: str(resp.utm_source),
    utm_medium: str(row.source_medium),
    utm_campaign: str(row.source_campaign),
    ghl_contact_id: str(resp.ghl_contact_id),
    appointment_id: str(resp.appointment_id),
    raw: row,
  };
}

export function normalizeMetaLead(row: Record<string, any>): UnifiedLead {
  return {
    id: row.id,
    source: 'meta_leads',
    name: displayName(str(row.full_name)),
    email: str(row.email),
    phone: str(row.phone),
    company: str(row.client),
    status: str(row.status),
    created_at: row.created_at,
    source_url: null,
    referrer: str(row.form_name),
    utm_source: str(row.utm_source) ?? 'meta',
    utm_medium: str(row.utm_medium) ?? 'paid_social',
    utm_campaign: str(row.utm_campaign) ?? str(row.campaign_id),
    // Meta leads imported from GoHighLevel carry a real contact id, which makes
    // them GHL-backed (View in GHL + Notes sync work just like website leads).
    ghl_contact_id: str(row.ghl_contact_id),
    appointment_id: null,
    raw: row,
  };
}

export function normalizeInvestorLead(row: Record<string, any>): UnifiedLead {
  return {
    id: row.id,
    source: 'investor_leads',
    name: displayName(str(row.full_name)),
    email: str(row.email),
    phone: str(row.phone_number),
    company: str(row.firm_name),
    status: str(row.status),
    created_at: row.created_at,
    source_url: null,
    referrer: str(row.how_heard_about),
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    ghl_contact_id: null,
    appointment_id: null,
    raw: row,
  };
}

export function normalizeAlphaDigitalLead(row: Record<string, any>): UnifiedLead {
  // Alpha Digital / MultiLead is a LinkedIn outbound tool: email/phone are
  // usually absent but a LinkedIn profile IS present — all 3,055 active rows
  // have a linkedinUrl, while 2,424 of them (79%) have no email anywhere. So
  // LinkedIn is the real contact channel for this source, not a nice-to-have.
  // The raw_data email fallback below is kept as a safety net, but measured
  // against live data it currently never fires: every row carrying a
  // businessEmail/personalEmail also has the `email` column set.
  const raw = asObj(row.raw_data);
  const linkedinUrl =
    str(raw.linkedinUrl) ?? str(raw.linkedin_url) ?? str(raw.profileUrl);
  const email =
    str(row.email) ?? str(raw.businessEmail) ?? str(raw.personalEmail);
  const company = str(row.company) ?? str(raw.company) ?? str(raw.currentCompany);
  const campaign =
    str(asObj(raw.campaign).name) ??
    str(asObj(raw.campaign).title) ??
    (asObj(raw.campaign).id ? `Campaign ${asObj(raw.campaign).id}` : null);
  return {
    id: row.id,
    source: 'alpha_digital_leads',
    name: displayName(str(row.name)),
    email,
    phone: str(row.phone),
    company,
    status: str(row.status),
    created_at: row.created_at,
    // Expose the LinkedIn profile URL on the unified model so the inbox row
    // and detail view render "View on LinkedIn" identically to the admin page.
    source_url: linkedinUrl,
    referrer: str(row.source),
    utm_source: str(row.source),
    utm_medium: null,
    utm_campaign: campaign,
    ghl_contact_id: str(row.ghl_contact_id),
    appointment_id: null,
    raw: row,
  };
}



export function normalizeLead(row: Record<string, any>): UnifiedLead {
  const resp = asObj(row.ghl_response);
  return {
    id: row.id,
    source: 'leads',
    name: displayName(joinName(row.first_name, row.last_name)),
    email: str(row.email),
    phone: str(row.phone),
    company: str(row.company),
    // The `leads` table has no user-facing status concept (lead_type is a
    // category, not a state) — leave null rather than mislabel the badge.
    status: null,
    created_at: row.created_at,
    source_url: str(row.source_page),
    referrer: str(resp.referrer),
    utm_source: str(row.lead_source),
    utm_medium: str(row.source_medium),
    utm_campaign: str(row.source_campaign),
    ghl_contact_id: str(resp.ghl_contact_id),
    appointment_id: null,
    source_campaign: str(row.source_campaign),
    source_page: str(row.source_page),
    raw: row,
  };
}


export function normalizeWebinarRegistration(row: Record<string, any>): UnifiedLead {
  return {
    id: row.id,
    source: 'webinar_registrations',
    name: displayName(joinName(row.first_name, row.last_name)),
    email: str(row.email),
    phone: str(row.phone),
    company: str(row.company),
    // Webinar registrations have no status concept (webinar_slug is which event,
    // not a state) — the legacy panel shows no status badge, so leave null.
    status: null,
    created_at: row.created_at,
    source_url: null,
    referrer: null,
    utm_source: str(row.utm_source),
    utm_medium: str(row.utm_medium),
    utm_campaign: str(row.utm_campaign),
    ghl_contact_id: null,
    appointment_id: null,
    raw: row,
  };
}

/**
 * Demo-share helpers — shared with DemoLeadsAdmin so the inbox shows the SAME
 * demo title/id for a demo_share ghl_submissions lead.
 *
 * extractDemoName: "/resources/demos/consultant-decision-support" →
 *   "Consultant Decision Support" (falls back to the raw source_page).
 * extractDemoId:   "demo_consultant-decision-support" →
 *   "consultant-decision-support".
 */
export function extractDemoName(sourcePage?: string | null): string | null {
  if (!sourcePage) return null;
  const match = sourcePage.match(/\/resources\/demos\/(.+)/);
  if (match) {
    return match[1]
      .split('-')
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(' ');
  }
  return sourcePage;
}

export function extractDemoId(sourceCampaign?: string | null): string | null {
  if (!sourceCampaign) return null;
  const match = sourceCampaign.match(/^demo_(.+)$/);
  return match ? match[1] : sourceCampaign;
}

