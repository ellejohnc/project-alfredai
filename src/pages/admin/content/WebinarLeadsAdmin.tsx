import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRecordDeepLink } from "@/hooks/useRecordDeepLink";
import { LeadOverlayBadges } from "@/components/admin/leads/LeadOverlayWidgets";
import { LegacyLeadActions } from "@/components/admin/leads/LegacyLeadActions";
import { SourceBadge } from "@/components/admin/leads/SourceBadge";
import { AdminMetricsStrip } from "@/components/admin/AdminMetricsStrip";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminActionsRow } from "@/components/admin/AdminActionsRow";
import { LeadList, LeadListHeader, LeadListRow } from "@/components/admin/leads/LeadListRow";
import { LeadOverlayOwnerCell } from "@/components/admin/leads/LeadOverlayOwnerCell";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { useLeadOverlayData } from "@/hooks/useLeadOverlay";
import { useSalesReps } from "@/hooks/useSalesReps";
import { ownerName } from "@/components/admin/leads/ownerName";
import { leadKey } from "@/lib/unifiedLead";
import { optionsFromData } from "@/lib/leadSearch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Loader2,
  Calendar,
  Download,
  RefreshCw,
  Sparkles,
  Plus,
} from "lucide-react";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import AccessDenied from "@/components/admin/AccessDenied";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatName } from "@/lib/textFormatting";
import { LeadPanelErrorState } from "@/components/admin/LeadPanelErrorState";

interface WebinarLead {
  id: string;
  webinar_slug: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  role: string | null;
  industry: string | null;
  country: string | null;
  business_size: string | null;
  turnover: string | null;
  ai_interest: string | null;
  repetitive_workflow: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
}

const DATE_RANGES = [
  { label: "All Time", value: "all" },
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
];

const WEBINAR_FIELDS: { key: keyof WebinarLead; label: string }[] = [
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "company", label: "Company" },
  { key: "role", label: "Role" },
  { key: "industry", label: "Industry" },
  { key: "country", label: "Country" },
  { key: "business_size", label: "Business Size" },
  { key: "turnover", label: "Annual Turnover" },
  { key: "ai_interest", label: "Biggest AI Interest" },
  { key: "repetitive_workflow", label: "Workflow to Improve" },
  { key: "webinar_slug", label: "Webinar Slug" },
  { key: "utm_source", label: "UTM Source" },
  { key: "utm_medium", label: "UTM Medium" },
  { key: "utm_campaign", label: "UTM Campaign" },
];

const emptyLeadForm = (): Partial<WebinarLead> => ({
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  company: "",
  role: "",
  industry: "",
  country: "",
  business_size: "",
  turnover: "",
  ai_interest: "",
  repetitive_workflow: "",
  webinar_slug: "",
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
});

