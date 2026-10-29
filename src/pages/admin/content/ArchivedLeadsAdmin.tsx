import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { format, isWithinInterval, startOfDay, endOfDay, subDays, startOfWeek } from 'date-fns';
import { Archive, ArchiveRestore, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import AccessDenied from '@/components/admin/AccessDenied';
import { LeadPanelErrorState } from '@/components/admin/LeadPanelErrorState';
import { AdminMetricsStrip } from '@/components/admin/AdminMetricsStrip';
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminActionsRow } from "@/components/admin/AdminActionsRow";
import { useLeadOverlayData } from "@/hooks/useLeadOverlay";
import { useSalesReps } from "@/hooks/useSalesReps";
import { ownerName } from "@/components/admin/leads/ownerName";
import { LeadList, LeadListHeader, LeadListRow } from '@/components/admin/leads/LeadListRow';
import { LeadOverlayOwnerCell } from '@/components/admin/leads/LeadOverlayOwnerCell';
import { SourceBadge } from '@/components/admin/leads/SourceBadge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePermissions } from '@/hooks/usePermissions';
import { useArchivedLeads, archivedAtOf } from '@/hooks/useArchivedLeads';
import { matchesLeadSearch, optionsFromData } from '@/lib/leadSearch';
import { restoreLead, LEGACY_LIST_KEYS } from '@/lib/leadArchive';
import { recordRouteForLead } from '@/lib/leadAdminLinks';
import { LEAD_SOURCE_META, leadStatusLabel, leadKey, UnifiedLead } from '@/lib/unifiedLead';
import { formatName } from '@/lib/textFormatting';
import { cn } from '@/lib/utils';

/**
 * Archived leads — the one place archived rows are visible and restorable.
 *
 * Only `ghl_submissions`, `leads` and `alpha_digital_leads` have an
 * `archived_at` column, so only those three sources can appear here.
 */

const DATE_RANGES = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Archived today' },
  { value: 'week', label: 'This week' },
  { value: '7d', label: 'Last 7 days' },

  { value: '30d', label: 'Last 30 days' },
];

