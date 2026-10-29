/**
 * Shared "source hero" builder.
 *
 * ONE definition of "what this lead actually is", used by both the record page's
 * source-hero card and the quick-view peek's Highlights block so the two can
 * never drift. Data only (label / value / href) — each surface renders it in its
 * own shape, and each may append its own extra JSX (enquiry text, investor
 * actions) below the rows.
 *
 * Rows whose value is empty or a junk placeholder ("unknown", "none", "-", "n/a")
 * are dropped silently: a peek that says "Campaign: unknown" is worse than one
 * that says nothing.
 */
import { format } from 'date-fns';
import { Calendar, Film, Globe, Handshake, Info, Linkedin, Megaphone, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  UnifiedLead,
  LEAD_SOURCE_META,
  leadStatusLabel,
  humanizeStatusCode,
  humanizeDemoTitle,
  extractDemoName,
  extractDemoId,
} from '@/lib/unifiedLead';
import { extractAlphaRawInfo, alphaStepLabel } from '@/lib/alphaDigitalStatus';
import { isBooked, isMeta, isDemo, isB2bMatchmaking } from '@/lib/leadSegments';
import { normalizeMultilineText } from '@/lib/normalizeMultilineText';

export interface HeroRow {
  label: string;
  value: string | null;
  href?: string | null;
}

export interface LeadHero {
  title: string | null;
  icon: LucideIcon;
  rows: HeroRow[];
}

const asObj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' ? (v as Record<string, unknown>) : {};

const JUNK = new Set(['unknown', 'none', '-', '–', '—', 'n/a', 'na', 'null', 'undefined', '']);

/** Is this value worth rendering at all? */
export function isMeaningfulValue(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  return !JUNK.has(String(v).trim().toLowerCase());
}

/** First meaningful value across a list of candidates. */
export const firstMeaningful = (...vals: any[]): string | null => {
  for (const v of vals) if (isMeaningfulValue(v)) return String(v);
  return null;
};

export const safeUrl = (url?: string | null): string | null => {
  if (!isMeaningfulValue(url)) return null;
  try {
    const parsed = new URL(String(url).trim(), window.location.origin);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    return null;
  }
};

/** Display form of a URL: path only, so a long preview origin can't take over. */
export function urlPathLabel(url?: string | null): string | null {
  if (!isMeaningfulValue(url)) return null;
  const raw = String(url).trim();
  try {
    const parsed = new URL(raw, window.location.origin);
    const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return path && path !== '/' ? path : parsed.hostname;
  } catch {
    return raw;
  }
}

const fmtDate = (v: any, pattern: string): string | null => {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return format(d, pattern);
};

/** The booking's "when", with timezone, as shown on both surfaces. */
export function bookingWhen(lead: UnifiedLead): string | null {
  const raw = asObj(lead.raw);
  const resp = asObj(raw.ghl_response);
  const startTime = firstMeaningful(
    resp.start_time,
    raw.appointment_start_time,
    resp.appointment_start_time,
    resp.appointment_time,
    raw.appointment_time,
  );
  const timezone = firstMeaningful(resp.timezone, raw.timezone, raw.appointment_timezone, resp.tz);
  const when = fmtDate(startTime, 'EEEE d MMM yyyy, h:mma');
  if (!when) return null;
  return `${when}${timezone ? ` (${timezone})` : ''}`;
}

export function calendarNameOf(lead: UnifiedLead): string | null {
  const raw = asObj(lead.raw);
  const resp = asObj(raw.ghl_response);
  return firstMeaningful(resp.calendar_name, raw.calendar_name, resp.calendar_id);
}

/**
 * The context sub-line under the lead's name: what this lead is, and where it
 * came from — e.g. "Booked · Will's Proposal Calendar". Falls back to the
 * capture date only when there is nothing better to say.
 */
export function leadContextLine(lead: UnifiedLead): string | null {
  const raw = asObj(lead.raw);
  const label = LEAD_SOURCE_META[lead.source]?.label ?? null;
  let detail: string | null = null;

  if (isBooked(lead) || lead.source === 'ghl_submissions') {
    detail = calendarNameOf(lead);
  }
  if (!detail && (isMeta(lead) || lead.source === 'meta_leads')) {
    detail = firstMeaningful(raw.form_name, raw.campaign_name, lead.utm_campaign);
  }
  if (!detail && lead.source === 'webinar_registrations') {
    detail = firstMeaningful(raw.webinar_slug);
  }
  if (!detail && isDemo(lead)) {
    detail = firstMeaningful(
      extractDemoName((raw.source_page as string | null) ?? lead.source_url),
      humanizeDemoTitle(extractDemoId(raw.source_campaign as string | null)),
    );
  }
  if (!detail && lead.source === 'alpha_digital_leads') {
    detail = firstMeaningful(extractAlphaRawInfo(raw.raw_data).campaign);
  }
  if (!detail && lead.source === 'leads') {
    detail = firstMeaningful(
      humanizeStatusCode(firstMeaningful(raw.lead_type) ?? undefined),
      urlPathLabel(lead.source_url),
    );
  }
  if (!detail && lead.source === 'investor_leads') {
    detail = firstMeaningful(raw.firm_name, lead.company);
  }

  const parts = [label, detail].filter(Boolean) as string[];
  if (parts.length > 0) return parts.join(' · ');
  return fmtDate(lead.created_at, 'd MMM yyyy, h:mma');
}

