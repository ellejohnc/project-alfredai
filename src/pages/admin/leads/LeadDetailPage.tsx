import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  ExternalLink,
  RefreshCw,
  Calendar,
  Megaphone,
  Globe,
  AlertCircle,
  Loader2,
  User,
  CheckCircle2,
  Clock,
  Link2,
  Film,
  Layers,
  Linkedin,
  MoreHorizontal,
  Handshake,
} from 'lucide-react';


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLeadRecord } from '@/hooks/useLeadRecord';
import { usePermissions } from '@/hooks/usePermissions';
import AccessDenied from '@/components/admin/AccessDenied';
import { UnifiedLead, LEAD_SOURCE_META, leadStatusLabel, humanizeDemoTitle, humanizeStatusCode, extractDemoName, extractDemoId } from '@/lib/unifiedLead';
import { extractAlphaRawInfo, alphaStepLabel } from '@/lib/alphaDigitalStatus';
import { bestDistinctPanel } from '@/lib/leadAdminLinks';
import { buildLeadHero } from '@/lib/leadSourceHero';

import { getGHLSyncStatus } from '@/lib/ghlSyncStatus';
import { getGHLContactUrl } from '@/lib/ghlConfig';
import { GHLSyncDot } from '@/components/admin/GHLSyncDot';
import { LeadOwnershipCard, LeadNotesCard } from '@/components/admin/leads/LeadOverlayPanels';
import { LeadConversationTab, LeadOpportunityTab } from '@/components/admin/leads/LeadGhlTabs';
import { useGhlContact } from '@/hooks/useGhlLead';
import { LeadRescheduleDialog } from '@/components/admin/leads/LeadRescheduleDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Trophy, Info } from 'lucide-react';
import { sourceBadge, isBooked, isMeta, isDemo, isGHLSource, isB2bMatchmaking } from '@/lib/leadSegments';
import { CONTACT_INFO } from '@/lib/contactInfo';
import { parseEnquiry, type ParsedEnquiry } from '@/lib/enquiryFormat';
import { normalizeMultilineText } from '@/lib/normalizeMultilineText';
import { useLeadsRealtime } from '@/hooks/useLeadsRealtime';
import { usePrefetchGhlLead } from '@/hooks/useGhlLead';
import { PushToGhlButton } from '@/components/admin/leads/PushToGhlButton';
import { PushAlphaLeadToGhlButton } from '@/components/admin/leads/PushAlphaLeadToGhlButton';
import { PushB2bLeadToGhlButton } from '@/components/admin/leads/PushB2bLeadToGhlButton';
import { ContactDetailsCard } from '@/components/admin/leads/ContactDetailsCard';
import { CompanyDetailsCard } from '@/components/admin/leads/CompanyDetailsCard';
import { InvestorAdminActions } from '@/components/admin/leads/InvestorAdminActions';
import { useUnreadNotes } from '@/hooks/useUnreadNotes';

const asObj = (v: unknown): Record<string, any> =>
  v && typeof v === 'object' ? (v as Record<string, any>) : {};

/**
 * Shared class for every action button in the lead-record header so GHL /
 * Website / Meta / Alpha / investor records all render an identical wrapping
 * button group at both drawer width and full-page width.
 */
const LEAD_ACTION_BTN =
  'h-10 px-3.5 gap-2 whitespace-nowrap justify-center text-sm min-w-[8.5rem]';

const safeSourceUrl = (url?: string | null): string | null => {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    return null;
  }
};

/** First non-empty value across a list of candidates. */
const firstOf = (...vals: any[]): string | null => {
  for (const v of vals) {
    if (v !== null && v !== undefined && String(v).trim() !== '') return String(v);
  }
  return null;
};

/** Format an ISO/date value defensively. */
const fmt = (v: any, pattern: string): string | null => {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return format(d, pattern);
};

interface TimelineEvent {
  label: string;
  at: string;
  icon: typeof Clock;
}

