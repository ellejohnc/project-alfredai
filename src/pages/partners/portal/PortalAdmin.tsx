import { useState, useEffect, useCallback, Fragment } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePartnerPortal } from "@/contexts/PartnerPortalContext";
import { formatPartnerCurrency, Territory } from "@/lib/partnerCommission";
import { SUPPORT_EMAIL } from "@/lib/siteConfig";
import { ONBOARDING_STEPS, onboardingProgress } from "@/lib/partnerOnboarding";
import {
  UserPlus,
  Loader2,
  Trash2,
  KeyRound,
  Pencil,
  Check,
  X,
  Inbox,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  deal_created: "registered a deal for",
  partner_approved: "approved partner",
  partner_unapproved: "set to not approved",
  application_approved: "approved application for",
};

const TERRITORIES: { value: Territory; label: string }[] = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "ANZ", label: "Australia / New Zealand" },
];

interface AdminProfile {
  user_id: string;
  full_name: string;
  company: string | null;
  territory: Territory;
  is_approved: boolean;
  is_admin: boolean;
  must_change_password: boolean;
  created_at: string;
  onboarding: Record<string, boolean> | null;
}

interface Application {
  id: string;
  full_name: string;
  email: string;
  company: string | null;
  phone: string | null;
  territory: Territory;
  status: string;
  created_at: string;
}

interface AdminDeal {
  id: string;
  client_name: string;
  setup_fee: number;
  monthly_fee: number;
  territory: Territory;
  status: string;
  created_at: string;
  payment_status: string;
  payment_cleared: boolean;
  commission_status: string;
  manual_override: boolean;
  override_note: string | null;
  approval_status: string;
  approval_note: string | null;
}


interface ActivityEntry {
  id: string;
  action: string;
  actor_name: string | null;
  resource_type: string;
  resource_name: string | null;
  created_at: string;
}

interface EditState {
  user_id: string;
  full_name: string;
  company: string;
  territory: Territory;
}

