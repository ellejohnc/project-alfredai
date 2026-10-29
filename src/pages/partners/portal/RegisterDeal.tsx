import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Mail,
  Info,
  Paperclip,
  Link2,
  Plus,
  X,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { usePartnerPortal } from "@/contexts/PartnerPortalContext";
import { usePartnerDeals } from "@/hooks/usePartnerDeals";
import { formatPartnerCurrency, Territory } from "@/lib/partnerCommission";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-sky-100 text-sky-700",
  won: "bg-partner-teal/15 text-partner-teal",
  lost: "bg-slate-100 text-slate-500",
};

const TERRITORIES: { value: Territory; label: string }[] = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "ANZ", label: "Australia / New Zealand" },
];

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB per file
const MAX_FILES = 10;

function sanitiseName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

export default function RegisterDeal() {
  const { user } = useUserAuth();
  const { profile } = usePartnerPortal();
  const { deals, refresh } = usePartnerDeals();

  const [clientName, setClientName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [description, setDescription] = useState("");
  const [setupFee, setSetupFee] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [territory, setTerritory] = useState<Territory>(profile?.territory ?? "ANZ");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidenceLinks, setEvidenceLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    setError(null);
    const incoming = Array.from(fileList);
    const tooBig = incoming.find((f) => f.size > MAX_FILE_BYTES);
    if (tooBig) {
      setError(`"${tooBig.name}" is over 20MB. Please attach a smaller file.`);
      return;
    }
    setEvidenceFiles((prev) => {
      const combined = [...prev, ...incoming];
      if (combined.length > MAX_FILES) {
        setError(`You can attach up to ${MAX_FILES} files.`);
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
  };

  const removeFile = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addLink = () => {
    setError(null);
    let url = linkInput.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    try {
      new URL(url);
    } catch {
      setError("Please enter a valid link (e.g. https://drive.google.com/...).");
      return;
    }
    if (evidenceLinks.includes(url)) {
      setLinkInput("");
      return;
    }
    setEvidenceLinks((prev) => [...prev, url]);
    setLinkInput("");
  };

  const removeLink = (index: number) => {
    setEvidenceLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (evidenceFiles.length === 0 && evidenceLinks.length === 0) {
      setError(
        "Please attach evidence of the sales conversation — upload a file or add a link (meeting record, conversation screenshots, or email thread).",
      );
      return;
    }
    if (!confirmed) {
      setError("Please confirm a genuine two-way sales conversation has taken place.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      // 1. Upload evidence files to the partner's own folder.
      const stamp = Date.now();
      const evidenceUrls: string[] = [];
      for (let i = 0; i < evidenceFiles.length; i++) {
        const file = evidenceFiles[i];
        const path = `${user.id}/${stamp}-${i}-${sanitiseName(file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("deal-evidence")
          .upload(path, file, { upsert: false });
        if (uploadError) throw uploadError;
        evidenceUrls.push(path);
      }

      // Include any link-based evidence alongside uploaded files.
      evidenceUrls.push(...evidenceLinks);

      // 2. Register the deal with the attached evidence.
      const { error: insertError } = await supabase.from("deals").insert({
        partner_id: user.id,
        client_name: clientName,
        contact_email: contactEmail,
        description,
        setup_fee: Number(setupFee) || 0,
        monthly_fee: Number(monthlyFee) || 0,
        territory,
        evidence_urls: evidenceUrls,
        conversation_confirmed: confirmed,
      });
      if (insertError) throw insertError;

      setSuccess(true);
      setClientName("");
      setContactEmail("");
      setDescription("");
      setSetupFee("");
      setMonthlyFee("");
      setEvidenceFiles([]);
      setEvidenceLinks([]);
      setLinkInput("");
      setConfirmed(false);
      refresh();
    } catch (err) {
      console.error("Failed to register deal", err);
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't register your deal. Your details are safe — please try again or email us.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const supportMailto = `mailto:william@alfredai.bot?subject=${encodeURIComponent(
    "Deal registration error",
  )}&body=${encodeURIComponent(
    `Hi William,\n\nI hit an error registering a deal. Please find a screenshot attached.\n\nPage: ${window.location.href}\nError: ${error ?? ""}\n`,
  )}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-portal-display text-2xl font-bold text-partner-navy">Register a Deal</h1>
        <p className="mt-1 text-sm text-slate-500">
          Register an opportunity to protect it to you while we confirm it.
        </p>
      </div>

      {/* What a registered deal means */}
      <Card className="rounded-xl border border-partner-navy/15 bg-partner-navy/[0.03] p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-partner-navy/10 text-partner-navy">
            <Info className="h-5 w-5" />
          </span>
          <div className="space-y-2 text-sm leading-relaxed text-slate-600">
            <p className="font-semibold text-partner-navy">
              A registered deal means a real sales conversation has already happened.
            </p>
            <p>
              You can only register an opportunity once you've had a genuine, two-way conversation
              with the client about alfred ai — not a cold outreach message you've sent on its own.
              The client must have engaged and shown real interest.
            </p>
            <p>
              To protect the deal to you, attach evidence of that conversation below — for example a
              meeting recording or notetaker summary, screenshots of a back-and-forth chat, or an
              email thread. The evidence needs to clearly show the client responding and engaging,
              not just your outreach.
            </p>
          </div>
        </div>
      </Card>

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-partner-teal/40 bg-partner-teal/5 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-partner-teal" />
          <p className="text-sm font-medium text-partner-navy">
            Deal registered with your evidence attached. It's now protected to you while we confirm it.
          </p>
        </div>
      )}

      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div className="text-sm text-red-700">
              <p className="font-medium">We couldn't register your deal.</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
          <a
            href={supportMailto}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
          >
            <Mail className="h-4 w-4" />
            Email support
          </a>
        </div>
      )}

      <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Client name">
            <input required value={clientName} onChange={(e) => setClientName(e.target.value)} className="portal-input" />
          </Field>
          <Field label="Contact email">
            <input required type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="portal-input" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Opportunity description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="portal-input resize-none"
                placeholder="What's the opportunity, what was discussed, and where is the conversation up to?"
              />
            </Field>
          </div>
          <Field label="Estimated setup fee">
            <input type="number" min="0" value={setupFee} onChange={(e) => setSetupFee(e.target.value)} className="portal-input" placeholder="0" />
          </Field>
          <Field label="Estimated monthly fee">
            <input type="number" min="0" value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} className="portal-input" placeholder="0" />
          </Field>
          <Field label="Territory">
            <select value={territory} onChange={(e) => setTerritory(e.target.value as Territory)} className="portal-input">
              {TERRITORIES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>

          {/* Evidence upload */}
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-partner-navy">
              Evidence of the sales conversation <span className="text-partner-pink">*</span>
            </span>
            <p className="mb-2 text-xs leading-relaxed text-slate-500">
              Attach meeting records / notetaker summaries, screenshots of the conversation, or email
              threads. It must show the client responding and engaging — not a cold outreach message
              on its own. Up to {MAX_FILES} files, 20MB each.
            </p>

            <label
              htmlFor="evidence-upload"
              className="flex min-h-[44px] cursor-pointer touch-manipulation flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition-colors hover:border-partner-pink hover:bg-partner-pink/5"
            >
              <Paperclip className="h-5 w-5 text-slate-400" />
              <span className="text-sm font-medium text-partner-navy">Tap to attach evidence</span>
              <span className="text-xs text-slate-500">
                Images, PDFs, documents, audio or video
              </span>
              <input
                id="evidence-upload"
                type="file"
                multiple
                accept="image/*,application/pdf,.doc,.docx,.txt,.eml,.msg,audio/*,video/*"
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>

            {evidenceFiles.length > 0 && (
              <ul className="mt-3 space-y-2">
                {evidenceFiles.map((file, i) => (
                  <li
                    key={`${file.name}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate text-partner-navy">{file.name}</span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {(file.size / 1024 / 1024).toFixed(1)}MB
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-red-500"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Or add a link */}
            <div className="mt-4">
              <span className="mb-1.5 block text-xs font-medium text-slate-500">
                Or paste a link (Google Drive, Loom, Fathom, shared doc, etc.)
              </span>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    inputMode="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addLink();
                      }
                    }}
                    placeholder="https://drive.google.com/..."
                    className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-partner-navy focus:border-partner-pink focus:outline-none focus:ring-1 focus:ring-partner-pink"
                  />
                </div>
                <button
                  type="button"
                  onClick={addLink}
                  className="flex min-h-[44px] shrink-0 touch-manipulation items-center gap-1.5 rounded-lg bg-partner-navy px-4 text-sm font-medium text-white transition-colors hover:bg-partner-navy/90"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>

            {evidenceLinks.length > 0 && (
              <ul className="mt-3 space-y-2">
                {evidenceLinks.map((link, i) => (
                  <li
                    key={`${link}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-w-0 items-center gap-2 text-partner-navy hover:text-partner-pink"
                    >
                      <Link2 className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate underline">{link}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => removeLink(i)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-red-500"
                      aria-label={`Remove ${link}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Confirmation */}
          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 touch-manipulation rounded border-slate-300 text-partner-pink focus:ring-partner-pink"
              />
              <span className="flex items-start gap-2 text-sm leading-relaxed text-slate-600">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-partner-teal" />
                I confirm a genuine, two-way sales conversation has taken place with this client, and
                the attached evidence shows the client engaging — not cold outreach alone.
              </span>
            </label>
          </div>

          <div className="flex items-end sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-[44px] w-full touch-manipulation items-center justify-center rounded-lg bg-partner-pink px-4 py-2.5 text-sm font-semibold text-white hover:bg-partner-pink-hover disabled:opacity-60 sm:w-auto sm:px-6"
            >
              {submitting ? "Registering…" : "Register deal"}
            </button>
          </div>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 font-portal-display text-base font-semibold text-partner-navy">
          My registered deals
        </h2>
        {deals.length === 0 ? (
          <Card className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No deals registered yet. Your first one will appear here.
          </Card>
        ) : (
          <Card className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Setup</th>
                  <th className="px-4 py-3 font-medium">Monthly</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Registered</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((d) => (
                  <tr key={d.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-partner-navy">{d.client_name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatPartnerCurrency(Number(d.setup_fee), d.territory)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatPartnerCurrency(Number(d.monthly_fee), d.territory)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                          STATUS_STYLES[d.status] ?? "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(d.created_at).toLocaleDateString("en-AU")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-partner-navy">{label}</span>
      {children}
    </label>
  );
}