export default function WebinarLeadsAdmin() {
  const navigate = useNavigate();
  const { canViewLeads, canExportLeads } = usePermissions();

  const [leads, setLeads] = useState<WebinarLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: overlay } = useLeadOverlayData();
  const { data: salesReps = [] } = useSalesReps();
  const [ownerFilter, setOwnerFilter] = useState<string>("all");

  const ownerNameFor = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const a of overlay?.annotations ?? []) {
      if (a.lead_source !== "webinar_registrations" || !a.owner_id) continue;
      const name = ownerName(a.owner_id, salesReps);
      if (name) byKey.set(leadKey(a.lead_source, a.lead_id), name);
    }
    return (id: string) => byKey.get(leadKey("webinar_registrations", id)) ?? null;
  }, [overlay, salesReps]);


  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [dateRange, setDateRange] = useState("all");
  const [webinarFilter, setWebinarFilter] = useState<string>('all');

  const [leadFormOpen, setLeadFormOpen] = useState(false);
  const [leadForm, setLeadForm] = useState<Partial<WebinarLead>>(emptyLeadForm());
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [savingLead, setSavingLead] = useState(false);
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);

  useRecordDeepLink({
    records: leads,
    ready: !loading,
    getId: (l) => l.id,
    onOpen: (l) => navigate(`/admin/webinar-leads/${l.id}`),
  });

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("webinar_registrations")
        .select(
          "id, webinar_slug, first_name, last_name, email, phone, company, role, industry, country, business_size, turnover, ai_interest, repetitive_workflow, utm_source, utm_medium, utm_campaign, created_at",
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
      setLoadError(false);
    } catch (error) {
      console.error("Error fetching webinar leads:", error);
      setLoadError(true);
      toast.error("Failed to load webinar leads");
    }
  };

  useEffect(() => {
    (async () => {
      await fetchLeads();
      setLoading(false);
    })();

    const channel = supabase
      .channel("webinar-leads-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "webinar_registrations" }, () => fetchLeads())
      .subscribe((status) => setIsRealtimeConnected(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLeads();
    setIsRefreshing(false);
    toast.success("Data refreshed");
  };

  const fullName = (lead: WebinarLead) =>
    formatName([lead.first_name, lead.last_name].filter(Boolean).join(" ")) || "Unknown";

  const openCreateLead = () => {
    setEditingLeadId(null);
    setLeadForm(emptyLeadForm());
    setLeadFormOpen(true);
  };

  const openEditLead = (lead: WebinarLead) => {
    setEditingLeadId(lead.id);
    setLeadForm({ ...lead });
    setLeadFormOpen(true);
  };

  const saveLead = async () => {
    if (!leadForm.email || !leadForm.email.includes("@")) {
      toast.error("A valid email is required");
      return;
    }
    setSavingLead(true);
    try {
      const payload: Record<string, unknown> = {};
      WEBINAR_FIELDS.forEach(({ key }) => {
        const val = (leadForm[key] as string | null) ?? "";
        payload[key] = val === "" ? null : val;
      });
      payload.email = leadForm.email;

      if (editingLeadId) {
        const { error } = await supabase
          .from("webinar_registrations")
          .update(payload)
          .eq("id", editingLeadId);
        if (error) throw error;
        toast.success("Lead updated");
      } else {
        const { error } = await supabase.from("webinar_registrations").insert(payload as never);
        if (error) throw error;
        toast.success("Lead created");
      }
      setLeadFormOpen(false);
      await fetchLeads();
    } catch (error) {
      console.error("Error saving lead:", error);
      toast.error("Failed to save lead. Please try again or email support with the page URL.");
    } finally {
      setSavingLead(false);
    }
  };

  const deleteLead = async () => {
    if (!deleteLeadId) return;
    try {
      const { error } = await supabase.from("webinar_registrations").delete().eq("id", deleteLeadId);
      if (error) throw error;
      toast.success("Lead deleted");
      await fetchLeads();
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("Failed to delete lead");
    } finally {
      setDeleteLeadId(null);
    }
  };

  const exportLeadsCSV = () => {
    const headers = [
      "First Name", "Last Name", "Email", "Phone", "Company", "Role", "Industry",
      "Country", "Business Size", "Turnover", "AI Interest", "Workflow to Improve", "Source", "Date",
    ];
    const rows = filteredLeads.map((lead) => [
      lead.first_name || "", lead.last_name || "", lead.email, lead.phone || "",
      lead.company || "", lead.role || "", lead.industry || "", lead.country || "",
      lead.business_size || "", lead.turnover || "", lead.ai_interest || "",
      lead.repetitive_workflow || "", lead.utm_source || "",
      format(new Date(lead.created_at), "yyyy-MM-dd HH:mm"),
    ]);
    downloadCSV(headers, rows, "webinar-leads");
  };

  const downloadCSV = (headers: string[], rows: string[][], name: string) => {
    if (rows.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  const matchesDateRange = (dateStr: string) => {
    const d = new Date(dateStr);
    if (dateRange === "today") return isWithinInterval(d, { start: startOfDay(new Date()), end: endOfDay(new Date()) });
    if (dateRange === "7d") return isWithinInterval(d, { start: subDays(new Date(), 7), end: new Date() });
    if (dateRange === "30d") return isWithinInterval(d, { start: subDays(new Date(), 30), end: new Date() });
    return true;
  };

  const webinarOptions = Array.from(new Set(leads.map((l) => l.webinar_slug).filter((s): s is string => !!s))).sort();

  const filteredLeads = leads.filter((lead) => {
    const searchLower = searchQuery.trim().toLowerCase();
    const digits = searchLower.replace(/\D/g, '');
    const phone = lead.phone ?? '';
    const matchesSearch =
      !searchLower ||
      lead.email?.toLowerCase().includes(searchLower) ||
      fullName(lead).toLowerCase().includes(searchLower) ||
      lead.company?.toLowerCase().includes(searchLower) ||
      phone.toLowerCase().includes(searchLower) ||
      (digits.length >= 3 && phone.replace(/\D/g, '').includes(digits));
    if (!matchesSearch) return false;
    if (ownerFilter !== "all") {
      const name = ownerNameFor(lead.id);
      if (ownerFilter === "__unassigned") {
        if (name) return false;
      } else if (name !== ownerFilter) {
        return false;
      }
    }
    if (webinarFilter !== 'all' && lead.webinar_slug !== webinarFilter) return false;
    return matchesDateRange(lead.created_at);
  });

  const stats = {
    total: leads.length,
    today: leads.filter((l) => isWithinInterval(new Date(l.created_at), { start: startOfDay(new Date()), end: endOfDay(new Date()) })).length,
    thisWeek: leads.filter((l) => isWithinInterval(new Date(l.created_at), { start: subDays(new Date(), 7), end: new Date() })).length,
  };

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
    <div className="space-y-6">
      {loadError && <LeadPanelErrorState panelName="Webinar leads" />}
      <AdminPageHeader
        title="Webinar Leads"
        icon={<Calendar className="h-5 w-5 text-primary" />}
        description="Manage leads captured from webinar landing pages"
        isRealtimeConnected={isRealtimeConnected}
      />

      <AdminMetricsStrip
        metrics={[
          {
            value: stats.total,
            label: 'Total registrations',
            onClick: () => { setSearchQuery(''); setDateRange('all'); setWebinarFilter('all'); },
          },
          { value: stats.today, label: 'Today', onClick: () => setDateRange('today'), active: dateRange === 'today' },
          { value: stats.thisWeek, label: 'This week', onClick: () => setDateRange('7d'), active: dateRange === '7d' },
        ]}
      />
      <AdminActionsRow
        actions={[
          {
            key: 'export',
            label: 'Export',
            icon: <Download className="h-3.5 w-3.5" />,
            onClick: exportLeadsCSV,
            allowed: canExportLeads,
          },
          {
            key: 'refresh',
            label: 'Refresh',
            icon: <RefreshCw className="h-3.5 w-3.5" />,
            onClick: handleRefresh,
            loading: isRefreshing,
          },
        ]}
      />


      <AdminToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name, email, or company…"
        resultCount={filteredLeads.length}
        resultNoun="registration"
        filters={[
          {
            key: 'owner',
            label: 'Owner',
            value: ownerFilter,
            onChange: setOwnerFilter,
            width: 'w-[160px]',
            options: [
              { value: 'all', label: 'All owners' },
              { value: '__unassigned', label: 'Unassigned' },
              ...optionsFromData(leads, (r) => ownerNameFor(r.id)),
            ],
          },
          {
            key: 'webinar',
            label: 'Webinar',
            value: webinarFilter,
            onChange: setWebinarFilter,
            width: 'w-[190px]',
            options: [
              { value: 'all', label: 'All webinars' },
              ...Array.from(new Set(leads.map(l => l.webinar_slug).filter(Boolean))).sort().map((slug) => ({ value: slug, label: slug })),
            ],
          },
          {
            key: 'date',
            label: 'Date',
            value: dateRange,
            onChange: setDateRange,
            width: 'w-[150px]',
            allValue: 'all',
            options: [
              { label: "All Time", value: "all" },
              { label: "Today", value: "today" },
              { label: "Last 7 Days", value: "7d" },
              { label: "Last 30 Days", value: "30d" },
            ],
          },
        ]}
        onClearAll={() => { setSearchQuery(""); setDateRange("all"); setWebinarFilter("all"); setOwnerFilter("all"); }}
        actions={
          <>
            <Button size="sm" className="h-8 text-xs" onClick={openCreateLead}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Lead
            </Button>

          </>
        }
      />

      {filteredLeads.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No registrations yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {leads.length === 0
              ? 'Registrations captured on the site will appear here.'
              : 'No registrations match your filters.'}
          </p>
        </div>
      ) : (
        <LeadList>
          <LeadListHeader whenLabel="Registered" />
          {filteredLeads.map((lead) => (
            <LeadListRow
              key={lead.id}
              onClick={() => navigate(`/admin/webinar-leads/${lead.id}`)}
              name={fullName(lead)}
              badgeSlot={<SourceBadge label="Webinar" />}
              extraSlot={
                <>
                  {lead.webinar_slug && (
                    <Badge variant="outline" className="text-[10px] font-normal">{lead.webinar_slug}</Badge>
                  )}
                  {lead.ai_interest && (
                    <Badge variant="outline" className="text-[10px] font-normal">
                      <Sparkles className="w-3 h-3 mr-1" />{lead.ai_interest}
                    </Badge>
                  )}
                  <LeadOverlayBadges source="webinar_registrations" id={lead.id} />
                </>
              }
              contactLine={
                <span className="flex flex-wrap items-center gap-x-2">
                  <span className="truncate">{lead.email}</span>
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
              ownerSlot={<LeadOverlayOwnerCell source="webinar_registrations" id={lead.id} />}
              whenSlot={format(new Date(lead.created_at), 'MMM d, yyyy')}
              actionsSlot={
                <LegacyLeadActions
                  source="webinar_registrations"
                  id={lead.id}
                  name={fullName(lead)}
                  email={lead.email}
                  phone={lead.phone}
                  company={lead.company}
                  createdAt={lead.created_at}
                  raw={lead as unknown as Record<string, unknown>}
                  onEdit={() => openEditLead(lead)}
                />
              }
            />
          ))}
        </LeadList>
      )}


      {/* Webinar lead create/edit dialog */}
      <Dialog open={leadFormOpen} onOpenChange={setLeadFormOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>{editingLeadId ? "Edit Lead" : "Add Lead"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {WEBINAR_FIELDS.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={`f-${key}`} className="text-xs">{label}</Label>
                <Input
                  id={`f-${key}`}
                  value={(leadForm[key] as string) ?? ""}
                  onChange={(e) => setLeadForm((p) => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeadFormOpen(false)}>Cancel</Button>
            <Button onClick={saveLead} disabled={savingLead}>
              {savingLead && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingLeadId ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