export default function PortalAdmin() {
  const [partners, setPartners] = useState<AdminProfile[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [deals, setDeals] = useState<AdminDeal[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [expandedOnboarding, setExpandedOnboarding] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile } = usePartnerPortal();

  // Add-partner form state
  const [addEmail, setAddEmail] = useState("");
  const [addName, setAddName] = useState("");
  const [addCompany, setAddCompany] = useState("");
  const [addTerritory, setAddTerritory] = useState<Territory>("ANZ");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: p }, { data: a }, { data: d }, { data: act }] = await Promise.all([
      supabase.from("partner_profiles").select("*").order("created_at", { ascending: false }),
      supabase
        .from("partner_applications")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase.from("deals").select("*").order("created_at", { ascending: false }),
      supabase
        .from("partner_activity_log")
        .select("id, action, actor_name, resource_type, resource_name, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    setPartners((p ?? []) as unknown as AdminProfile[]);
    setApplications((a ?? []) as unknown as Application[]);
    setDeals((d ?? []) as unknown as AdminDeal[]);
    setActivity((act ?? []) as unknown as ActivityEntry[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const callManage = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("manage-partner", { body });
    if (error) throw error;
    if (data && data.success === false) {
      throw new Error(data.error || "Something went wrong.");
    }
    return data;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await callManage({
        action: "create_partner",
        email: addEmail,
        fullName: addName,
        company: addCompany,
        territory: addTerritory,
      });
      toast({
        title: "Partner created",
        description: `${addEmail} is live. Temporary login details have been emailed.`,
      });
      setAddEmail("");
      setAddName("");
      setAddCompany("");
      setAddTerritory("ANZ");
      load();
    } catch (err) {
      toast({
        title: "Couldn't create partner",
        description:
          err instanceof Error
            ? `${err.message} If this persists, email ${SUPPORT_EMAIL}.`
            : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const approveApplication = async (app: Application) => {
    setBusyId(app.id);
    try {
      await callManage({ action: "approve_application", applicationId: app.id });
      toast({
        title: "Applicant approved",
        description: `${app.email} is now live. Login details have been emailed.`,
      });
      load();
    } catch (err) {
      toast({
        title: "Approval failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const rejectApplication = async (app: Application) => {
    if (!window.confirm(`Reject the application from ${app.full_name}?`)) return;
    setBusyId(app.id);
    try {
      await callManage({ action: "reject_application", applicationId: app.id });
      toast({ title: "Application rejected" });
      load();
    } catch (err) {
      toast({
        title: "Couldn't reject application",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const toggleApproval = async (partner: AdminProfile) => {
    const { error } = await supabase
      .from("partner_profiles")
      .update({ is_approved: !partner.is_approved })
      .eq("user_id", partner.user_id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: partner.is_approved ? "Access revoked" : "Partner approved" });
    load();
  };

  const saveEdit = async () => {
    if (!edit) return;
    setBusyId(edit.user_id);
    const { error } = await supabase
      .from("partner_profiles")
      .update({
        full_name: edit.full_name.trim(),
        company: edit.company.trim() || null,
        territory: edit.territory,
      })
      .eq("user_id", edit.user_id);
    setBusyId(null);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Partner updated" });
    setEdit(null);
    load();
  };

  const resetPassword = async (partner: AdminProfile) => {
    if (!window.confirm(`Send ${partner.full_name} a new temporary password?`)) return;
    setBusyId(partner.user_id);
    try {
      await callManage({ action: "reset_password", userId: partner.user_id });
      toast({
        title: "Password reset",
        description: "A new temporary password has been emailed to the partner.",
      });
      load();
    } catch (err) {
      toast({
        title: "Reset failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const deletePartner = async (partner: AdminProfile) => {
    if (!window.confirm(`Permanently delete ${partner.full_name}? This cannot be undone.`)) return;
    setBusyId(partner.user_id);
    try {
      await callManage({ action: "delete_partner", userId: partner.user_id });
      toast({ title: "Partner deleted" });
      load();
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const toggleOverride = async (deal: AdminDeal) => {
    const turningOn = !deal.manual_override;
    const note = turningOn
      ? window.prompt("Reason for manually approving this commission?") ?? ""
      : null;
    const { error } = await supabase
      .from("deals")
      .update({ manual_override: turningOn, override_note: note })
      .eq("id", deal.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: turningOn ? "Commission manually approved" : "Manual override removed" });
    load();
  };

  // Admin approval gate: a registered deal earns no commission until an admin
  // approves it (and the payment clears / an override is applied).
  const reviewDeal = async (deal: AdminDeal, decision: "approved" | "rejected" | "pending") => {
    const note =
      decision === "rejected"
        ? window.prompt("Reason for rejecting this deal registration?") ?? ""
        : deal.approval_note;
    setBusyId(deal.id);
    const { error } = await supabase
      .from("deals")
      .update({
        approval_status: decision,
        approval_note: note,
        approved_by: decision === "pending" ? null : profile?.user_id ?? null,
        approved_at: decision === "pending" ? null : new Date().toISOString(),
      })
      .eq("id", deal.id);
    setBusyId(null);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title:
        decision === "approved"
          ? "Deal approved"
          : decision === "rejected"
            ? "Deal rejected"
            : "Approval reset to pending",
    });
    load();
  };



  const markPaid = async (deal: AdminDeal) => {
    const { error } = await supabase
      .from("deals")
      .update({ commission_status: "paid" })
      .eq("id", deal.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Commission marked as paid" });
    load();
  };

  const updateStatus = async (deal: AdminDeal, status: string) => {
    const { error } = await supabase
      .from("deals")
      .update({ status })
      .eq("id", deal.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Deal marked as ${status}` });
    load();
  };

  const deleteDeal = async (deal: AdminDeal) => {
    if (!window.confirm(`Remove the deal for "${deal.client_name}"? This can't be undone.`)) return;
    const { error } = await supabase.from("deals").delete().eq("id", deal.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Deal removed" });
    load();
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  const isAdmin = !!profile?.is_admin;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-portal-display text-2xl font-bold text-partner-navy">Admin</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review applicants, manage partner accounts and every registered deal.
        </p>
      </div>

      {isAdmin && (
        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-partner-pink/10 text-partner-pink">
              <UserPlus className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-portal-display text-base font-semibold text-partner-navy">
                Add a partner
              </h2>
              <p className="text-xs text-slate-500">
                Creates a live account instantly and emails a temporary password to change on first
                login.
              </p>
            </div>
          </div>
          <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-partner-navy">Full name</span>
              <input
                required
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-partner-pink focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-partner-navy">Email</span>
              <input
                required
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="jane@company.com"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-partner-pink focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-partner-navy">Company</span>
              <input
                value={addCompany}
                onChange={(e) => setAddCompany(e.target.value)}
                placeholder="Acme Advisory"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-partner-pink focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-partner-navy">Territory</span>
              <select
                value={addTerritory}
                onChange={(e) => setAddTerritory(e.target.value as Territory)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-partner-pink focus:outline-none"
              >
                {TERRITORIES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={adding}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-partner-pink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-partner-pink-hover disabled:opacity-60"
              >
                {adding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" /> Create partner
                  </>
                )}
              </button>
            </div>
          </form>
        </Card>
      )}

      {isAdmin && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-portal-display text-base font-semibold text-partner-navy">
            <Inbox className="h-4 w-4 text-partner-pink" />
            Applications ({applications.length})
          </h2>
          <Card className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            {applications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">No applications waiting for review.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Territory</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((a) => (
                    <tr key={a.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-4 py-3 font-medium text-partner-navy">{a.full_name}</td>
                      <td className="px-4 py-3 text-slate-600">{a.email}</td>
                      <td className="px-4 py-3 text-slate-600">{a.company ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{a.territory}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            disabled={busyId === a.id}
                            onClick={() => approveApplication(a)}
                            className="inline-flex items-center gap-1 rounded-lg bg-partner-pink px-3 py-1.5 text-xs font-semibold text-white hover:bg-partner-pink-hover disabled:opacity-60"
                          >
                            {busyId === a.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            Approve & go live
                          </button>
                          <button
                            disabled={busyId === a.id}
                            onClick={() => rejectApplication(a)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-partner-navy hover:bg-slate-50 disabled:opacity-60"
                          >
                            <X className="h-3 w-3" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      <div>
        <h2 className="mb-3 font-portal-display text-base font-semibold text-partner-navy">
          Partners ({partners.length})
        </h2>
        <Card className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Territory</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Onboarding</th>
                {isAdmin && <th className="px-4 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => {
                const editing = edit?.user_id === p.user_id;
                return (
                  <Fragment key={p.user_id}>
                  <tr className="border-b border-slate-50 last:border-0 align-top">
                    <td className="px-4 py-3 font-medium text-partner-navy">
                      {editing ? (
                        <input
                          value={edit.full_name}
                          onChange={(e) => setEdit({ ...edit, full_name: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-partner-pink focus:outline-none"
                        />
                      ) : (
                        p.full_name
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {editing ? (
                        <input
                          value={edit.company}
                          onChange={(e) => setEdit({ ...edit, company: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-partner-pink focus:outline-none"
                        />
                      ) : (
                        p.company ?? "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {editing ? (
                        <select
                          value={edit.territory}
                          onChange={(e) =>
                            setEdit({ ...edit, territory: e.target.value as Territory })
                          }
                          className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-partner-pink focus:outline-none"
                        >
                          {TERRITORIES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.value}
                            </option>
                          ))}
                        </select>
                      ) : (
                        p.territory
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          p.is_admin
                            ? "bg-partner-navy/10 text-partner-navy"
                            : p.is_approved
                              ? "bg-partner-teal/15 text-partner-teal"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {p.is_admin ? "Admin" : p.is_approved ? "Live" : "Pending"}
                      </span>
                      {p.must_change_password && !p.is_admin && (
                        <span className="mt-1 block text-xs text-slate-400">temp password</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.is_admin ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (() => {
                        const state = p.onboarding ?? {};
                        const { complete, total } = onboardingProgress(state);
                        const pct = total ? Math.round((complete / total) * 100) : 0;
                        const isOpen = expandedOnboarding === p.user_id;
                        return (
                          <button
                            type="button"
                            onClick={() => setExpandedOnboarding(isOpen ? null : p.user_id)}
                            className="group flex min-w-[8.5rem] flex-col items-start gap-1 rounded-md p-1 text-left hover:bg-slate-50"
                            aria-expanded={isOpen}
                            aria-label={`${complete} of ${total} onboarding steps complete for ${p.full_name}`}
                          >
                            <span className="flex items-center gap-1 text-xs font-medium text-partner-navy">
                              {isOpen ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                              {complete}/{total} steps
                            </span>
                            <span className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-100">
                              <span
                                className={`block h-full rounded-full transition-all ${
                                  complete === total ? "bg-partner-teal" : "bg-partner-pink"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </span>
                          </button>
                        );
                      })()}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        {p.is_admin ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : editing ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              disabled={busyId === p.user_id}
                              onClick={saveEdit}
                              className="inline-flex items-center gap-1 rounded-lg bg-partner-pink px-3 py-1.5 text-xs font-semibold text-white hover:bg-partner-pink-hover disabled:opacity-60"
                            >
                              <Check className="h-3 w-3" /> Save
                            </button>
                            <button
                              onClick={() => setEdit(null)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-partner-navy hover:bg-slate-50"
                            >
                              <X className="h-3 w-3" /> Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() =>
                                setEdit({
                                  user_id: p.user_id,
                                  full_name: p.full_name,
                                  company: p.company ?? "",
                                  territory: p.territory,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-partner-navy hover:bg-slate-50"
                            >
                              <Pencil className="h-3 w-3" /> Edit
                            </button>
                            <button
                              onClick={() => toggleApproval(p)}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-partner-navy hover:bg-slate-50"
                            >
                              {p.is_approved ? "Revoke" : "Approve"}
                            </button>
                            <button
                              disabled={busyId === p.user_id}
                              onClick={() => resetPassword(p)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-partner-navy hover:bg-slate-50 disabled:opacity-60"
                            >
                              <KeyRound className="h-3 w-3" /> Reset
                            </button>
                            <button
                              disabled={busyId === p.user_id}
                              onClick={() => deletePartner(p)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                            >
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                    </tr>
                    {expandedOnboarding === p.user_id && !p.is_admin && (
                      <tr className="border-b border-slate-50 bg-slate-50/60">
                        <td colSpan={isAdmin ? 6 : 5} className="px-4 py-4">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {p.full_name}'s Get Started progress
                          </p>
                          <ul className="grid gap-1.5 sm:grid-cols-2">
                            {ONBOARDING_STEPS.map((step) => {
                              const done = !!(p.onboarding ?? {})[step.id];
                              return (
                                <li key={step.id} className="flex items-start gap-2 text-xs text-partner-navy">
                                  <span
                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                      done
                                        ? "border-partner-teal bg-partner-teal text-white"
                                        : "border-slate-300 bg-white"
                                    }`}
                                  >
                                    {done && <Check className="h-3 w-3" />}
                                  </span>
                                  <span className={done ? "text-slate-500 line-through" : ""}>
                                    {step.label}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 font-portal-display text-base font-semibold text-partner-navy">
          All deals ({deals.length})
        </h2>
        <Card className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Setup</th>
                <th className="px-4 py-3 font-medium">Monthly</th>
                <th className="px-4 py-3 font-medium">Approval</th>
                <th className="px-4 py-3 font-medium">Status</th>

                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Commission</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d.id} className="border-b border-slate-50 last:border-0 align-top">
                  <td className="px-4 py-3 font-medium text-partner-navy">
                    {d.client_name}
                    <span className="block text-xs font-normal text-slate-400">{d.territory}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatPartnerCurrency(Number(d.setup_fee), d.territory)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatPartnerCurrency(Number(d.monthly_fee), d.territory)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                        d.approval_status === "approved"
                          ? "bg-partner-teal/15 text-partner-teal"
                          : d.approval_status === "rejected"
                            ? "bg-red-100 text-red-600"
                            : "bg-amber-100 text-amber-700"
                      }`}
                      title={d.approval_note ?? ""}
                    >
                      {d.approval_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">

                    <select
                      value={d.status}
                      onChange={(e) => updateStatus(d, e.target.value)}
                      className="min-h-[36px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium capitalize text-partner-navy focus:outline-none focus:ring-2 focus:ring-partner-pink/40"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        d.payment_cleared
                          ? "bg-partner-teal/15 text-partner-teal"
                          : d.payment_status === "failed"
                            ? "bg-red-100 text-red-600"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {d.payment_cleared ? "Cleared" : d.payment_status === "failed" ? "Failed" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                        d.commission_status === "paid"
                          ? "bg-partner-teal/15 text-partner-teal"
                          : d.commission_status === "eligible"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {d.commission_status}
                    </span>
                    {d.manual_override && (
                      <span className="mt-1 block text-xs text-slate-400" title={d.override_note ?? ""}>
                        manual override
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {d.approval_status !== "approved" ? (
                        <button
                          onClick={() => reviewDeal(d, "approved")}
                          disabled={busyId === d.id}
                          className="min-h-[36px] rounded-lg bg-partner-teal px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                        >
                          Approve deal
                        </button>
                      ) : (
                        <button
                          onClick={() => reviewDeal(d, "pending")}
                          disabled={busyId === d.id}
                          className="min-h-[36px] rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-partner-navy hover:bg-slate-50 disabled:opacity-50"
                        >
                          Unapprove
                        </button>
                      )}
                      {d.approval_status !== "rejected" && (
                        <button
                          onClick={() => reviewDeal(d, "rejected")}
                          disabled={busyId === d.id}
                          className="min-h-[36px] rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => toggleOverride(d)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-partner-navy hover:bg-slate-50"
                      >
                        {d.manual_override ? "Remove override" : "Approve manually"}
                      </button>
                      {d.commission_status === "eligible" && (
                        <button
                          onClick={() => markPaid(d)}
                          className="rounded-lg bg-partner-pink px-3 py-1.5 text-xs font-semibold text-white hover:bg-partner-pink-hover"
                        >
                          Mark paid
                        </button>
                      )}
                      <button
                        onClick={() => deleteDeal(d)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Remove deal
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 font-portal-display text-base font-semibold text-partner-navy">
          Activity history
        </h2>
        {activity.length === 0 ? (
          <Card className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No activity recorded yet. Approvals and deal registrations will appear here.
          </Card>
        ) : (
          <Card className="divide-y divide-slate-50 rounded-xl border border-slate-200 bg-white shadow-sm">
            {activity.map((a) => (
              <div key={a.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-partner-navy">
                  <span className="font-semibold">{a.actor_name ?? "System"}</span>{" "}
                  <span className="text-slate-500">{ACTION_LABELS[a.action] ?? a.action}</span>
                  {a.resource_name && (
                    <span className="font-medium text-partner-navy"> {a.resource_name}</span>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(a.created_at).toLocaleString("en-AU")}
                </span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>

  );
}
