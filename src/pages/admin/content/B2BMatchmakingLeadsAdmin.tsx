import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Loader2, Handshake, RefreshCw, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { useUnifiedLeads } from '@/hooks/useUnifiedLeads';
import { inSegment } from '@/lib/leadSegments';
import { LeadPanelErrorState } from '@/components/admin/LeadPanelErrorState';
import AccessDenied from '@/components/admin/AccessDenied';
import { CONTACT_INFO } from '@/lib/contactInfo';
import { PushB2bLeadToGhlButton } from '@/components/admin/leads/PushB2bLeadToGhlButton';
import { AdminMetricsStrip } from '@/components/admin/AdminMetricsStrip';
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminToolbar } from '@/components/admin/AdminToolbar';
import { AdminActionsRow } from '@/components/admin/AdminActionsRow';
import { LeadList, LeadListHeader, LeadListRow } from '@/components/admin/leads/LeadListRow';
import { LeadOwnerCell } from '@/components/admin/leads/LeadOwnerCell';
import { SourceBadge } from '@/components/admin/leads/SourceBadge';
import { leadKey, leadStatusLabel } from "@/lib/unifiedLead";
import { useLeadOverlayData } from "@/hooks/useLeadOverlay";
import { optionsFromData } from "@/lib/leadSearch";
import { ownerName } from '@/components/admin/leads/ownerName';
import { useSalesReps } from '@/hooks/useSalesReps';

const asObj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' ? (v as Record<string, unknown>) : {};

const safeUrl = (v?: string | null): string | null => {
  if (!v) return null;
  const trimmed = String(v).trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
};