export default function ArchivedLeadsAdmin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canViewLeads } = usePermissions();

  const { data, isLoading, isError, isFetching, refetch } = useArchivedLeads();
  const leads = data?.leads ?? [];

  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [restoreTarget, setRestoreTarget] = useState<UnifiedLead | null>(null);
  const { data: overlay } = useLeadOverlayData();
  const { data: salesReps = [] } = useSalesReps();
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [restoring, setRestoring] = useState(false);

    const ownerNameFor = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const a of overlay?.annotations ?? []) {
      if (!a.owner_id) continue;
      const name = ownerName(a.owner_id, salesReps);
      if (name) byKey.set(leadKey(a.lead_source, a.lead_id), name);
    }
    return (source: string, id: string) => byKey.get(leadKey(source, id)) ?? null;
  }, [overlay, salesReps]);

  const matchesDateRange = (dateStr: string | null) => {
    if (dateRange === 'all' || !dateStr) return dateRange === 'all';
    const d = new Date(dateStr);
    if (dateRange === 'today')
      return isWithinInterval(d, { start: startOfDay(new Date()), end: endOfDay(new Date()) });
    // 'week' is the Mon–Sun window the strip's last tile counts.
    if (dateRange === 'week') return d.getTime() >= startOfWeek(new Date(), { weekStartsOn: 1 }).getTime();
    if (dateRange === '7d')
      return isWithinInterval(d, { start: subDays(new Date(), 7), end: new Date() });
    if (dateRange === '30d')
      return isWithinInterval(d, { start: subDays(new Date(), 30), end: new Date() });
    return true;
  };

  const filtered = useMemo(
    () =>
      leads.filter((lead) => {
                if (ownerFilter !== "all") {
          const name = ownerNameFor(lead.source, lead.id);
          if (ownerFilter === "__unassigned") {
            if (name) return false;
          } else if (name !== ownerFilter) {
            return false;
          }
        }

        if (
          !matchesLeadSearch(searchQuery, {
            text: [lead.name, lead.email, lead.company, LEAD_SOURCE_META[lead.source]?.label],
            phones: [lead.phone],
          })
        )
          return false;
        if (sourceFilter !== 'all' && lead.source !== sourceFilter) return false;
        return matchesDateRange(archivedAtOf(lead));
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [leads, searchQuery, sourceFilter, dateRange],
  );

  /** Monday 00:00 of the current week — the strip's time-window tile. */
  const weekStart = useMemo(() => {
    const d = new Date();
    return startOfWeek(d, { weekStartsOn: 1 }).getTime();
  }, []);

  const archivedCounts = useMemo(() => {
    const now = Date.now();
    let week = 0;
    let month = 0;
    let unassigned = 0;
    for (const l of leads) {
      const at = archivedAtOf(l);
      const t = at ? new Date(at).getTime() : NaN;
      if (!Number.isNaN(t)) {
        if (t >= weekStart) week += 1;
        if (now - t <= 30 * 24 * 60 * 60 * 1000) month += 1;
      }
      if (!ownerNameFor(l.source, l.id)) unassigned += 1;
    }
    return { week, month, unassigned };
  }, [leads, weekStart, ownerNameFor]);

  const clearAll = () => {
    setSearchQuery('');
    setSourceFilter("all");
    setDateRange("all");
    setOwnerFilter("all");
  };

  const confirmRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      await restoreLead(restoreTarget);
      toast.success(`${restoreTarget.name || 'Lead'} restored to the inbox`);
      setRestoreTarget(null);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['unified-leads'] });
      LEGACY_LIST_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    } catch (error) {
      console.error('Restore failed:', error);
      toast.error(
        'Could not restore this lead. Try again, or email support@alfredai.bot with this page URL and a screenshot.',
      );
    } finally {
      setRestoring(false);
    }
  };

  if (!canViewLeads) return <AccessDenied />;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isError && <LeadPanelErrorState panelName="Archived leads" />}

      <AdminPageHeader
        title="Archived Leads"
        icon={<Archive className="h-5 w-5 text-primary" />}
        description="Leads removed from the inbox. Restore one to put it back for everyone."
      />

      {/*
        Four tiles, all clickable. "Restorable" isn't one of them: every
        archived lead can be restored, so that tile would just repeat Total.
        Unassigned is the useful third split — archived leads with no owner are
        the ones nobody is accountable for if they come back.
      */}
      <AdminMetricsStrip
        metrics={[
          {
            value: leads.length,
            label: 'Total archived',
            onClick: clearAll,
            active: dateRange === 'all' && ownerFilter === 'all' && sourceFilter === 'all' && !searchQuery,
          },
          {
            value: archivedCounts.unassigned,
            label: 'Unassigned',
            tone: 'warn',
            onClick: () => setOwnerFilter(ownerFilter === '__unassigned' ? 'all' : '__unassigned'),
            active: ownerFilter === '__unassigned',
          },
          {
            value: archivedCounts.month,
            label: 'Last 30 days',
            onClick: () => setDateRange(dateRange === '30d' ? 'all' : '30d'),
            active: dateRange === '30d',
          },
          {
            value: archivedCounts.week,
            label: 'This week',
            onClick: () => setDateRange(dateRange === 'week' ? 'all' : 'week'),
            active: dateRange === 'week',
          },
        ]}
      />

      <AdminActionsRow
        actions={[
          {
            key: "refresh",
            label: "Refresh",
            icon: <RefreshCw className="h-3.5 w-3.5" />,
            onClick: () => refetch(),
            loading: isFetching,
          },
        ]}
        className="mt-4"
      />

      <AdminToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search name, email, company, phone…"
        resultCount={filtered.length}
        resultNoun="archived lead"
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
              ...optionsFromData(leads, (l) => ownerNameFor(l.source, l.id)),
            ],
          },
          {
            key: 'source',
            label: 'Source',
            value: sourceFilter,
            onChange: setSourceFilter,
            width: 'w-[170px]',
            options: [
              { value: 'all', label: 'All sources' },
              ...optionsFromData(
                leads,
                (l) => l.source,
                (v) => LEAD_SOURCE_META[v as UnifiedLead['source']]?.label ?? v,
              ),
            ],
          },
          {
            key: 'date',
            label: 'Archived',
            value: dateRange,
            onChange: setDateRange,
            width: 'w-[160px]',
            options: DATE_RANGES,
          },
        ]}
        onClearAll={clearAll}
      />

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <Archive className="mx-auto mb-3 h-10 w-10 opacity-20" />
          <p className="font-medium">Nothing archived</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {leads.length === 0
              ? 'Archived leads will appear here, where you can restore them.'
              : 'No archived leads match your filters.'}
          </p>
        </div>
      ) : (
        <LeadList>
          <LeadListHeader whenLabel="Archived" />
          {filtered.map((lead) => {
            const archivedAt = archivedAtOf(lead);
            return (
              <LeadListRow
                key={`${lead.source}:${lead.id}`}
                onClick={() => navigate(recordRouteForLead(lead).path)}
                name={formatName(lead.name) || lead.email || 'Unknown'}
                badgeSlot={
                  <SourceBadge label={LEAD_SOURCE_META[lead.source]?.label ?? lead.source} />
                }
                status={lead.status}
                statusLabel={leadStatusLabel(lead)}
                contactLine={
                  <span className="flex flex-wrap items-center gap-x-2">
                    {lead.email && <span className="truncate">{lead.email}</span>}
                    {lead.phone && (
                      <>
                        <span aria-hidden>·</span>
                        <span>{lead.phone}</span>
                      </>
                    )}
                    {lead.company && (
                      <>
                        <span aria-hidden>·</span>
                        <span className="truncate">{lead.company}</span>
                      </>
                    )}
                  </span>
                }
                ownerSlot={<LeadOverlayOwnerCell source={lead.source} id={lead.id} />}
                whenSlot={archivedAt ? format(new Date(archivedAt), 'MMM d, yyyy HH:mm') : '—'}
                actionsSlot={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    aria-label={`Restore ${lead.name || 'lead'}`}
                    onClick={() => setRestoreTarget(lead)}
                  >
                    <ArchiveRestore className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Restore</span>
                  </Button>
                }
              />
            );
          })}
        </LeadList>
      )}

      <AlertDialog open={!!restoreTarget} onOpenChange={(open) => !open && setRestoreTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              {restoreTarget?.name || restoreTarget?.email || 'This lead'} will go back into
              everyone's inbox and appear on its source page again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmRestore();
              }}
              disabled={restoring}
            >
              {restoring ? 'Restoring…' : 'Restore'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>

      </AlertDialog>
    </div>
  );
}