function buildTimeline(lead: UnifiedLead): TimelineEvent[] {
  const raw = asObj(lead.raw);
  const resp = asObj(raw.ghl_response);
  const events: TimelineEvent[] = [];

  events.push({ label: 'Lead captured', at: lead.created_at, icon: User });

  const contactCreatedAt =
    resp.ghl_contact_created_at || resp.contact_created_at || (lead.ghl_contact_id ? lead.created_at : null);
  if (lead.ghl_contact_id || contactCreatedAt) {
    events.push({
      label: 'GHL contact created',
      at: contactCreatedAt || lead.created_at,
      icon: Link2,
    });
  }

  if (raw.ghl_status === 'booking_shown' || resp.booking_shown_at) {
    events.push({
      label: 'Booking shown',
      at: resp.booking_shown_at || raw.updated_at || lead.created_at,
      icon: Calendar,
    });
  }

  const startTime = resp.start_time || raw.appointment_start_time;
  if (startTime || ['confirmed', 'rescheduled'].includes(lead.status ?? '')) {
    events.push({
      label: lead.status === 'rescheduled' ? 'Appointment rescheduled' : 'Appointment confirmed',
      at: resp.confirmed_at || raw.updated_at || startTime || lead.created_at,
      icon: CheckCircle2,
    });
  }

  return events
    .filter((e) => !!e.at)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

function InfoRow({
  label,
  value,
  href,
}: {
  label: string;
  value?: string | null;
  href?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground w-32 shrink-0">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all font-medium text-primary hover:underline inline-flex items-center gap-1"
        >
          {value} <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      ) : (
        <span className="break-all font-medium">{value}</span>
      )}
    </div>
  );
}

/**
 * Renders the "Enquiry / message" field. When the stored value is a JSON object
 * (e.g. ROI/savings-calculator inputs) it's shown as a clean labelled list;
 * otherwise as plain text. Renders nothing when empty.
 */