/**
 * Build the hero for a lead. `alphaRaw` lets the record page pass the full
 * (lazily fetched) Alpha Digital blob; the peek just uses what it has.
 */
export function buildLeadHero(
  lead: UnifiedLead,
  opts?: { alphaRaw?: unknown },
): LeadHero {
  const raw = asObj(lead.raw);
  const resp = asObj(raw.ghl_response);
  const rows: HeroRow[] = [];
  let title: string | null = null;
  let icon: LucideIcon = Info;

  const pipelineStage = humanizeStatusCode(
    firstMeaningful(resp.pipeline_stage, resp.stage, raw.pipeline_stage, lead.status) ?? undefined,
  );
  const appointmentId = firstMeaningful(lead.appointment_id, resp.appointment_id, raw.appointment_id);
  const startTime = firstMeaningful(
    resp.start_time,
    raw.appointment_start_time,
    resp.appointment_start_time,
    resp.appointment_time,
    raw.appointment_time,
  );
  const meetLink = safeUrl(
    firstMeaningful(raw.meet_link, resp.meet_link, resp.meeting_url, resp.meeting_link, raw.meeting_url, resp.join_url, resp.zoom_url),
  );
  const when = bookingWhen(lead);
  const hasBooking = isBooked(lead) || !!startTime || !!meetLink || !!appointmentId;

  const campaign = firstMeaningful(raw.campaign_name, lead.utm_campaign, raw.campaign_id);
  const adSet = firstMeaningful(raw.adset_name, raw.adset_id);
  const ad = firstMeaningful(raw.ad_name, raw.ad_id);

  if (isBooked(lead) || (lead.source === 'ghl_submissions' && hasBooking)) {
    title = 'The meeting';
    icon = Calendar;
    const startDate = startTime ? new Date(startTime) : null;
    const tense =
      startDate && !isNaN(startDate.getTime())
        ? startDate.getTime() < Date.now()
          ? ' — past'
          : ' — upcoming'
        : '';
    rows.push(
      { label: 'When', value: when ? `${when}${tense}` : null },
      { label: 'Join link', value: meetLink ? 'Join meeting' : null, href: meetLink },
      { label: 'Calendar', value: calendarNameOf(lead) },
      { label: 'Company', value: firstMeaningful(lead.company) },
      {
        label: 'Confirmation',
        value: appointmentId
          ? `Confirmed — appointment on file${pipelineStage ? ` (${pipelineStage})` : ''}`
          : startTime
            ? 'Awaiting confirmation — no appointment id yet'
            : leadStatusLabel(lead),
      },
      { label: 'Appointment ID', value: appointmentId },
    );
  } else if (isMeta(lead) || lead.source === 'meta_leads') {
    title = 'Attribution';
    icon = Megaphone;
    const alertFailed = firstMeaningful(raw.notification_status) === 'failed';
    rows.push(
      { label: 'Form', value: firstMeaningful(raw.form_name) },
      { label: 'Campaign', value: campaign },
      { label: 'Ad set', value: adSet },
      { label: 'Ad', value: ad },
      { label: 'UTM source', value: lead.utm_source },
      { label: 'UTM medium', value: lead.utm_medium },
      { label: 'UTM campaign', value: lead.utm_campaign },
      {
        label: 'Alert email',
        value: alertFailed
          ? `Failed${firstMeaningful(raw.notification_error) ? ` — ${firstMeaningful(raw.notification_error)}` : ''}`
          : humanizeStatusCode(firstMeaningful(raw.notification_status) ?? undefined),
      },
    );
  } else if (isB2bMatchmaking(lead)) {
    title = 'The match';
    icon = Handshake;
    rows.push(
      { label: 'Them', value: firstMeaningful(raw.company, lead.company) },
      { label: 'Their role', value: firstMeaningful(raw.job_title) },
      { label: 'Matched with', value: firstMeaningful(resp.matched_with, resp.external_source, raw.lead_source) },
      {
        label: 'Intro status',
        value: humanizeStatusCode(
          firstMeaningful(resp.requested_call ? 'Call requested' : null, resp.status, resp.stage, pipelineStage) ??
            undefined,
        ),
      },
      { label: 'Timeline', value: firstMeaningful(resp.timeline) },
      { label: 'Received', value: firstMeaningful(resp.received_at) },
    );
  } else if (isDemo(lead)) {
    title = 'The demo';
    icon = Film;
    const demoId = firstMeaningful(
      extractDemoId(raw.source_campaign as string | null),
      raw.demo_id,
      raw.demo_slug,
      lead.utm_campaign,
    );
    rows.push(
      {
        label: 'Demo',
        value: firstMeaningful(
          extractDemoName((raw.source_page as string | null) ?? lead.source_url),
          humanizeDemoTitle(demoId),
        ),
      },
      { label: 'Demo ID', value: demoId },
      { label: 'Requested', value: fmtDate(lead.created_at, 'd MMM yyyy, h:mma') },
      { label: 'Meeting time', value: when },
      { label: 'Booking status', value: firstMeaningful(leadStatusLabel(lead), pipelineStage) },
    );
  } else if (lead.source === 'webinar_registrations') {
    title = 'The registration';
    icon = Calendar;
    rows.push(
      { label: 'Webinar', value: firstMeaningful(raw.webinar_slug) },
      { label: 'Registered', value: fmtDate(lead.created_at, 'd MMM yyyy, h:mma') },
      { label: 'Attended', value: firstMeaningful(raw.attended === true ? 'Yes' : raw.attended === false ? 'No' : null, raw.attendance_status) },
      { label: 'AI interest', value: firstMeaningful(raw.ai_interest) },
      { label: 'Repetitive workflow', value: normalizeMultilineText(firstMeaningful(raw.repetitive_workflow) ?? '') || null },
    );
  } else if (lead.source === 'leads') {
    title = 'The form';
    icon = Globe;
    const utmPath = [lead.utm_source, lead.utm_medium, lead.utm_campaign]
      .filter((v) => isMeaningfulValue(v))
      .join(' › ');
    const page = firstMeaningful(lead.source_page, lead.source_url);
    rows.push(
      { label: 'Form type', value: humanizeStatusCode(firstMeaningful(raw.lead_type) ?? undefined) },
      { label: 'Page they were on', value: urlPathLabel(page), href: safeUrl(page) },
      { label: 'UTM path', value: utmPath || null },
      { label: 'Referrer', value: lead.referrer },
    );
  } else if (lead.source === 'investor_leads') {
    title = 'The decision';
    icon = User;
    rows.push(
      { label: 'Firm', value: firstMeaningful(raw.firm_name, lead.company) },
      { label: 'Role', value: firstMeaningful(raw.role) },
      { label: 'Typical check size', value: firstMeaningful(raw.typical_check_size) },
      { label: 'Investment focus', value: firstMeaningful(raw.investment_focus) },
      { label: 'Why interested', value: firstMeaningful(raw.interest_reason) },
      { label: 'How they heard', value: firstMeaningful(raw.how_heard_about) },
      { label: 'Phone', value: firstMeaningful(raw.phone_number, lead.phone) },
      {
        label: 'LinkedIn',
        value: firstMeaningful(raw.linkedin_url) ? 'View profile' : null,
        href: safeUrl(firstMeaningful(raw.linkedin_url)),
      },
      {
        label: 'Social profile',
        value: firstMeaningful(raw.social_profile_url) ? 'View profile' : null,
        href: safeUrl(firstMeaningful(raw.social_profile_url)),
      },
      { label: 'Verification', value: leadStatusLabel(lead) },
      { label: 'Admin notes', value: firstMeaningful(raw.admin_notes) },
      { label: 'Submitted', value: fmtDate(lead.created_at, 'd MMM yyyy, h:mma') },
    );
  } else if (lead.source === 'alpha_digital_leads') {
    const info = extractAlphaRawInfo(opts?.alphaRaw ?? raw.raw_data);
    const step = alphaStepLabel(info.currentStep);
    const nextStep = alphaStepLabel(info.nextStep);
    title = 'On LinkedIn';
    icon = Linkedin;
    rows.push(
      { label: 'Profile', value: info.linkedinUrl ? 'View profile' : null, href: safeUrl(info.linkedinUrl) },
      { label: 'Connection', value: info.connectionDegree },
      { label: 'Sequence step', value: step },
      { label: 'Next step', value: nextStep && nextStep !== step ? nextStep : null },
      { label: 'Job title', value: info.jobTitle },
      { label: 'Company', value: info.company ?? lead.company },
      { label: 'Campaign', value: info.campaign },
      { label: 'Business email', value: info.businessEmail },
      { label: 'Personal email', value: info.personalEmail },
    );
  }

  return { title, icon, rows: rows.filter((r) => isMeaningfulValue(r.value)) };
}
