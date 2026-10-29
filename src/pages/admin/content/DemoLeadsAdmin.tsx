import { useEffect, useMemo, useState } from "react";
import { useDemoEngagementRollup } from '@/hooks/useDemoEngagementRollup';
import { useNavigate } from "react-router-dom";
import { getLeadsCache, peekLeadsCache, setLeadsCache } from "@/lib/leadsPageCache";
import { useRecordDeepLink } from "@/hooks/useRecordDeepLink";
import { LegacyLeadActions } from "@/components/admin/leads/LegacyLeadActions";
import { SourceBadge } from "@/components/admin/leads/SourceBadge";
import { AdminToolbar, type ToolbarFilter } from "@/components/admin/AdminToolbar";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminActionsRow } from "@/components/admin/AdminActionsRow";
import { LeadFunnelMetrics } from "@/components/admin/leads/LeadFunnelMetrics";
import { AdminMetricsStrip, type AdminMetric } from "@/components/admin/AdminMetricsStrip";
import { LeadList, LeadListHeader, LeadListRow } from "@/components/admin/leads/LeadListRow";
import { LeadOverlayOwnerCell, LeadOverlayOutcome } from "@/components/admin/leads/LeadOverlayOwnerCell";
import { ownerName } from "@/components/admin/leads/ownerName";
import { matchesLeadSearch, optionsFromData } from "@/lib/leadSearch";
import { leadStatusLabel, leadKey } from "@/lib/unifiedLead";
import { useLeadOverlayData } from "@/hooks/useLeadOverlay";
import { useSalesReps } from "@/hooks/useSalesReps";
import { GHLSyncDot } from "@/components/admin/GHLSyncDot";
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { useUnifiedLeads } from '@/hooks/useUnifiedLeads';
import { inSegment, demoShareRecord } from '@/lib/leadSegments';
import type { UnifiedLead } from '@/lib/unifiedLead';
import { capitalizeText, formatName } from '@/lib/textFormatting';
import { LeadPanelErrorState } from '@/components/admin/LeadPanelErrorState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Loader2,
  Calendar,
  Download,
  RefreshCw,
  Play,
  Archive,
} from 'lucide-react';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import AccessDenied from '@/components/admin/AccessDenied';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface DemoLead {
  id: string;
  lead_email: string;
  lead_name: string | null;
  lead_phone: string | null;
  source_page: string;
  source_campaign: string | null;
  ghl_status: string | null;
  created_at: string;
  archived_at: string | null;
  /** Ties this lead to its demo_engagement events. Null on anything captured
   *  before 19 Aug, when the join was added. */
  visitor_id: string | null;
}

const DATE_RANGES = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom range' },
];

/** "/resources/demos/consultant-decision-support" -> "Consultant Decision Support" */
const extractDemoName = (sourcePage: string): string => {
  const match = (sourcePage ?? '').match(/\/resources\/demos\/(.+)/);
  if (match) {
    return match[1].split('-').map((w) => capitalizeText(w)).join(' ');
  }
  return sourcePage ?? '';
};

/** "demo_consultant-decision-support" -> "consultant-decision-support" */
const extractDemoId = (sourceCampaign: string | null): string => {
  if (!sourceCampaign) return 'Unknown';
  const match = sourceCampaign.match(/^demo_(.+)$/);
  return match ? match[1] : sourceCampaign;
};