function EnquiryRow({ label, enquiry }: { label: string; enquiry: ParsedEnquiry }) {
  if (!enquiry) return null;
  if (enquiry.kind === 'text') {
    return <InfoRow label={label} value={enquiry.text} />;
  }
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground w-32 shrink-0">{label}</span>
      <div className="flex-1 space-y-0.5">
        {enquiry.fields.map((f) => (
          <div key={f.label} className="flex flex-wrap gap-x-2">
            <span className="text-muted-foreground">{f.label}:</span>
            <span className="break-all font-medium">{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Label for the "Back" button, keyed by list path. */
const BACK_LABELS: Record<string, string> = {
  '/admin/leads': 'Back to Leads',
  '/admin/leads-booked': 'Back to Booked Leads',
  '/admin/investor-leads': 'Back to Investor Leads',
  '/admin/demo-leads': 'Back to Demo Leads',
  '/admin/webinar-leads': 'Back to Webinar Leads',
  '/admin/alpha-digital-leads': 'Back to Alpha Digital Leads',
  '/admin/meta-leads': 'Back to Meta Leads',
  '/admin/b2b-matchmaking-leads': 'Back to B2B Matchmaking Leads',
  '/admin/archived-leads': 'Back to Archived Leads',
};

export default function LeadDetailPage() {
  useLeadsRealtime();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  // Back goes to the list you actually came from: /admin/leads-booked/{id} →
  // /admin/leads-booked. Falls back to the Inbox for the /admin/leads/{id} route.
  const backToLeads = (() => {
    const seg = searchParams.get('segment');
    const base = location.pathname.replace(/\/[^/]+$/, '');
    const listPath = base === '/admin' ? '/admin/leads' : base;
    return seg ? `${listPath}?segment=${seg}` : listPath;
  })();
  const backLabel = BACK_LABELS[backToLeads.split('?')[0]] ?? 'Back to Leads';

  const { canViewLeads, isAdmin } = usePermissions();
  const { data: record, isLoading, error, refetch, isRefetching } = useLeadRecord(id);
  const [resyncing, setResyncing] = useState(false);


  // The whole person: the resolved record plus every duplicate collapsed under
  // it. Resolution now happens in the query (one record, targeted lookups)
  // instead of scanning the entire inbox in the browser.
  const records = useMemo<UnifiedLead[]>(
    () => (record ? [record, ...(record._merged ?? [])] : []),
    [record],
  );


  // Combined view: first non-null field across all sub-records; merged raw.
  const lead = useMemo<UnifiedLead | null>(() => {
    if (records.length === 0) return null;
    const booked = records.find((r) => isBooked(r));
    const primary = booked ?? records[0];

    const combinedRaw: Record<string, any> = {};
    const combinedResp: Record<string, any> = {};
    for (const r of records) {
      const rr = asObj(r.raw);
      for (const k of Object.keys(rr)) {
        if (k === 'ghl_response') continue;
        if (combinedRaw[k] === null || combinedRaw[k] === undefined || combinedRaw[k] === '') {
          if (rr[k] !== null && rr[k] !== undefined && rr[k] !== '') combinedRaw[k] = rr[k];
        }
      }
      const resp = asObj(rr.ghl_response);
      for (const k of Object.keys(resp)) {
        if (combinedResp[k] === null || combinedResp[k] === undefined || combinedResp[k] === '') {
          if (resp[k] !== null && resp[k] !== undefined && resp[k] !== '') combinedResp[k] = resp[k];
        }
      }
    }
    combinedRaw.ghl_response = combinedResp;

    return {
      ...primary,
      email: firstOf(...records.map((r) => r.email)),
      phone: firstOf(...records.map((r) => r.phone)),
      company: firstOf(...records.map((r) => r.company)),
      source_url: firstOf(...records.map((r) => r.source_url)),
      referrer: firstOf(...records.map((r) => r.referrer)),
      utm_source: firstOf(...records.map((r) => r.utm_source)),
      utm_medium: firstOf(...records.map((r) => r.utm_medium)),
      utm_campaign: firstOf(...records.map((r) => r.utm_campaign)),
      ghl_contact_id: firstOf(...records.map((r) => r.ghl_contact_id)),
      appointment_id: firstOf(...records.map((r) => r.appointment_id)),
      raw: combinedRaw,
    };
  }, [records]);

  // The unified list deliberately carries only the extracted raw_data keys for
  // Alpha Digital — pulling the whole jsonb for 3,055 rows was ~5.5 MB and made
  // the sort spill to disk. But this page shows ONE lead, so fetch its complete
  // payload here. Without this the record would quietly show a subset and look
  // like data had gone missing.
  const [fullAlphaRaw, setFullAlphaRaw] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    let cancelled = false;
    setFullAlphaRaw(null);
    const alphaId = records.find((r) => r.source === 'alpha_digital_leads')?.id;
    if (!alphaId) return;
    void (async () => {
      const { data, error } = await supabase
        .from('alpha_digital_leads')
        .select('raw_data')
        .eq('id', alphaId)
        .maybeSingle();
      if (!cancelled && !error && data?.raw_data) {
        setFullAlphaRaw(data.raw_data as Record<string, unknown>);
      }
    })();
    return () => { cancelled = true; };
  }, [records]);



  // Prefetch GHL sub-resources as soon as we know a contact id. Must be
  // declared before any early return so hook order stays stable across renders.
  const { prefetch: prefetchGhl } = usePrefetchGhlLead();
  const prefetchContactId = useMemo(() => {
    if (!lead) return null;
    if (!isGHLSource(lead)) return null;
    return (
      lead.ghl_contact_id ||
      records.find((r) => r.ghl_contact_id)?.ghl_contact_id ||
      null
    );
  }, [lead, records]);
  useEffect(() => {
    if (prefetchContactId) prefetchGhl(prefetchContactId);
  }, [prefetchContactId, prefetchGhl]);

  const notesGhlContactId = useMemo(() => {
    if (!lead) return null;
    return lead.ghl_contact_id || records.find((r) => r.ghl_contact_id)?.ghl_contact_id || null;
  }, [lead, records]);
  const { unreadCount: unreadNotes, markSeen: markNotesSeen } = useUnreadNotes(lead, notesGhlContactId);

  // MUST stay above the early returns below. This was being called further
  // down, after the loading and not-found branches — so the first render (still
  // loading) ran one fewer hook than the second, React threw "rendered more
  // hooks than during the previous render", and the boundary showed "We could
  // not open this lead record" on EVERY record opened from the Inbox.
  // notesGhlContactId is the same id the code below derived, so nothing about
  // which contact gets fetched changes.
  const { data: ghlContact } = useGhlContact(notesGhlContactId);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  // Notes are always on screen on the record page, so anything unread is seen
  // as soon as the record opens.
  useEffect(() => {
    if (unreadNotes > 0) markNotesSeen();
  }, [unreadNotes, markNotesSeen]);

  if (!canViewLeads) return <AccessDenied />;

  const mailtoError = `mailto:${CONTACT_INFO.email.support}?subject=${encodeURIComponent(
    'Lead detail error'
  )}&body=${encodeURIComponent(
    `Couldn't open a lead record.\n\nPage: ${
      typeof window !== 'undefined' ? window.location.href : ''
    }\nLead id: ${id}\n\n(Please attach a screenshot.)`
  )}`;

  if (isLoading) {
    // Render the page's own frame (back button + header shell) so navigating
    // from a list never paints a bare full-height block — the chrome stays put
    // and only the content areas are skeletons.
    return (
      <div className="space-y-4">
        <Button variant="ghost" className="min-h-[44px] -ml-2" onClick={() => navigate(backToLeads)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> {backLabel}
        </Button>
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-72" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" className="min-h-[44px]" onClick={() => navigate(backToLeads)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> {backLabel}
        </Button>
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-6 flex flex-col gap-3 items-start">
            <span className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-destructive" />
              {error
                ? "We couldn't load this lead."
                : "This lead could not be found. It may have been merged or removed."}
            </span>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="min-h-[44px]" onClick={() => refetch()}>
                Try again
              </Button>
              <Button asChild variant="outline" size="sm" className="min-h-[44px]">
                <Link to="/admin/leads">Go to Leads inbox</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="min-h-[44px]">
                <a href={mailtoError}>Email us this problem</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const raw = asObj(lead.raw);
  const resp = asObj(raw.ghl_response);
  const badge = sourceBadge(lead);
  const sync = getGHLSyncStatus(raw);
  const timeline = buildTimeline(lead);
  // Only GHL-backed sources (ghl_submissions / leads) show GHL status + actions.
  const showGhl = isGHLSource(lead);
  const isInvestor = lead.source === 'investor_leads';

  // Only show "View in GHL" when a GENUINE contact id exists (no email-search
  // fallback). A GHL-source lead that never synced (e.g. booking_shown) has no
  // contact id, so the button is hidden.
  const ghlContactId = showGhl
    ? lead.ghl_contact_id ||
      records.find((r) => r.ghl_contact_id)?.ghl_contact_id ||
      null
    : null;
  const ghlUrl = ghlContactId ? getGHLContactUrl(ghlContactId) : null;

  // v3 contact carries first/last touch attribution. The fetch itself is a hook
  // and lives above the early returns; this is just the derived value.
  const ghlAttribution =
    ghlContact?.attributionSource || ghlContact?.lastAttributionSource
      ? { first: ghlContact.attributionSource ?? null, last: ghlContact.lastAttributionSource ?? null }
      : null;
  const sourceUrl = safeSourceUrl(lead.source_url);





  const pipelineStage = humanizeStatusCode(
    firstOf(resp.pipeline_stage, resp.stage, raw.pipeline_stage, lead.status)
  );

  // ---- Section data ----
  const startTime = firstOf(resp.start_time, raw.appointment_start_time, resp.appointment_start_time);
  const timezone = firstOf(resp.timezone, raw.timezone, raw.appointment_timezone, resp.tz);
  const meetLink = safeSourceUrl(
    firstOf(raw.meet_link, resp.meet_link, resp.meeting_url, resp.meeting_link, raw.meeting_url)
  );
  const appointmentId = firstOf(lead.appointment_id, resp.appointment_id, raw.appointment_id);
  const calendarName = firstOf(resp.calendar_name, resp.calendar_id, raw.calendar_name);
  const calendarId = firstOf(resp.calendar_id, raw.calendar_id);

  const hasBooking =
    isBooked(lead) || !!startTime || !!meetLink || !!appointmentId;

  const campaign = firstOf(raw.campaign_name, lead.utm_campaign, raw.campaign_id);
  const adSet = firstOf(raw.adset_name, raw.adset_id);
  const ad = firstOf(raw.ad_name, raw.ad_id);
  const adForm = firstOf(raw.form_name, lead.referrer);
  const hasMeta =
    isMeta(lead) || !!campaign || !!adSet || !!ad || !!raw.platform;

  // Demo-share leads are ghl_submissions rows with lead_source = 'demo_share'.
  // Derive the demo title from source_page and the demo id from source_campaign,
  // exactly like the Demo Leads page.
  const demoIdRaw = firstOf(
    extractDemoId(raw.source_campaign as string | null),
    raw.demo_id,
    raw.demo_slug,
    lead.utm_campaign,
  );
  const demoTitle = firstOf(
    extractDemoName((raw.source_page as string | null) ?? lead.source_url),
    humanizeDemoTitle(demoIdRaw),
  );
  const demoId = demoIdRaw;
  // Only show the Demo card for actual demo-share records. `demoId` alone is
  // truthy for any lead with a source_campaign/utm_campaign (e.g. Meta ads),
  // which was surfacing ad campaign names as "Demo" info on non-demo leads.
  const hasDemo = isDemo(lead);


  const enquiry = parseEnquiry(
    raw.message ?? raw.notes ?? raw.lead_message ?? raw.enquiry,
  );
  const challenge = firstOf(raw.challenge, raw.primary_challenge);
  const hasWebsite =
    lead.source !== 'investor_leads' &&
    (!!sourceUrl || !!lead.referrer || !!enquiry || !!challenge || !!lead.source_url);

  const handleResync = async () => {
    if (!isAdmin) return;
    setResyncing(true);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('verify-ghl-sync', {
        body: { submission_ids: [lead.id], source: lead.source },
      });
      if (fnError) throw fnError;
      if (result?.success === false) throw new Error(result.error || 'Re-sync failed');
      toast.success('Re-sync requested — refreshing status');
      await refetch();
    } catch {
      toast.error('Could not re-sync this lead. Please try again or email us.');
    } finally {
      setResyncing(false);
    }
  };

  const bookingDateTime = startTime
    ? `${fmt(startTime, 'EEEE d MMM yyyy, h:mma')}${timezone ? ` (${timezone})` : ''}`
    : null;

  // ---- Source hero -------------------------------------------------------
  // Built by the SHARED helper (src/lib/leadSourceHero.ts) so the record page
  // and the quick-view peek can never drift. Only the extra JSX below the rows
  // (enquiry text / investor actions) stays page-local.
  const hero = buildLeadHero(lead, { alphaRaw: fullAlphaRaw ?? asObj(lead.raw).raw_data });
  const heroRows = hero.rows;
  const heroTitle = hero.title;
  const heroExtra: React.ReactNode =
    lead.source === 'leads' ? (
      <EnquiryRow label="What they typed" enquiry={enquiry} />
    ) : isInvestor ? (
      <InvestorAdminActions lead={lead} />
    ) : null;

  const heroHasContent = heroRows.length > 0 || !!heroExtra;
  const HeroIcon = hero.icon;

  const sourceHero =
    heroTitle && heroHasContent ? (
      <Card className="border-primary/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <HeroIcon className="h-4 w-4 text-primary" /> {heroTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {heroRows.map((r) => (
            <InfoRow key={r.label} label={r.label} value={r.value} href={r.href} />
          ))}
          {heroExtra}
        </CardContent>
      </Card>
    ) : null;

  const detailsSection = (
    <>
      {sourceHero}
      {ghlContactId && <ContactDetailsCard contactId={ghlContactId} />}

      {ghlContactId && (
        <CompanyDetailsCard
          contactId={ghlContactId}
          qualification={{
            industry: firstOf(raw.industry, resp.industry) as string | null,
            companySize: firstOf(raw.company_size, raw.team_size, resp.company_size, resp.team_size) as string | null,
            timeline: firstOf(raw.timeline, resp.timeline) as string | null,
            challenge: firstOf(raw.challenge, resp.challenge) as string | null,
          }}
        />
      )}

      {isB2bMatchmaking(lead) && (() => {
        const mm = resp;
        const website = firstOf(mm.website, raw.website);
        const websiteHref = website
          ? safeSourceUrl(website.startsWith('http') ? website : `https://${website}`)
          : null;
        const mobile = firstOf(mm.mobile, raw.mobile, lead.phone);
        const phoneNum = firstOf(raw.phone, lead.phone);
        const jobTitle = firstOf(raw.job_title);
        const companyName = firstOf(raw.company, lead.company);
        const interests = Array.isArray(mm.interests) ? (mm.interests as unknown[]).map(String) : [];
        const offices = Array.isArray(mm.offices) ? (mm.offices as unknown[]).map(String) : [];
        const timeline = firstOf(mm.timeline);
        const requestedCall = firstOf(mm.requested_call);
        const receivedAt = firstOf(mm.received_at);
        const externalSource = firstOf(mm.external_source, raw.lead_source);
        const messageText = normalizeMultilineText(firstOf(raw.message)) || null;
        return (
          <Card className="border-primary/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Handshake className="h-4 w-4 text-primary" /> B2B Matchmaking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Company" value={companyName} />
              <InfoRow label="Job title" value={jobTitle} />
              <InfoRow label="Website" value={website} href={websiteHref} />
              <InfoRow label="Mobile" value={mobile} href={mobile ? `tel:${mobile}` : null} />
              <InfoRow label="Phone" value={phoneNum} href={phoneNum ? `tel:${phoneNum}` : null} />
              <InfoRow label="Timeline" value={timeline} />
              <InfoRow label="Requested call" value={requestedCall} />
              <InfoRow label="Received at" value={receivedAt} />
              <InfoRow label="External source" value={externalSource} />

              {interests.length > 0 && (
                <div className="flex gap-2 text-sm">
                  <span className="text-muted-foreground w-32 shrink-0">Interests</span>
                  <div className="flex flex-wrap gap-1.5">
                    {interests.map((it, i) => (
                      <Badge key={i} variant="secondary" className="text-[11px] font-normal">
                        {it}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {offices.length > 0 && (
                <div className="flex gap-2 text-sm">
                  <span className="text-muted-foreground w-32 shrink-0">Offices</span>
                  <ul className="flex-1 space-y-1 list-disc pl-4">
                    {offices.map((o, i) => (
                      <li key={i} className="break-words">{o}</li>
                    ))}
                  </ul>
                </div>
              )}

              {messageText && (
                <div className="flex flex-col gap-1.5 text-sm pt-2 border-t border-border/60">
                  <span className="text-muted-foreground text-xs uppercase tracking-wide">Email reply</span>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-muted/40 rounded-md p-3 border border-border/50">
                    {messageText}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}


      {hasBooking && (
        <Card className="border-primary/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Booking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <InfoRow label="Date & time" value={bookingDateTime} />
            <InfoRow label="Meeting link" value={meetLink ? 'Join meeting' : null} href={meetLink} />
            <InfoRow label="Calendar" value={calendarName} />
            <InfoRow label="Pipeline stage" value={pipelineStage} />
            <InfoRow label="Appointment ID" value={appointmentId} />
            {showGhl && <InfoRow label="Sync state" value={sync.label} />}
            {appointmentId && (
              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setRescheduleOpen(true)}>
                  <Calendar className="mr-2 h-4 w-4" /> Move or cancel this meeting
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {appointmentId && (
        <LeadRescheduleDialog
          open={rescheduleOpen}
          onOpenChange={setRescheduleOpen}
          eventId={appointmentId}
          calendarId={calendarId}
          contactName={lead.name}
          currentTime={bookingDateTime}
          onDone={() => refetch()}
        />
      )}

      {hasMeta && ghlAttribution && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" /> GHL attribution (first / last touch)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Only fields that exist on the v3 AttributionSource DTO (see
                docs/ghl/models-contacts.d.ts). sessionSource / adId / formName
                are not among them and rendered as permanent blanks. Rows with
                no value are dropped rather than shown as dashes — a card full
                of dashes is the "campaign: unknown" pattern the deck rejects. */}
            {([
              ['First touch campaign', ghlAttribution.first?.campaign],
              ['First touch campaign ID', ghlAttribution.first?.campaignId],
              ['First touch UTM source', ghlAttribution.first?.utmSource],
              ['First touch UTM medium', ghlAttribution.first?.utmMedium],
              ['First touch medium', ghlAttribution.first?.medium],
              ['First touch referrer', ghlAttribution.first?.referrer],
              ['Last touch campaign', ghlAttribution.last?.campaign],
              ['Last touch campaign ID', ghlAttribution.last?.campaignId],
              ['Last touch UTM source', ghlAttribution.last?.utmSource],
              ['Last touch UTM medium', ghlAttribution.last?.utmMedium],
              ['Last touch referrer', ghlAttribution.last?.referrer],
            ] as const)
              .filter(([, v]) => v != null && String(v).trim() !== '')
              .map(([label, v]) => (
                <InfoRow key={label} label={label} value={String(v)} />
              ))}
          </CardContent>
        </Card>
      )}

      {hasMeta && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" /> Meta / Ad attribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <InfoRow label="Campaign" value={campaign} />
            <InfoRow label="Ad set" value={adSet} />
            <InfoRow label="Ad" value={ad} />
            <InfoRow label="Form" value={adForm} />
            <InfoRow label="Platform" value={firstOf(raw.platform, lead.utm_source, 'Meta')} />
            <InfoRow
              label="What made them click"
              value={firstOf(raw.ad_headline, raw.creative, raw.notes)}
            />
          </CardContent>
        </Card>
      )}

      {/* Investor + Alpha Digital detail now render in the source hero above. */}



      {hasWebsite && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Website
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <EnquiryRow label="Enquiry / message" enquiry={enquiry} />
            <InfoRow label="Challenge" value={challenge} />
            <InfoRow label="Role" value={firstOf(raw.role, raw.job_title)} />
            <InfoRow label="Company size" value={firstOf(raw.company_size, raw.team_size)} />
            <InfoRow label="Timeline" value={firstOf(raw.timeline)} />
            <InfoRow label="Source page" value={lead.source_url} href={sourceUrl} />
            <InfoRow label="Referrer" value={lead.referrer} />
            <InfoRow label="How they heard" value={firstOf(raw.how_heard_about)} />
          </CardContent>
        </Card>
      )}

      {hasDemo && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Film className="h-4 w-4 text-primary" /> Demo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <InfoRow label="Demo" value={demoTitle} />
            <InfoRow label="Demo ID" value={demoIdRaw} />
            <InfoRow label="Submitted at" value={fmt(lead.created_at, 'd MMM yyyy, h:mma')} />
            <InfoRow label="Source page" value={firstOf(raw.source_page, lead.source_url)} />
            <InfoRow label="Referrer" value={lead.referrer} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative border-l border-border ml-2 space-y-4">
            {timeline.map((ev, i) => {
              const Icon = ev.icon;
              return (
                <li key={i} className="ml-4">
                  <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-primary/15">
                    <Icon className="h-2.5 w-2.5 text-primary" />
                  </span>
                  <p className="text-sm font-medium">{ev.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmt(ev.at, 'd MMM yyyy, h:mma')}
                  </p>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </>
  );

  return (

    <div className="space-y-6 max-w-6xl mx-auto w-full">
      <Button variant="ghost" className="min-h-[44px] -ml-2" onClick={() => navigate(backToLeads)}>
        <ArrowLeft className="h-4 w-4 mr-1.5" /> {backLabel}
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="py-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold truncate">{lead.name}</h1>
                <Badge variant="outline" className="text-xs">{badge}</Badge>
                {leadStatusLabel(lead) && <Badge variant="secondary" className="text-xs capitalize">{leadStatusLabel(lead)}</Badge>}
                {records.length > 1 && (
                  <Badge className="text-xs bg-primary/10 text-primary border-primary/20" variant="outline">
                    <Layers className="h-3 w-3 mr-1" />
                    {records.length} records merged
                  </Badge>
                )}
                {showGhl && <GHLSyncDot input={raw} withLabel />}
              </div>
              <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {lead.company && (
                  <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5" />{lead.company}</span>
                )}
                {(() => {
                  if (lead.source !== 'alpha_digital_leads') return null;
                  const info = extractAlphaRawInfo(fullAlphaRaw ?? asObj(lead.raw).raw_data);
                  return info.linkedinUrl ? (
                    <a
                      className="flex items-center gap-1 text-[#0A66C2] hover:underline"
                      href={info.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Linkedin className="h-3.5 w-3.5" /> LinkedIn profile
                    </a>
                  ) : null;
                })()}
                {lead.email && (
                  <a className="flex items-center gap-1 hover:text-foreground" href={`mailto:${lead.email}`}>
                    <Mail className="h-3.5 w-3.5" />{lead.email}
                  </a>
                )}
                {lead.phone && (
                  <a className="flex items-center gap-1 hover:text-foreground" href={`tel:${lead.phone}`}>
                    <Phone className="h-3.5 w-3.5" />{lead.phone}
                  </a>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:max-w-[65%] sm:justify-end">
              {(() => {
                const panel = bestDistinctPanel(records);
                if (!panel) return null;
                return (
                  <Button variant="outline" size="sm" className={LEAD_ACTION_BTN} asChild>
                    <Link to={panel.path}>
                      <Layers className="h-4 w-4 shrink-0" /> Open in {panel.name}
                    </Link>
                  </Button>
                );
              })()}
              {ghlUrl && (
                <Button variant="outline" size="sm" className={LEAD_ACTION_BTN} asChild>
                  <a href={ghlUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 shrink-0" /> View in GHL
                  </a>
                </Button>
              )}
              {sourceUrl && (
                <Button variant="outline" size="sm" className={LEAD_ACTION_BTN} asChild>
                  <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4 shrink-0" /> Open Source page
                  </a>
                </Button>
              )}
              <PushToGhlButton lead={lead} size="sm" variant="default" className={LEAD_ACTION_BTN} />
              <PushAlphaLeadToGhlButton lead={lead} size="sm" variant="default" className={LEAD_ACTION_BTN} />
              <PushB2bLeadToGhlButton lead={lead} size="sm" variant="default" className={LEAD_ACTION_BTN} />

              {isAdmin && showGhl && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={LEAD_ACTION_BTN + ' min-w-0 px-3'}
                      title="More actions"
                    >
                      <MoreHorizontal className="h-4 w-4 shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onSelect={(e) => { e.preventDefault(); handleResync(); }}
                      disabled={resyncing || isRefetching}
                    >
                      {resyncing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Re-sync GHL
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Sections (each renders only if the lead has that data) */}
        <div className="lg:col-span-2 space-y-6">
          {ghlContactId ? (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="details" className="gap-1.5"><Info className="h-3.5 w-3.5" /> Details</TabsTrigger>
                <TabsTrigger value="conversation" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Conversation</TabsTrigger>
                <TabsTrigger value="opportunity" className="gap-1.5"><Trophy className="h-3.5 w-3.5" /> Opportunity</TabsTrigger>
              </TabsList>
              {/* Details holds no Notes card — notes belong with the
                  conversation, not repeated here. */}
              <TabsContent value="details" className="space-y-6 mt-4">
                {detailsSection}
              </TabsContent>
              <TabsContent value="conversation" className="mt-4 space-y-6">
                <LeadConversationTab
                  contactId={ghlContactId}
                  hasPhone={!!lead.phone}
                  hasEmail={!!lead.email}
                  contactName={lead.name}
                />
                {/* Notes live HERE, with the conversation.
                    They are NOT the amber "Note" bubbles above them. Those are
                    conversation internal comments — a different GoHighLevel
                    object. Contact notes come from /contacts/{id}/notes via
                    useGhlNotes, merged with our own lead_notes, and this card
                    is the only surface that shows them. Taking it out of
                    Details on the assumption the thread already covered them
                    made every note disappear. */}
                <LeadNotesCard lead={lead} />
              </TabsContent>
              <TabsContent value="opportunity" className="mt-4">
                <LeadOpportunityTab contactId={ghlContactId} />
              </TabsContent>
            </Tabs>
          ) : (
            <>
              {detailsSection}
              {/* No GHL contact means no Conversation tab, so this is the only
                  place notes appear for this lead. */}
              <LeadNotesCard lead={lead} />
            </>
          )}
        </div>




        {/* Attribution + GHL sync side panel */}
        <div className="space-y-6 lg:sticky lg:top-4 self-start">
          {/* Ownership & status overlay (side-table CRM data) */}
          <LeadOwnershipCard lead={lead} />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Attribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow label="Source" value={LEAD_SOURCE_META[lead.source]?.label ?? lead.source} />
              <InfoRow label="Source page" value={lead.source_url} href={sourceUrl} />
              <InfoRow label="Referrer" value={lead.referrer} />
              <InfoRow label="UTM source" value={lead.utm_source} />
              <InfoRow label="UTM medium" value={lead.utm_medium} />
              <InfoRow label="UTM campaign" value={lead.utm_campaign} />
            </CardContent>
          </Card>

          {showGhl ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  GHL sync <GHLSyncDot input={raw} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Status" value={sync.label} />
                <InfoRow label="Contact ID" value={lead.ghl_contact_id} />
                <InfoRow label="Opportunity" value={firstOf(resp.opportunity_id, resp.opportunity_name)} />
                <InfoRow label="Pipeline" value={pipelineStage} />
                <InfoRow
                  label="Last sync"
                  value={fmt(firstOf(resp.synced_at, raw.updated_at), 'd MMM yyyy, h:mma')}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">GHL sync</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Not applicable — this source isn't connected to GoHighLevel.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Merged sub-records */}
          {records.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" /> Merged records ({records.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {records.map((r) => (
                  <div key={`${r.source}-${r.id}`} className="flex items-center gap-2 flex-wrap text-xs">
                    <Badge variant="outline" className="text-[11px]">
                      {LEAD_SOURCE_META[r.source]?.label ?? r.source}
                    </Badge>
                    {leadStatusLabel(r) && <Badge variant="secondary" className="text-[11px] capitalize">{leadStatusLabel(r)}</Badge>}
                    <span className="text-muted-foreground">
                      {fmt(r.created_at, 'd MMM yyyy, h:mma')}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
