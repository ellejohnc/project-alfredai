// Maps raw Alpha Digital / MultiLead status codes to human-readable stages.
// The source `leadStatusId` is stored as a text integer on alpha_digital_leads.status.

export interface AlphaStatusMeta {
  /** Human-readable stage label. */
  label: string;
  /** StatusBadge colour key (see components/admin/StatusBadge). */
  badge: string;
}

// MultiLead lead status ids observed in the data set.
const STATUS_MAP: Record<string, AlphaStatusMeta> = {
  '1': { label: 'New', badge: 'new' },
  '2': { label: 'Contacted', badge: 'contacted' },
  '3': { label: 'Replied', badge: 'qualified' },
  '4': { label: 'Interested', badge: 'converted' },
  '5': { label: 'Not interested', badge: 'lost' },
  '6': { label: 'Meeting booked', badge: 'converted' },
};

const UNKNOWN: AlphaStatusMeta = { label: 'Unknown', badge: 'inactive' };

/** Resolve a raw status code to its label + badge key. */
export function alphaStatusMeta(status: string | null | undefined): AlphaStatusMeta {
  if (status === null || status === undefined || String(status).trim() === '') {
    return UNKNOWN;
  }
  const key = String(status).trim();
  return STATUS_MAP[key] ?? { label: `Status ${key}`, badge: 'info' };
}

/** Just the human-readable label for a raw status code. */
export function alphaStatusLabel(status: string | null | undefined): string {
  return alphaStatusMeta(status).label;
}

/** A friendly campaign/source label for a raw source string. */
export function alphaSourceLabel(source: string | null | undefined): string {
  if (!source) return 'Unknown source';
  const m = source.match(/^campaign:(\d+)$/);
  if (m) return `Campaign ${m[1]}`;
  if (source.startsWith('http')) return source;
  return source;
}

/**
 * Extract the useful LinkedIn-outreach fields from an alpha_digital_leads
 * raw_data blob. These prospects rarely have email/phone but always have a
 * LinkedIn profile — surface that as the primary contact channel.
 */
export interface AlphaRawInfo {
  linkedinUrl: string | null;
  jobTitle: string | null;
  company: string | null;
  campaign: string | null;
  connectionDegree: string | null;
  currentStep: string | null;
  nextStep: string | null;
  businessEmail: string | null;
  personalEmail: string | null;
}

const val = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

export function extractAlphaRawInfo(raw: unknown): AlphaRawInfo {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;
  const campaign =
    val(r.campaign?.name) ??
    val(r.campaign?.title) ??
    (r.campaign?.id ? `Campaign ${r.campaign.id}` : null);
  return {
    linkedinUrl: val(r.linkedinUrl) ?? val(r.linkedin_url) ?? val(r.profileUrl),
    jobTitle: val(r.headline) ?? val(r.occupation) ?? val(r.jobTitle) ?? val(r.title),
    company: val(r.company) ?? val(r.currentCompany) ?? val(r.companyName),
    campaign,
    connectionDegree: val(r.connectionDegree) ?? val(r.degree),
    currentStep: val(r.currentStep) ?? val(r.step),
    nextStep: val(r.nextStep),
    businessEmail: val(r.businessEmail),
    personalEmail: val(r.personalEmail),
  };
}

/** Humanised step label, e.g. "Step 3" or the raw string if non-numeric. */
export function alphaStepLabel(step: string | null | undefined): string | null {
  if (!step) return null;
  const s = String(step).trim();
  if (!s) return null;
  return /^\d+$/.test(s) ? `Step ${s}` : s;
}
