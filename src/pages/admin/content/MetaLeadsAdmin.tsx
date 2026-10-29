import { useEffect, useMemo, useState } from "react";
import { MetaAttributionAudit } from '@/components/admin/leads/MetaAttributionAudit';
import { useNavigate } from "react-router-dom";
import { useRecordDeepLink } from "@/hooks/useRecordDeepLink";
import { useBookedFromAds } from "@/hooks/useBookedFromAds";
import { SourceBadge } from "@/components/admin/leads/SourceBadge";
import { LegacyLeadActions } from "@/components/admin/leads/LegacyLeadActions";
import { AdminToolbar, type ToolbarFilter } from "@/components/admin/AdminToolbar";
import { AdminActionsRow } from "@/components/admin/AdminActionsRow";
import { AdminMetricsStrip, type AdminMetric } from "@/components/admin/AdminMetricsStrip";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { LeadList, LeadListHeader, LeadListRow } from "@/components/admin/leads/LeadListRow";
import { LeadOverlayOwnerCell, LeadOverlayOutcome } from "@/components/admin/leads/LeadOverlayOwnerCell";
import { ownerName } from "@/components/admin/leads/ownerName";
import { matchesLeadSearch, optionsFromData } from "@/lib/leadSearch";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { leadStatusLabel } from "@/lib/unifiedLead";
import { capitalizeText, formatName } from "@/lib/textFormatting";
import { useLeadOverlayData } from "@/hooks/useLeadOverlay";
import { useSalesReps } from "@/hooks/useSalesReps";
import { leadKey } from "@/lib/unifiedLead";
import AccessDenied from "@/components/admin/AccessDenied";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Download, RefreshCw, Megaphone, AlertCircle } from "lucide-react";

interface MetaLead {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  form_name: string | null;
  form_id: string | null;
  campaign_id: string | null;
  ad_id: string | null;
  client: string | null;
  status: string;
  submitted_at: string | null;
  created_at: string;
  raw_payload: unknown;
  notification_status: string | null;
  notification_sent_at: string | null;
  notification_error: string | null;
  /** Set once the lead reaches GoHighLevel — the closest thing this table has
   *  to "we can actually work this one". */
  ghl_contact_id: string | null;
}

const SUPPORT_EMAIL = "hello@alfredai.bot";

/** Canonical pipeline values — used by the status editor, NOT by the filter.
 *  The filter is built from the rows on screen so it can never offer a status
 *  that matches nothing (the bug that made the Booked filters look broken). */
const STATUSES = ["new", "contacted", "qualified", "converted"] as const;

const getMetaLeadAdUrl = (adId: string | null) => {
  if (!adId) return null;
  return `https://www.facebook.com/ads/library/?id=${encodeURIComponent(adId)}`;
};

/** Pull "what made them click" copy out of the raw Meta payload. */
const getAdInfo = (l: MetaLead) => {
  const p = (l.raw_payload && typeof l.raw_payload === "object" ? l.raw_payload : {}) as Record<
    string,
    any
  >;
  return {
    adName: (p.ad_name ?? p.adName ?? p.ad?.name ?? null) as string | null,
    adSetName: (p.adset_name ?? p.adSetName ?? p.adset?.name ?? null) as string | null,
    campaignName: (p.campaign_name ?? p.campaignName ?? p.campaign?.name ?? null) as string | null,
    platform: (p.platform ?? p.publisher_platform ?? null) as string | null,
    headline: (p.ad_headline ?? p.headline ?? p.creative?.title ?? p.creative?.body ?? null) as
      | string
      | null,
  };
};

const campaignLabelOf = (l: MetaLead) => getAdInfo(l).campaignName ?? l.campaign_id ?? "";