export default function B2BMatchmakingLeadsAdmin() {
  const { canViewLeads } = usePermissions();
  const { data, isLoading, isError, refetch, isRefetching } = useUnifiedLeads();
  const [search, setSearch] = useState("");
  const { data: overlay } = useLeadOverlayData();
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [callsOnly, setCallsOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState<'all' | 'week'>('all');
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const navigate = useNavigate();
  const { data: reps = [] } = useSalesReps();

    const ownerNameFor = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const a of overlay?.annotations ?? []) {
      if (!a.owner_id) continue;
      const name = ownerName(a.owner_id, reps);
      if (name) byKey.set(leadKey(a.lead_source, a.lead_id), name);
    }
    return (source: string, id: string) => byKey.get(leadKey(source, id)) ?? null;
  }, [overlay, reps]);

  const leads = useMemo(() => {
    const list = data?.leads ?? [];
    return list
      .filter((l) => inSegment(l, 'matchmaking'))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [data?.leads]);

  /** Monday 00:00 of the current week — the strip's time-window tile. */
  const weekStart = useMemo(() => {
    const d = new Date();
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (ownerFilter !== "all") {
        const name = ownerNameFor(l.source, l.id);
        if (ownerFilter === "__unassigned") {
          if (name) return false;
        } else if (name !== ownerFilter) {
          return false;
        }
      }
      if (callsOnly && !asObj(asObj(l.raw).ghl_response).requested_call) return false;
      if (unassignedOnly && ownerNameFor(l.source, l.id)) return false;
      if (statusFilter !== 'all' && (l.status ?? '') !== statusFilter) return false;
      if (timeFilter === 'week' && new Date(l.created_at).getTime() < weekStart) return false;
      if (!q) return true;
      const raw = asObj(l.raw);
      const hay = `${l.name} ${l.email ?? ''} ${l.company ?? ''} ${l.phone ?? ''} ${raw.job_title ?? ''} ${raw.message ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [leads, search, callsOnly, statusFilter, timeFilter, unassignedOnly, ownerFilter, ownerNameFor, weekStart]);

  const mailtoError = `mailto:${CONTACT_INFO.email.support}?subject=${encodeURIComponent(
    'B2B Matchmaking Leads error',
  )}&body=${encodeURIComponent(
    `Couldn't load B2B Matchmaking leads.\n\nPage: ${
      typeof window !== 'undefined' ? window.location.href : ''
    }\n\n(Please attach a screenshot.)`,
  )}`;

  if (!canViewLeads) return <AccessDenied />;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isError && <LeadPanelErrorState panelName="B2B Matchmaking leads" />}

      <AdminPageHeader
        title="B2B Matchmaking Leads"
        icon={<Handshake className="h-5 w-5 text-primary" />}
        description="Email replies to the alfred ai B2B Matchmaking App outreach"
      />

      <AdminMetricsStrip
        metrics={[
          {
            value: leads.length,
            label: 'Total replies',
            onClick: () => { setSearch(''); setCallsOnly(false); setStatusFilter('all'); setTimeFilter('all'); setUnassignedOnly(false); setOwnerFilter('all'); },
            active: !callsOnly && !unassignedOnly && timeFilter === 'all' && statusFilter === 'all',
          },
          {
            value: leads.filter((l) => asObj(asObj(l.raw).ghl_response).requested_call).length,
            label: 'Requested a call',
            tone: 'accent',
            onClick: () => setCallsOnly((v) => !v),
            active: callsOnly,
          },
          {
            value: leads.filter((l) => !ownerNameFor(l.source, l.id)).length,
            label: 'Unassigned',
            tone: 'warn',
            onClick: () => setUnassignedOnly((v) => !v),
            active: unassignedOnly,
          },
          {
            value: leads.filter((l) => new Date(l.created_at).getTime() >= weekStart).length,
            label: 'This week',
            onClick: () => setTimeFilter((v) => (v === 'week' ? 'all' : 'week')),
            active: timeFilter === 'week',
          },
        ]}
      />

      <AdminActionsRow
        actions={[
          {
            key: "refresh",
            label: "Refresh",
            icon: <RefreshCw className="h-3.5 w-3.5" />,
            onClick: () => {
              refetch();
              toast.success("Refreshing leads…");
            },
            loading: isRefetching,
          },
        ]}
        className="mt-4"
      />

      <AdminToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, email, company, title, message…"
        filters={[
          {
            key: "owner",
            label: "Owner",
            value: ownerFilter,
            onChange: setOwnerFilter,
            options: [
              { value: "all", label: "All owners" },
              { value: "__unassigned", label: "Unassigned" },
              ...optionsFromData(leads, (l) => ownerNameFor(l.source, l.id)),
            ],
          },
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            width: "w-[160px]",
            options: [
              { value: "all", label: "All statuses" },
              ...optionsFromData(leads, (l) => l.status ?? null),
            ],
          },
        ]}
        resultCount={filtered.length}
        resultNoun="reply"
        onClearAll={() => { setSearch(""); setCallsOnly(false); setOwnerFilter("all"); setStatusFilter("all"); setTimeFilter("all"); setUnassignedOnly(false); }}
        
      />

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {leads.length === 0 ? (
              <>
                No B2B Matchmaking replies yet. Manually-added replies with
                <code className="mx-1 px-1 rounded bg-muted">source_campaign = 'alfred_b2b_matchmaking'</code>
                will appear here.
              </>
            ) : (
              <>No leads match your search. <button className="underline" onClick={() => setSearch('')}>Clear search</button></>
            )}
            <div className="mt-3">
              <Button asChild variant="outline" size="sm" className="min-h-[44px]">
                <a href={mailtoError}>Email us a problem</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <LeadList>
          <LeadListHeader whenLabel="Replied" />
          {filtered.map((l) => {
            const raw = asObj(l.raw);
            const resp = asObj(raw.ghl_response);
            const jobTitle = raw.job_title as string | undefined;
            const websiteHref = safeUrl((resp.website as string | undefined) ?? (raw.website as string | undefined));
            const requestedCall = resp.requested_call as string | undefined;
            const timeline = resp.timeline as string | undefined;
            return (
              <LeadListRow
                key={l.id}
                onClick={() => navigate(`/admin/b2b-matchmaking-leads/${l.id}`)}
                name={l.name}
                badgeSlot={<SourceBadge label="B2B" />}
                extraSlot={
                  <>
                    {requestedCall && (
                      <Badge variant="outline" className="text-[10px] font-normal bg-primary/10 text-primary border-primary/20">
                        Call: {requestedCall}
                      </Badge>
                    )}
                    {timeline && <Badge variant="outline" className="text-[10px] font-normal">{timeline}</Badge>}
                    {websiteHref && (
                      <a href={websiteHref} target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-primary hover:underline">
                        <Globe className="h-3 w-3" /> Website
                      </a>
                    )}
                  </>
                }
                contactLine={
                  <span className="flex flex-wrap items-center gap-x-2">
                    {l.email && <span className="truncate">{l.email}</span>}
                    {l.phone && (<><span aria-hidden>·</span><span>{l.phone}</span></>)}
                    {l.company && (<><span aria-hidden>·</span><span className="truncate">{l.company}</span></>)}
                    {jobTitle && (<><span aria-hidden>·</span><span className="truncate">{jobTitle}</span></>)}
                  </span>
                }
                status={l.status}
                statusLabel={leadStatusLabel(l)}
                ownerSlot={
                  <LeadOwnerCell
                    owner={l.annotation?.owner_id ? { id: l.annotation.owner_id, name: ownerName(l.annotation.owner_id, reps) ?? 'Owner' } : null}
                    noteCount={l.notesCount ?? 0}
                  />
                }
                whenSlot={format(new Date(l.created_at), 'd MMM yyyy, h:mma')}
                actionsSlot={
                  l.ghl_contact_id
                    ? <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-700 dark:text-emerald-400">In GHL</Badge>
                    : <PushB2bLeadToGhlButton lead={l} size="sm" variant="default" />
                }
              />
            );
          })}
        </LeadList>
      )}
    </div>
  );
}
