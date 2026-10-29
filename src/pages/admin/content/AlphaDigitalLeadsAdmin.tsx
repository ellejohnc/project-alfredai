import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecordDeepLink } from "@/hooks/useRecordDeepLink";
import { LegacyLeadActions } from "@/components/admin/leads/LegacyLeadActions";
import { SourceBadge } from "@/components/admin/leads/SourceBadge";
import { AdminToolbar, type ToolbarFilter } from "@/components/admin/AdminToolbar";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminMetricsStrip } from "@/components/admin/AdminMetricsStrip";
import { AdminActionsRow } from "@/components/admin/AdminActionsRow";
import { LeadList, LeadListHeader, LeadListRow } from "@/components/admin/leads/LeadListRow";
import { LeadOverlayOwnerCell, LeadOverlayOutcome } from "@/components/admin/leads/LeadOverlayOwnerCell";
import { ownerName } from "@/components/admin/leads/ownerName";
import { matchesLeadSearch, optionsFromData } from "@/lib/leadSearch";
import AccessDenied from "@/components/admin/AccessDenied";
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { formatName } from '@/lib/textFormatting';
import { leadKey, leadStatusLabel } from "@/lib/unifiedLead";
import { useLeadOverlayData } from "@/hooks/useLeadOverlay";
import { useSalesReps } from "@/hooks/useSalesReps";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { alphaStatusMeta, alphaStatusLabel, alphaSourceLabel, extractAlphaRawInfo, alphaStepLabel } from '@/lib/alphaDigitalStatus';
import {
  Loader2,
  Download,
  RefreshCw,
  Cloud,
  CloudOff,
  AlertCircle,
  BarChart3,
  Linkedin,
} from 'lucide-react';
import { AlphaBackfillPanel } from '@/components/admin/leads/AlphaBackfillPanel';


interface AlphaLead {
  id: string;
  external_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  status: string | null;
  synced_at: string;
  created_at: string;
  raw_data: Record<string, any> | null;
}

/** Build an ordered timeline of known events for a lead. */
function buildTimeline(lead: AlphaLead) {
  const events: { label: string; at: Date; icon: 'created' | 'status' | 'synced' }[] = [];
  if (lead.created_at) {
    events.push({ label: 'Lead created', at: new Date(lead.created_at), icon: 'created' });
  }
  const sct = lead.raw_data?.stepChangeTimestamp;
  if (sct) {
    const ms = typeof sct === 'number' ? sct : Number(sct);
    if (!Number.isNaN(ms) && ms > 0) {
      events.push({
        label: `Status changed to ${alphaStatusLabel(lead.status)}`,
        at: new Date(ms),
        icon: 'status',
      });
    }
  }
  if (lead.synced_at) {
    events.push({ label: 'Last synced', at: new Date(lead.synced_at), icon: 'synced' });
  }
  return events
    .filter((e) => !Number.isNaN(e.at.getTime()))
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}

const SUPPORT_EMAIL = 'hello@alfredai.bot';