export default function MetaLeadsAdmin() {
  const navigate = useNavigate();
  const { canViewLeads, canExportLeads } = usePermissions();
  const { data: overlay } = useLeadOverlayData();
  const { data: salesReps = [] } = useSalesReps();
  const [ownerFilter, setOwnerFilter] = useState<string>("all");

  const ownerNameFor = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const a of overlay?.annotations ?? []) {
      if (a.lead_source !== "meta_leads" || !a.owner_id) continue;
      const name = ownerName(a.owner_id, salesReps);
      if (name) byKey.set(leadKey(a.lead_source, a.lead_id), name);
    }
    return (id: string) => byKey.get(leadKey("meta_leads", id)) ?? null;
  }, [overlay, salesReps]);
  const [leads, setLeads] = useState<MetaLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [notifyFilter, setNotifyFilter] = useState("all");
  const [bookedOnly, setBookedOnly] = useState(false);
  // Declared with the other page state: both the filter predicate and the stats
  // below read it, and the predicate comes first.
  const bookedContactIds = useBookedFromAds();
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusEdit, setStatusEdit] = useState<MetaLead | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  useRecordDeepLink({
    records: leads,
    ready: !loading,
    getId: (l) => l.id,
    onOpen: (l) => navigate(`/admin/meta-leads/${l.id}`),
  });

  const fetchLeads = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("meta_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setLeads((data as MetaLead[]) || []);
      setLoadError(null);
    } catch (err) {
      console.error("Error loading Meta leads:", err);
      setLoadError("We could not load Meta leads. Please refresh, or email us if it persists.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const info = getAdInfo(l);
      if (
        !matchesLeadSearch(searchQuery, {
          text: [l.full_name, l.email, l.form_name, l.client, info.adName, info.campaignName],
          phones: [l.phone],
        })
      ) {
        return false;
      }
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (clientFilter !== "all" && l.client !== clientFilter) return false;
      if (campaignFilter !== "all" && campaignLabelOf(l) !== campaignFilter) return false;
      if (notifyFilter !== "all" && (l.notification_status ?? "none") !== notifyFilter) return false;
      // The "Booked from ads" tile filters the list, it does not just count.
      if (bookedOnly && !(l.ghl_contact_id && bookedContactIds.has(String(l.ghl_contact_id)))) {
        return false;
      }

      if (ownerFilter !== "all") {
        const name = ownerNameFor(l.id);
        if (ownerFilter === "__unassigned") {
          if (name) return false;
        } else if (name !== ownerFilter) {
          return false;
        }
      }

      const when = l.submitted_at ?? l.created_at;
      if (dateFrom && when && new Date(when) < new Date(dateFrom)) return false;
      if (dateTo && when) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(when) > end) return false;
      }
      return true;
    });
  }, [leads, searchQuery, statusFilter, clientFilter, campaignFilter, notifyFilter, ownerFilter, ownerNameFor, dateFrom, dateTo, bookedOnly, bookedContactIds]);

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      total: leads.length,
      // A lead that reached GoHighLevel is one we can actually work. This is
      // the closest honest reading of the deck's "Booked from ads" with the
      // data we hold: meta_leads has no booking field of its own.
      inGhl: leads.filter((l) => Boolean(l.ghl_contact_id)).length,
      alertFailed: leads.filter((l) => l.notification_status === "failed").length,
      // A booking lives in ghl_submissions, not here, so it is matched back by
      // contact id. See useBookedFromAds for why that set is paged.
      bookedFromAds: leads.filter(
        (l) => l.ghl_contact_id && bookedContactIds.has(String(l.ghl_contact_id)),
      ).length,
      thisWeek: leads.filter((l) => {
        const t = new Date(l.submitted_at ?? l.created_at ?? 0).getTime();
        return Number.isFinite(t) && t >= weekAgo;
      }).length,
    };
  }, [leads, bookedContactIds]);

  // Every Leads Page 04 asks for Leads · Campaigns · Booked from ads · This week.
  //
  // "Booked from ads" is in, and it is the number this page was missing: 364 of
  // these leads have a real booking behind them.
  //
  // "Reached GHL" came out. It read 1,521 — the exact total, because every Meta
  // lead arrives through GoHighLevel — and a tile that always equals the total
  // cannot tell anyone anything. The Standard's rule is that a tile is a filter,
  // not a statistic.
  //
  // Campaigns stays OFF the strip, but the earlier reason for that was wrong.
  // It said campaign_id was null on every row so the tile would read 0. The
  // column was empty; the DATA was not — campaign and campaignId sat inside
  // raw_payload.lastAttributionSource on 1,435 of 1,521 rows the whole time,
  // and are now extracted into the columns. The real reason is simpler: there
  // is exactly ONE campaign, so the tile would read 1 and clicking it would
  // filter to everything. It belongs as a FILTER, which is where it now is, and
  // becomes a tile the day a second campaign exists.
  //
  // The old "New — not worked yet" and "Converted" tiles are gone for the same
  // reason: status is written once at capture and never advances, so the first
  // always equalled the total and the second always read 0.
  const metrics: AdminMetric[] = [
    { value: stats.total, label: "Leads" },
    {
      value: stats.bookedFromAds,
      label: "Booked from ads",
      tone: "good",
      onClick: () => setBookedOnly((v) => !v),
      active: bookedOnly,
    },
    {
      value: stats.alertFailed,
      label: "Alert failed to send",
      tone: "warn",
      onClick: () => setNotifyFilter(notifyFilter === "failed" ? "all" : "failed"),
      active: notifyFilter === "failed",
    },
    {
      value: stats.thisWeek,
      label: "This week",
      tone: "accent",
      onClick: () => {
        const iso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        setDateFrom(dateFrom === iso ? "" : iso);
        setDateTo("");
      },
      active: Boolean(dateFrom) && !dateTo,
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
      key: "status",
      label: "Status",
      value: statusFilter,
      onChange: setStatusFilter,
      width: "w-[140px]",
      options: [
        { value: "all", label: "All statuses" },
        ...optionsFromData(leads, (l) => l.status, (v) => capitalizeText(v)),
      ],
    },
    {
      key: "client",
      label: "Client",
      value: clientFilter,
      onChange: setClientFilter,
      width: "w-[140px]",
      options: [{ value: "all", label: "All clients" }, ...optionsFromData(leads, (l) => l.client)],
    },
    {
      key: "campaign",
      label: "Campaign",
      value: campaignFilter,
      onChange: setCampaignFilter,
      width: "w-[190px]",
      options: [
        { value: "all", label: "All campaigns" },
        ...optionsFromData(leads, (l) => campaignLabelOf(l) || null),
      ],
    },
  ];

  const clearAll = () => {
    setSearchQuery("");
    setOwnerFilter("all");
    setStatusFilter("all");
    setClientFilter("all");
    setCampaignFilter("all");
    setNotifyFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  

  const updateStatus = async (lead: MetaLead, status: string) => {
    setSavingStatus(true);
    try {
      const { error } = await supabase.from("meta_leads").update({ status }).eq("id", lead.id);
      if (error) throw error;
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status } : l)));
      toast.success("Status updated");
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Could not update status. Please try again.");
    } finally {
      setSavingStatus(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Form", "Client", "Status", "Campaign", "Ad", "Submitted"];
    const rows = filtered.map((l) => {
      const info = getAdInfo(l);
      return [
        formatName(l.full_name) || "",
        l.email || "",
        l.phone || "",
        l.form_name || "",
        l.client || "",
        l.status || "",
        campaignLabelOf(l),
        info.adName || l.ad_id || "",
        l.submitted_at ? format(new Date(l.submitted_at), "yyyy-MM-dd HH:mm") : "",
      ];
    });
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meta-leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };


  const adminActions = [
    {
      key: "refresh",
      label: "Refresh",
      icon: <RefreshCw className="h-3.5 w-3.5" />,
      onClick: () => fetchLeads(true),
      loading: refreshing,
    },
    {
      key: "export",
      label: "Export",
      icon: <Download className="h-3.5 w-3.5" />,
      onClick: exportToCSV,
      allowed: canExportLeads,
    },
  ];

  if (!canViewLeads) return <AccessDenied />;

  return (
    <div className="min-w-0 space-y-4">
      <AdminPageHeader
        title="Meta Lead Ads"
        icon={<Megaphone className="h-5 w-5 text-primary" />}
        description="Leads captured from your Facebook &amp; Instagram lead forms"
      />

      {loadError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="text-sm">
              <p className="font-medium">{loadError}</p>
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                  "Meta leads error",
                )}&body=${encodeURIComponent(
                  `Page: ${window.location.href}\n\nPlease describe what happened and attach a screenshot.`,
                )}`}
                className="mt-1 inline-block text-primary underline"
              >
                Email us about this error
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics — the tiles are filters */}
      <AdminMetricsStrip metrics={metrics} />

      <MetaAttributionAudit />
      <AdminActionsRow actions={adminActions} />

      {/* Search + filters */}
            <AdminToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search name, email, phone, campaign, ad…"
        filters={filters}
        onClearAll={clearAll}
        resultCount={filtered.length}
        resultNoun="lead"
        actions={
          <>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 w-[145px] text-xs"
              aria-label="From date"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 w-[145px] text-xs"
              aria-label="To date"
            />
          </>
        }
      />

      {/* The list — shared row shape */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <LeadList>
          <LeadListHeader whenLabel="Submitted" />
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Megaphone className="mx-auto mb-3 h-10 w-10 opacity-20" />
              <p className="text-sm">No Meta leads found</p>
              <p className="mt-1 text-xs">
                New Meta lead form submissions appear here automatically.
              </p>
            </div>
          ) : (
            filtered.map((lead) => {
              const info = getAdInfo(lead);
              const campaign = campaignLabelOf(lead);
              const when = lead.submitted_at ?? lead.created_at;
              return (
                <LeadListRow
                  key={lead.id}
                  onClick={() => navigate(`/admin/meta-leads/${lead.id}`)}
                  name={formatName(lead.full_name) || "Unknown"}
                  badgeSlot={<SourceBadge label="Meta" />}
                  extraSlot={
                    <>
                      {lead.client && (
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {lead.client}
                        </Badge>
                      )}
                      {campaign && (
                        <Badge
                          variant="secondary"
                          className="max-w-[190px] truncate text-[10px] font-normal"
                          title={[campaign, info.adName].filter(Boolean).join(" · ")}
                        >
                          {campaign}
                        </Badge>
                      )}
                      {/* Only a FAILED alert earns a badge. "Sent" on every row is
                          noise that trains you to stop reading the column. */}
                      {lead.notification_status === "failed" && (
                        <Badge
                          variant="outline"
                          className="border-[hsl(var(--status-blocked)/0.35)] bg-[hsl(var(--status-blocked-surface))] text-[10px] font-normal text-[hsl(var(--status-blocked))]"
                          title={lead.notification_error ?? "The alert email failed to send"}
                        >
                          Alert failed
                        </Badge>
                      )}
                      <LeadOverlayOutcome source="meta_leads" id={lead.id} />
                    </>
                  }
                  contactLine={
                    <>
                      {lead.email || "No email on file"}
                      {lead.phone ? ` · ${lead.phone}` : ""}
                      {info.platform ? ` · ${capitalizeText(info.platform)}` : ""}
                    </>
                  }
                  status={lead.status}
                  statusLabel={leadStatusLabel({ source: "meta_leads", status: lead.status })}
                  ownerSlot={<LeadOverlayOwnerCell source="meta_leads" id={lead.id} />}
                  whenSlot={
                    <div className="text-right">
                      <div>{format(new Date(when), "d MMM yyyy")}</div>
                      <div className="opacity-70">{lead.form_name || "—"}</div>
                    </div>
                  }
                  actionsSlot={
                    <LegacyLeadActions
                      source="meta_leads"
                      id={lead.id}
                      name={formatName(lead.full_name) || "Unknown lead"}
                      email={lead.email}
                      phone={lead.phone}
                      company={null}
                      status={lead.status}
                      createdAt={when}
                      sourceUrl={getMetaLeadAdUrl(lead.ad_id)}
                      raw={
                        lead.raw_payload && typeof lead.raw_payload === "object"
                          ? (lead.raw_payload as Record<string, unknown>)
                          : undefined
                      }
                      onEdit={() => setStatusEdit(lead)}
                    />
                  }
                />
              );
            })
          )}
        </LeadList>
      )}


      {/* Focused status edit — the only capability from the old dialog that
          isn't already in the shared "…" menu. */}
      <Dialog open={!!statusEdit} onOpenChange={(o) => !o && setStatusEdit(null)}>
        <DialogContent className="w-[95vw] sm:max-w-sm">
          {statusEdit && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Meta status</DialogTitle>
                <DialogDescription>
                  {formatName(statusEdit.full_name) || "Meta lead"} — update pipeline status.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2 space-y-2">
                <Select
                  value={statusEdit.status}
                  onValueChange={async (v) => {
                    await updateStatus(statusEdit, v);
                    setStatusEdit(null);
                  }}
                  disabled={savingStatus}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