export default function DemoLeadsAdmin() {
  const navigate = useNavigate();
  const { canViewLeads, canExportLeads } = usePermissions();
  const { data: overlay } = useLeadOverlayData();
  const { data: salesReps = [] } = useSalesReps();
  const [ownerFilter, setOwnerFilter] = useState<string>("all");

  const ownerNameFor = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const a of overlay?.annotations ?? []) {
      if (a.lead_source !== "ghl_submissions" || !a.owner_id) continue;
      const name = ownerName(a.owner_id, salesReps);
      if (name) byKey.set(leadKey(a.lead_source, a.lead_id), name);
    }
    return (id: string) => byKey.get(leadKey("ghl_submissions", id)) ?? null;
  }, [overlay, salesReps]);

  const { data: unified, isLoading: unifiedLoading, isError: unifiedError, refetch: refetchUnified } =
    useUnifiedLeads();
  const { data: engagement } = useDemoEngagementRollup();

  const demoUnifiedLeads = useMemo(() => {
    return (unified?.leads ?? []).filter((l) => inSegment(l, "demo"));
  }, [unified?.leads]);


  // Archived demo leads are excluded from the unified dataset (which powers the
  // inbox Demo tab), so fetch them separately to keep the "Show archived" view.
  const [archivedLeads, setArchivedLeads] = useState<DemoLead[]>(
    () => peekLeadsCache<DemoLead[]>('demo-archived') ?? [],
  );
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(undefined);
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>(undefined);
  const [demoFilter, setDemoFilter] = useState<string>('all');
  const [engagementFilter, setEngagementFilter] = useState<'all' | 'engaged' | 'completed'>('all');

  const [cachedActive] = useState<DemoLead[] | null>(() => peekLeadsCache<DemoLead[]>('demo-active'));
  const [hasFreshCache] = useState(() => getLeadsCache('demo-active') !== null);

  const loading = unifiedLoading && !hasFreshCache;

  // Map a unified Demo lead to the DemoLead shape this page renders, pulling the
  // underlying demo-share ghl_submission (primary OR merged sub-record) so the
  // list & count exactly match the inbox Demo tab (single source of truth).
  const toDemoLead = (lead: UnifiedLead): DemoLead | null => {
    const rec = demoShareRecord(lead);
    if (!rec) return null;
    const raw = (rec.raw ?? {}) as Record<string, any>;
    return {
      id: rec.id,
      lead_email: raw.lead_email ?? rec.email ?? '',
      lead_name: raw.lead_name ?? rec.name ?? null,
      lead_phone: raw.lead_phone ?? rec.phone ?? null,
      visitor_id: raw.visitor_id ?? null,
      source_page: raw.source_page ?? rec.source_url ?? '',
      source_campaign: raw.source_campaign ?? null,
      ghl_status: raw.ghl_status ?? rec.status ?? null,
      created_at: rec.created_at,
      archived_at: raw.archived_at ?? null,
    };
  };

  // Active (non-archived) demo leads come from the unified, deduped dataset.
  const activeLeads = useMemo<DemoLead[]>(() => {
    const list = unified?.leads ?? [];
    if (!unified?.leads) return cachedActive ?? [];
    const mapped = list
      .filter((l) => inSegment(l, 'demo'))
      .map(toDemoLead)
      .filter((l): l is DemoLead => l !== null);
    setLeadsCache('demo-active', mapped);
    return mapped;
  }, [unified?.leads]);

  useEffect(() => {
    setLoadError(unifiedError);
  }, [unifiedError]);

  // Combined dataset the rest of the page filters over.
  const leads = useMemo<DemoLead[]>(
    () => [...activeLeads, ...archivedLeads],
    [activeLeads, archivedLeads],
  );

  const fetchArchived = async () => {
    try {
      const { data, error } = await supabase
        .from('ghl_submissions')
        .select('id, lead_email, lead_name, lead_phone, source_page, source_campaign, ghl_status, created_at, archived_at')
        .eq('lead_source', 'demo_share')
        .not('archived_at', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data as DemoLead[]) || [];
      setArchivedLeads(rows);
      setLeadsCache('demo-archived', rows);
    } catch (error) {
      console.error('Error fetching archived demo leads:', error);
    }
  };

  useRecordDeepLink({
    records: leads,
    ready: !loading,
    getId: (l) => l.id,
    onOpen: (l) => navigate(`/admin/demo-leads/${l.id}`),
  });

  const refreshAll = async () => {
    await Promise.all([refetchUnified(), fetchArchived()]);
  };

  useEffect(() => {
    fetchArchived();

    // Realtime — refresh both unified + archived on change.
    const channel = supabase
      .channel('demo-leads-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ghl_submissions',
          filter: 'lead_source=eq.demo_share',
        },
        () => {
          refreshAll();
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAll();
    setIsRefreshing(false);
    toast.success('Data refreshed');
  };

  // Demo counts drive both the "top demos" chips and the Demo filter options,
  // so the filter can never offer a demo that has no leads behind it.
  const demoStats = useMemo(() => {
    return leads.reduce((acc, lead) => {
      if (lead.archived_at) return acc;
      const demoName = extractDemoName(lead.source_page);
      if (!demoName) return acc;
      acc[demoName] = (acc[demoName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [leads]);

  const topDemos = useMemo(
    () => Object.entries(demoStats).sort((a, b) => b[1] - a[1]).slice(0, 6),
    [demoStats],
  );

  const inDateRange = (lead: DemoLead): boolean => {
    const leadDate = new Date(lead.created_at);
    if (dateRange === 'today') {
      return isWithinInterval(leadDate, { start: startOfDay(new Date()), end: endOfDay(new Date()) });
    }
    if (dateRange === '7d') {
      return isWithinInterval(leadDate, { start: subDays(new Date(), 7), end: new Date() });
    }
    if (dateRange === '30d') {
      return isWithinInterval(leadDate, { start: subDays(new Date(), 30), end: new Date() });
    }
    if (dateRange === 'custom' && customDateFrom && customDateTo) {
      return isWithinInterval(leadDate, { start: startOfDay(customDateFrom), end: endOfDay(customDateTo) });
    }
    return true;
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Archive view
      if (showArchived ? !lead.archived_at : !!lead.archived_at) return false;

      // Shared search matcher — null-safe, and phones match by digits.
      if (
        !matchesLeadSearch(searchQuery, {
          text: [lead.lead_name, lead.lead_email, lead.source_page, extractDemoName(lead.source_page)],
          phones: [lead.lead_phone],
        })
      ) {
        return false;
      }

      if (demoFilter !== 'all' && extractDemoName(lead.source_page) !== demoFilter) return false;

      if (engagementFilter !== 'all') {
        const e = lead.visitor_id ? engagement?.byVisitor.get(lead.visitor_id) : undefined;
        if (engagementFilter === 'engaged' && !e?.engaged) return false;
        if (engagementFilter === 'completed' && !e?.completed) return false;
      }

      return inDateRange(lead);
    });
  }, [leads, showArchived, searchQuery, demoFilter, ownerFilter, ownerNameFor, dateRange, customDateFrom, customDateTo]);

  const stats = useMemo(() => {
    const active = leads.filter((l) => !l.archived_at);
    return {
      total: active.length,
      today: active.filter((l) =>
        isWithinInterval(new Date(l.created_at), {
          start: startOfDay(new Date()),
          end: endOfDay(new Date()),
        }),
      ).length,
      thisWeek: active.filter((l) =>
        isWithinInterval(new Date(l.created_at), { start: subDays(new Date(), 7), end: new Date() }),
      ).length,
      demos: Object.keys(demoStats).length,
      // Every Leads Page 03 asks for Started / Engaged / Completed. These read
      // real events joined by visitor_id; they were impossible before that join
      // existed. Anything captured before 19 Aug has no visitor_id, so it
      // counts as started (they did request the demo) and nothing more —
      // inferring engagement we never recorded would be inventing it.
      engaged: active.filter((l) => l.visitor_id && engagement?.byVisitor.get(l.visitor_id)?.engaged)
        .length,
      completed: active.filter(
        (l) => l.visitor_id && engagement?.byVisitor.get(l.visitor_id)?.completed,
      ).length,
    };
  }, [leads, demoStats, engagement]);

  const metrics: AdminMetric[] = [
    { value: stats.total, label: 'Started' },
    {
      value: stats.engaged,
      label: 'Engaged',
      tone: 'good',
      onClick: () => setEngagementFilter(engagementFilter === 'engaged' ? 'all' : 'engaged'),
      active: engagementFilter === 'engaged',
    },
    {
      value: stats.completed,
      label: 'Completed',
      tone: 'accent',
      onClick: () => setEngagementFilter(engagementFilter === 'completed' ? 'all' : 'completed'),
      active: engagementFilter === 'completed',
    },
    {
      value: stats.thisWeek,
      label: 'This week',
      onClick: () => setDateRange(dateRange === '7d' ? 'all' : '7d'),
      active: dateRange === '7d',
    },
  ];

  const filters: ToolbarFilter[] = [
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
      key: 'demo',
      label: 'Demo',
      value: demoFilter,
      onChange: setDemoFilter,
      width: 'w-[190px]',
      options: [
        { value: 'all', label: 'All demos' },
        ...Object.keys(demoStats)
          .sort()
          .map((name) => ({ value: name, label: `${name} (${demoStats[name]})` })),
      ],
    },
    {
      key: 'date',
      label: 'Date',
      value: dateRange,
      onChange: setDateRange,
      allValue: 'all',
      width: 'w-[150px]',
      options: DATE_RANGES,
    },
  ];

  

  const clearAll = () => {
    setSearchQuery('');
    setDemoFilter('all');
    setDateRange('all');
    setCustomDateFrom(undefined);
    setCustomDateTo(undefined);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Demo', 'Status', 'Date'];
    const rows = filteredLeads.map((lead) => [
      formatName(lead.lead_name) || '',
      lead.lead_email,
      lead.lead_phone || '',
      extractDemoName(lead.source_page),
      lead.ghl_status || 'submitted',
      format(new Date(lead.created_at), 'yyyy-MM-dd HH:mm'),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demo-leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  };


  const adminActions = [
    {
      key: "refresh",
      label: "Refresh",
      icon: <RefreshCw className="h-3.5 w-3.5" />,
      onClick: handleRefresh,
      loading: isRefreshing,
    },
    {
      key: "export",
      label: "Export",
      icon: <Download className="h-3.5 w-3.5" />,
      onClick: exportToCSV,
      allowed: canExportLeads,
    },
  ];

  if (!canViewLeads) {
    return <AccessDenied />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      {loadError && <LeadPanelErrorState panelName="Demo leads" />}

      <AdminPageHeader
        title="Demo Leads"
        icon={<Play className="h-5 w-5 text-primary" />}
        description="Leads captured from shared demo links"
        isRealtimeConnected={isRealtimeConnected}
      />

      {/* Metrics — the tiles are filters */}
      <AdminMetricsStrip metrics={metrics} />
      <AdminActionsRow actions={adminActions} />
      <LeadFunnelMetrics leads={demoUnifiedLeads} scopeLabel="all demo leads" />

      {/* Top demos — replaces the bar chart. Same information, but each bar is
          now a filter you can actually click. */}
      {topDemos.length > 0 && (
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Top demos
          </span>
          {topDemos.map(([name, count]) => (
            <button
              key={name}
              type="button"
              onClick={() => setDemoFilter(demoFilter === name ? 'all' : name)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[11px] transition-colors',
                demoFilter === name
                  ? 'border-primary/60 bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground',
              )}
            >
              {name}
              <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search + filters */}
      <AdminToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search name, email, demo, phone…"
        filters={filters}
        onClearAll={clearAll}
        resultCount={filteredLeads.length}
        resultNoun="demo lead"
        actions={
          <Button
            variant={showArchived ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="mr-1.5 h-3.5 w-3.5" />
            {showArchived ? 'Showing archived' : 'Archived'}
          </Button>
        }
      />


      {/* Custom date range */}
      {dateRange === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Calendar className="mr-1.5 h-3.5 w-3.5" />
                {customDateFrom ? format(customDateFrom, 'MMM d, yyyy') : 'From date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent mode="single" selected={customDateFrom} onSelect={setCustomDateFrom} />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Calendar className="mr-1.5 h-3.5 w-3.5" />
                {customDateTo ? format(customDateTo, 'MMM d, yyyy') : 'To date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent mode="single" selected={customDateTo} onSelect={setCustomDateTo} />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* The list — shared row shape */}
      <LeadList>
        <LeadListHeader />
        {filteredLeads.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Play className="mx-auto mb-3 h-10 w-10 opacity-20" />
            <p className="text-sm">No demo leads found</p>
            <p className="mt-1 text-xs">
              {showArchived
                ? 'Nothing has been archived yet.'
                : 'Leads captured from shared demo links will appear here.'}
            </p>
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <LeadListRow
              key={lead.id}
              className={cn(lead.archived_at && 'opacity-60')}
              onClick={() => navigate(`/admin/demo-leads/${lead.id}`)}
              syncSlot={<GHLSyncDot input={lead} />}
              name={formatName(lead.lead_name) || 'Unknown'}
              badgeSlot={<SourceBadge label="Demo" />}
              extraSlot={
                <>
                  <Badge variant="outline" className="text-[11px] font-normal">
                    {extractDemoName(lead.source_page)}
                  </Badge>
                  {lead.source_campaign && (
                    <Badge variant="secondary" className="font-mono text-[10px] font-normal">
                      {extractDemoId(lead.source_campaign)}
                    </Badge>
                  )}
                  <LeadOverlayOutcome source="ghl_submissions" id={lead.id} />
                  {lead.archived_at && (
                    <Badge variant="secondary" className="text-[10px]">Archived</Badge>
                  )}
                </>
              }
              contactLine={
                <>
                  {lead.lead_email}
                  {lead.lead_phone ? ` · ${lead.lead_phone}` : ''}
                </>
              }
              status={lead.ghl_status}
              statusLabel={leadStatusLabel({ source: 'ghl_submissions', status: lead.ghl_status })}
              ownerSlot={<LeadOverlayOwnerCell source="ghl_submissions" id={lead.id} />}
              whenSlot={
                <div className="text-right">
                  <div>{format(new Date(lead.created_at), 'MMM d, yyyy')}</div>
                  <div className="opacity-70">{format(new Date(lead.created_at), 'h:mm a')}</div>
                </div>
              }
              actionsSlot={
                <LegacyLeadActions
                  source="ghl_submissions"
                  id={lead.id}
                  name={formatName(lead.lead_name) || 'Unknown'}
                  email={lead.lead_email}
                  phone={lead.lead_phone}
                  status={lead.ghl_status}
                  createdAt={lead.created_at}
                  sourceUrl={lead.source_page}
                  raw={lead as unknown as Record<string, unknown>}
                />
              }
            />
          ))
        )}
      </LeadList>

    </div>
  );
}