export default function AlphaDigitalLeadsAdmin() {
  const navigate = useNavigate();
  const { canViewLeads, canExportLeads } = usePermissions();
  const [leads, setLeads] = useState<AlphaLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: overlay } = useLeadOverlayData();
  const { data: salesReps = [] } = useSalesReps();
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [stepFilter, setStepFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  // Tile filters. "No email" and "Replied" aren't dropdown filters — they're
  // one-click narrowings off the metrics strip, which is the whole point of the
  // tiles being interactive rather than decorative.
  const [reachFilter, setReachFilter] = useState<'all' | 'noEmail'>('all');
  const [repliedOnly, setRepliedOnly] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  useRecordDeepLink({
    records: leads,
    ready: !loading,
    getId: (lead) => lead.id,
    onOpen: (lead) => navigate(`/admin/alpha-digital-leads/${lead.id}`),
  });

    const ownerNameFor = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const a of overlay?.annotations ?? []) {
      if (a.lead_source !== "alpha_digital_leads" || !a.owner_id) continue;
      const name = ownerName(a.owner_id, salesReps);
      if (name) byKey.set(leadKey(a.lead_source, a.lead_id), name);
    }
    return (id: string) => byKey.get(leadKey("alpha_digital_leads", id)) ?? null;
  }, [overlay, salesReps]);

  const fetchLeads = async () => {
    try {
      // Supabase caps a single request at 1000 rows. Page through in chunks
      // so we get the full dataset instead of a silently-truncated list.
      //
      // We deliberately do NOT select `raw_data` here. It is ~5.5 MB across the
      // 3,055 active rows, and carrying it through the ORDER BY made the sort
      // spill to disk (external merge, ~3.5 MB) on every chunk. The list only
      // needs a handful of keys out of it — about 30 kB in total, 185x smaller
      // — so we extract exactly those and rebuild a slim `raw_data` object.
      // The full blob is fetched on demand for a single lead when its record is
      // The record page fetches the full blob itself, so nothing loses data.
      const CHUNK = 1000;
      const all: AlphaLead[] = [];
      let from = 0;
      while (from < 100000) {
        const { data, error } = await supabase
          .from('alpha_digital_leads')
          .select(
            'id, external_id, name, email, phone, company, source, status, synced_at, created_at,' +
              'rd_linkedinUrl:raw_data->>linkedinUrl,' +
              'rd_linkedin_url:raw_data->>linkedin_url,' +
              'rd_profileUrl:raw_data->>profileUrl,' +
              'rd_headline:raw_data->>headline,' +
              'rd_occupation:raw_data->>occupation,' +
              'rd_jobTitle:raw_data->>jobTitle,' +
              'rd_title:raw_data->>title,' +
              'rd_company:raw_data->>company,' +
              'rd_currentCompany:raw_data->>currentCompany,' +
              'rd_companyName:raw_data->>companyName,' +
              'rd_campaign:raw_data->campaign,' +
              'rd_connectionDegree:raw_data->>connectionDegree,' +
              'rd_degree:raw_data->>degree,' +
              'rd_currentStep:raw_data->>currentStep,' +
              'rd_step:raw_data->>step,' +
              'rd_nextStep:raw_data->>nextStep,' +
              'rd_businessEmail:raw_data->>businessEmail,' +
              'rd_personalEmail:raw_data->>personalEmail,' +
              'rd_stepChangeTimestamp:raw_data->>stepChangeTimestamp',
          )
          .is('archived_at', null)
          .order('synced_at', { ascending: false })
          .range(from, from + CHUNK - 1);
        if (error) throw error;
        const batch = (data || []).map((r: Record<string, any>) => ({
          ...r,
          // Same shape extractAlphaRawInfo + buildTimeline already expect, so
          // every existing reader keeps working untouched.
          raw_data: {
            linkedinUrl: r.rd_linkedinUrl,
            linkedin_url: r.rd_linkedin_url,
            profileUrl: r.rd_profileUrl,
            headline: r.rd_headline,
            occupation: r.rd_occupation,
            jobTitle: r.rd_jobTitle,
            title: r.rd_title,
            company: r.rd_company,
            currentCompany: r.rd_currentCompany,
            companyName: r.rd_companyName,
            campaign: r.rd_campaign,
            connectionDegree: r.rd_connectionDegree,
            degree: r.rd_degree,
            currentStep: r.rd_currentStep,
            step: r.rd_step,
            nextStep: r.rd_nextStep,
            businessEmail: r.rd_businessEmail,
            personalEmail: r.rd_personalEmail,
            stepChangeTimestamp: r.rd_stepChangeTimestamp,
          },
        })) as unknown as AlphaLead[];
        all.push(...batch);
        if (batch.length < CHUNK) break;
        from += CHUNK;
      }
      setLeads(all);
      setLoadError(null);
    } catch (err) {
      console.error('Error loading Alpha Digital leads:', err);
      setLoadError('We could not load Alpha Digital leads. Please refresh, or email us if it persists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('alpha-digital-sync');
      if (error) throw error;
      if (data?.success === false) {
        if (data.configured === false) setNotConfigured(true);
        toast.error(data.error || 'Sync failed');
      } else {
        setNotConfigured(false);
        toast.success(`Synced ${data?.synced ?? 0} lead(s) from Alpha Digital`);
        await fetchLeads();
      }
    } catch (err) {
      console.error('Alpha Digital sync error:', err);
      toast.error('Could not reach the sync service. Please try again shortly.');
    } finally {
      setSyncing(false);
    }
  };

  // Distinct campaign labels + sequence steps for filter dropdowns.
  const campaignOptions = useMemo(() => {
    const s = new Set<string>();
    for (const l of leads) {
      const info = extractAlphaRawInfo(l.raw_data);
      const label = info.campaign ?? alphaSourceLabel(l.source);
      if (label) s.add(label);
    }
    return Array.from(s).sort();
  }, [leads]);
  const stepOptions = useMemo(() => {
    const s = new Set<string>();
    for (const l of leads) {
      const step = extractAlphaRawInfo(l.raw_data).currentStep;
      if (step) s.add(step);
    }
    return Array.from(s).sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));
  }, [leads]);

  const filtered = leads.filter((l) => {
    if (ownerFilter !== "all") {
      const name = ownerNameFor(l.id);
      if (ownerFilter === "__unassigned") {
        if (name) return false;
      } else if (name !== ownerFilter) {
        return false;
      }
    }
    
    const info = extractAlphaRawInfo(l.raw_data);

    if (
      !matchesLeadSearch(searchQuery, {
        text: [
          l.name, l.email, l.company, l.source,
          alphaSourceLabel(l.source), alphaStatusLabel(l.status),
          info.linkedinUrl, info.jobTitle, info.campaign,
          info.businessEmail, info.personalEmail,
        ],
        phones: [l.phone],
      })
    ) {
      return false;
    }

    if (campaignFilter !== 'all') {
      const label = info.campaign ?? alphaSourceLabel(l.source);
      if (label !== campaignFilter) return false;
    }
    if (stepFilter !== 'all') {
      if ((info.currentStep ?? '') !== stepFilter) return false;
    }
    if (reachFilter === 'noEmail') {
      const anyEmail = l.email || info.businessEmail || info.personalEmail;
      if (anyEmail) return false;
    }
    if (repliedOnly && !['3', '4', '6'].includes(String(l.status ?? ''))) return false;
    if (dateFrom) {
      if (new Date(l.created_at) < new Date(dateFrom)) return false;
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      if (new Date(l.created_at) > end) return false;
    }
    return true;
  });

  // Reset to first page whenever the filter set or page size changes.
  useEffect(() => {
    setPage(1);
  }, [searchQuery, pageSize, campaignFilter, stepFilter, reachFilter, repliedOnly, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, filtered.length);
  const paginated = filtered.slice(pageStart, pageEnd);

  // Breakdown of leads by LinkedIn campaign / source, with per-status counts.
  const breakdown = useMemo(() => {
    const map = new Map<
      string,
      { source: string; total: number; statuses: Map<string, number> }
    >();
    for (const l of filtered) {
      const key = l.source || 'unknown';
      const entry = map.get(key) ?? { source: key, total: 0, statuses: new Map() };
      entry.total += 1;
      const sKey = String(l.status ?? '');
      entry.statuses.set(sKey, (entry.statuses.get(sKey) ?? 0) + 1);
      map.set(key, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  // Plain-English stats for the header grid. Each label describes exactly what
  // the number counts so admins glancing at the page aren't left guessing.
  // These prospects come from LinkedIn outreach, so most are reachable via
  // LinkedIn rather than email/phone — that's the whole point of the caption.
  const stats = useMemo(() => {
    const withEmail = leads.filter((l) => {
      const info = extractAlphaRawInfo(l.raw_data);
      return Boolean(l.email || info.businessEmail || info.personalEmail);
    }).length;
    const withLinkedin = leads.filter((l) => Boolean(extractAlphaRawInfo(l.raw_data).linkedinUrl)).length;
    const withPhone = leads.filter((l) => Boolean(l.phone)).length;
    const campaigns = new Set(
      leads
        .map((l) => extractAlphaRawInfo(l.raw_data).campaign || l.source || null)
        .filter((v): v is string => Boolean(v)),
    ).size;
    const replied = leads.filter((l) => ['3', '4', '6'].includes(String(l.status ?? ''))).length;
    // Every Leads Page 05 asks for the feed's own states. MultiLead's leadStatusId:
    // 1 New · 2 Contacted · 3 Replied · 4 Interested · 5 Not interested · 6 Meeting booked.
    // "Qualified" and "Needs review" were in the doc but are not states this feed has,
    // so the doc was corrected rather than inventing the rule that would fill them.
    const contacted = leads.filter((l) => String(l.status ?? '') === '2').length;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = leads.filter((l) => {
      const t = new Date(l.created_at ?? l.synced_at ?? 0).getTime();
      return Number.isFinite(t) && t >= weekAgo;
    }).length;
    return { total: leads.length, withEmail, withLinkedin, withPhone, campaigns, replied, contacted, thisWeek };
  }, [leads]);






  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Source', 'Status', 'Synced'];
    const rows = filtered.map((l) => [
      l.name || '',
      l.email || '',
      l.phone || '',
      l.company || '',
      alphaSourceLabel(l.source),
      alphaStatusLabel(l.status),
      format(new Date(l.synced_at), 'yyyy-MM-dd HH:mm'),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alpha-digital-leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  };


  const adminActions = [
    {
      key: "sync",
      label: "Sync now",
      icon: <RefreshCw className="h-3.5 w-3.5" />,
      onClick: handleSync,
      loading: syncing,
    },
    {
      key: "export",
      label: "Export CSV",
      icon: <Download className="h-3.5 w-3.5" />,
      onClick: exportToCSV,
      disabled: !filtered.length,
      allowed: canExportLeads,
    },
  ];

  if (!canViewLeads) {
    return <AccessDenied />;
  }

  return (
    <div className="min-w-0 space-y-4 pb-24 lg:pb-6">

      <AdminPageHeader
        title="Alpha Digital Leads"
        icon={<Cloud className="h-5 w-5 text-primary" />}
        description="Leads synced from the Alpha Digital platform."
      />

      {notConfigured && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="py-5 flex items-start gap-3">
            <CloudOff className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Alpha Digital is not connected yet</p>
              <p className="text-muted-foreground mt-1">
                Add the Alpha Digital API URL and key, then press <strong>Sync now</strong>. Until then this
                list stays empty.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {loadError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">{loadError}</p>
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Alpha Digital leads error')}&body=${encodeURIComponent(`Page: ${window.location.href}\n\nPlease describe what happened and attach a screenshot.`)}`}
                className="text-primary underline mt-1 inline-block"
              >
                Email us about this error
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && leads.length > 0 && (
        <>
          <AlphaBackfillPanel />
          <AdminMetricsStrip
            metrics={[
              {
                value: stats.total,
                label: 'Alpha leads',
                onClick: () => {
                  setSearchQuery('');
                  setCampaignFilter('all');
                  setStepFilter('all');
                  setReachFilter('all');
                  setRepliedOnly(false);
                  setDateFrom('');
                  setDateTo('');
                },
              },
              {
                value: stats.contacted,
                label: 'Contacted',
                tone: 'warn',
                onClick: () => setStepFilter(stepFilter === '2' ? 'all' : '2'),
                active: stepFilter === '2',
              },
              {
                value: stats.replied,
                label: 'Replied',
                tone: 'good',
                onClick: () => setRepliedOnly(!repliedOnly),
                active: repliedOnly,
              },
              {
                value: stats.thisWeek,
                label: 'This week',
                tone: 'accent',
                onClick: () => {
                  const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                  const iso = d.toISOString().slice(0, 10);
                  setDateFrom(dateFrom === iso ? '' : iso);
                  setDateTo('');
                },
                active: Boolean(dateFrom) && !dateTo,
              },
            ]}
          />
          <p className="-mt-1 text-[11px] text-muted-foreground">
            These are LinkedIn outbound prospects — most are reachable on LinkedIn, not by email or phone.
          </p>
        </>
      )}


      {!loading && breakdown.length > 0 && (

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" /> Campaign breakdown
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Leads by LinkedIn campaign / source and their current stages.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[360px] overflow-y-auto">
              {breakdown.map((b) => {
                const statuses = Array.from(b.statuses.entries()).sort((a, c) => c[1] - a[1]);
                return (
                  <div key={b.source} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{alphaSourceLabel(b.source)}</p>
                      <span className="text-sm font-semibold tabular-nums shrink-0">
                        {b.total} lead{b.total === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {statuses.map(([s, count]) => (
                        <StatusBadge
                          key={s || 'none'}
                          status={alphaStatusMeta(s).badge}
                          label={`${alphaStatusLabel(s)} · ${count}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* The admin row. adminActions was built above — Sync now, and Export CSV
          gated on permission — and then passed to nothing, so both buttons were
          unreachable on this page while the docs recorded the row as present on
          every lead page. Those docs counted imports, not renders. */}
      <AdminActionsRow actions={adminActions} />

      <Card>
        <CardHeader className="pb-3">
          <AdminToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search name, company, job title, campaign…"
            filters={[
              {
                key: "owner",
                label: "Owner",
                value: ownerFilter,
                onChange: setOwnerFilter,
                width: "w-[160px]",
                options: [
                  { value: "all", label: "All owners" },
                  { value: "__unassigned", label: "Unassigned" },
                  ...optionsFromData(leads, (l) => ownerNameFor(l.id)),
                ],
              },
              {
                key: 'campaign',
                label: 'Campaign',
                value: campaignFilter,
                onChange: setCampaignFilter,
                width: 'w-[190px]',
                options: [
                  { value: 'all', label: 'All campaigns' },
                  ...campaignOptions.map((c) => ({ value: c, label: c })),
                ],
              },
              {
                key: 'step',
                label: 'Step',
                value: stepFilter,
                onChange: setStepFilter,
                width: 'w-[140px]',
                options: [
                  { value: 'all', label: 'All steps' },
                  ...stepOptions.map((s) => ({ value: s, label: alphaStepLabel(s) ?? s })),
                ],
              },
            ] satisfies ToolbarFilter[]}
            onClearAll={() => {
              setSearchQuery("");
              setCampaignFilter("all");
              setStepFilter("all");
              setReachFilter("all");
              setRepliedOnly(false);
              setDateFrom("");
              setDateTo("");
              setOwnerFilter("all");
            }}
            resultCount={filtered.length}
            resultNoun="prospect"
            actions={
              <>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-[145px] text-xs" aria-label="From date" />
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-[145px] text-xs" aria-label="To date" />
              </>
            }
          />
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No leads yet. Press <strong>Sync now</strong> to pull the latest from Alpha Digital.
            </div>
          ) : (
            <LeadList>
              <LeadListHeader whenLabel="Synced" />
              {paginated.map((lead) => {
                const info = extractAlphaRawInfo(lead.raw_data);
                const email = lead.email || info.businessEmail || info.personalEmail;
                const company = lead.company || info.company;
                const step = alphaStepLabel(info.currentStep);
                return (
                  <LeadListRow
                    key={lead.id}
                    onClick={() => navigate(`/admin/alpha-digital-leads/${lead.id}`)}
                    name={lead.name ? formatName(lead.name) : 'Unknown lead'}
                    badgeSlot={<SourceBadge label="LinkedIn" />}
                    extraSlot={
                      <>
                        {info.campaign && (
                          <Badge variant="secondary" className="max-w-[170px] truncate text-[10px] font-normal" title={info.campaign}>
                            {info.campaign}
                          </Badge>
                        )}
                        {step && (
                          <Badge variant="outline" className="text-[10px] font-normal">{step}</Badge>
                        )}
                        {info.linkedinUrl && (
                          <a
                            href={info.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Open LinkedIn profile"
                            className="inline-flex items-center gap-1 rounded-full border border-[#0A66C2]/40 bg-[#0A66C2]/10 px-2 py-0.5 text-[10px] font-medium text-[#0A66C2] transition-colors hover:bg-[#0A66C2]/20"
                          >
                            <Linkedin className="h-3 w-3" /> Profile
                          </a>
                        )}
                        <LeadOverlayOutcome source="alpha_digital_leads" id={lead.id} />
                      </>
                    }
                    contactLine={
                      <>
                        {info.jobTitle || 'No job title'}
                        {company ? ` · ${company}` : ''}
                        {email ? ` · ${email}` : ' · No email on file'}
                      </>
                    }
                    status={lead.status}
                    statusLabel={leadStatusLabel({ source: 'alpha_digital_leads', status: lead.status }) ?? alphaStatusLabel(lead.status)}
                    ownerSlot={<LeadOverlayOwnerCell source="alpha_digital_leads" id={lead.id} />}
                    whenSlot={
                      <div className="text-right">
                        <div>{format(new Date(lead.synced_at), 'd MMM yyyy')}</div>
                        {info.connectionDegree && <div className="opacity-70">{info.connectionDegree}</div>}
                      </div>
                    }
                    actionsSlot={
                      <LegacyLeadActions
                        source="alpha_digital_leads"
                        id={lead.id}
                        name={lead.name || 'Unknown lead'}
                        email={email}
                        phone={lead.phone}
                        company={company}
                        status={lead.status}
                        createdAt={lead.created_at}
                        sourceUrl={info.linkedinUrl}
                        raw={lead.raw_data ?? undefined}
                      />
                    }
                  />
                );
              })}
            </LeadList>

          )}

          {!loading && filtered.length > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t pt-4">
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-medium text-foreground">{pageStart + 1}</span>–
                <span className="font-medium text-foreground">{pageEnd}</span> of{' '}
                <span className="font-medium text-foreground">{filtered.length}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  Rows per page
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="h-9 rounded-md border bg-background px-2 text-xs"
                  >
                    {[25, 50, 100, 200].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
