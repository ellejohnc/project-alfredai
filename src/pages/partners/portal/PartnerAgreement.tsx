import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, AlertCircle, Download, FileText, ShieldCheck, ArrowLeft, Mail, Lock } from "lucide-react";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { usePartnerPortal } from "@/contexts/PartnerPortalContext";
import { useToast } from "@/hooks/use-toast";
import { CONTACT_INFO } from "@/lib/contactInfo";
import {
  AGREEMENT_BLOCKS,
  AGREEMENT_TITLE,
  AGREEMENT_VERSION,
  TERRITORY_OPTIONS,
  type AgreementBlock,
} from "@/lib/partnerAgreementContent";

const SUPPORT_EMAIL = CONTACT_INFO.email.support;

interface SignForm {
  partner_legal_name: string;
  partner_abn: string;
  partner_address: string;
  territory: string;
  signatory_name: string;
  signatory_title: string;
  signature_text: string;
  agreed: boolean;
}

type FieldErrors = Partial<Record<keyof SignForm, string>>;

const EMPTY: SignForm = {
  partner_legal_name: "",
  partner_abn: "",
  partner_address: "",
  territory: TERRITORY_OPTIONS[0],
  signatory_name: "",
  signatory_title: "",
  signature_text: "",
  agreed: false,
};

const signSchema = z.object({
  partner_legal_name: z.string().trim().min(2, "Enter your full legal / company name.").max(160, "Keep this under 160 characters."),
  partner_abn: z.string().trim().min(2, "Enter your ABN / ACN / company number.").max(60, "Keep this under 60 characters."),
  partner_address: z.string().trim().min(5, "Enter your registered address.").max(240, "Keep this under 240 characters."),
  territory: z.string().trim().min(2, "Choose your territory."),
  signatory_name: z.string().trim().min(2, "Enter the signatory's full name.").max(120, "Keep this under 120 characters."),
  signatory_title: z.string().trim().min(2, "Enter the signatory's title.").max(120, "Keep this under 120 characters."),
  signature_text: z.string().trim().min(2, "Type your full name to sign.").max(120, "Keep this under 120 characters."),
  agreed: z.literal(true, { errorMap: () => ({ message: "You must confirm you have read and agree to the terms." }) }),
});

interface SignedRecord {
  partner_legal_name: string;
  partner_abn: string | null;
  partner_address: string | null;
  territory: string | null;
  signatory_name: string;
  signatory_title: string | null;
  signature_text: string;
  agreement_version: string | null;
  signed_at: string;
}

/** Strip non-ASCII so jsPDF (no embedded font) never renders garbled glyphs. */
function ascii(input: string): string {
  return (input || "")
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u2192/g, "->")
    // \x00 here is the lower bound of an ASCII range, not a control character
    // we are hunting for: the line strips everything OUTSIDE ASCII so the
    // agreement PDF renders in a font that has no glyphs beyond it.
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x00-\x7F]/g, "");
}

export default function PartnerAgreement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUserAuth();
  const { profile, updateOnboarding } = usePartnerPortal();
  const { toast } = useToast();
  const redirectedFromLocked = searchParams.has("locked");

  const [form, setForm] = useState<SignForm>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SignForm, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signed, setSigned] = useState<SignedRecord | null>(null);
  const [loadError, setLoadError] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Load any existing signature and prefill from the partner profile.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("partner_agreement_signatures")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (!active) return;
        if (data) {
          setSigned(data as SignedRecord);
        } else {
          setForm((f) => ({
            ...f,
            partner_legal_name: profile?.company || profile?.full_name || "",
            signatory_name: profile?.full_name || "",
            territory:
              profile?.territory === "US"
                ? "United States"
                : profile?.territory === "CA"
                ? "Canada"
                : TERRITORY_OPTIONS[0],
          }));
        }
      } catch (err) {
        console.error("Failed to load agreement", err);
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, profile]);

  const set = (k: keyof SignForm, v: string | boolean) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (touched[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const blur = (k: keyof SignForm) => setTouched((t) => ({ ...t, [k]: true }));
  const errorFor = (k: keyof SignForm) => (touched[k] ? errors[k] : undefined);

  const handleSign = async () => {
    const result = signSchema.safeParse(form);
    if (!result.success) {
      const fe: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof SignForm;
        if (!fe[key]) fe[key] = issue.message;
      }
      setErrors(fe);
      setTouched((t) => ({ ...t, ...Object.keys(fe).reduce((a, k) => ({ ...a, [k]: true }), {}) }));
      const first = Object.keys(fe)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      toast({ title: "Please fix the highlighted fields", description: "A few details are needed before you can sign.", variant: "destructive" });
      return;
    }
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      partner_legal_name: form.partner_legal_name.trim(),
      partner_abn: form.partner_abn.trim(),
      partner_address: form.partner_address.trim(),
      territory: form.territory.trim(),
      signatory_name: form.signatory_name.trim(),
      signatory_title: form.signatory_title.trim(),
      signature_text: form.signature_text.trim(),
      agreement_version: AGREEMENT_VERSION,
      signed_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("partner_agreement_signatures")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .maybeSingle();
    setSaving(false);
    if (error || !data) {
      console.error("Failed to save signature", error);
      toast({
        title: "Couldn't save your signature",
        description: "Please try again. If it keeps happening, email us and we'll sort it out.",
        variant: "destructive",
      });
      return;
    }
    setSigned(data as SignedRecord);
    // Mark the onboarding step complete so the Get Started progress updates.
    try {
      await updateOnboarding({ ...(profile?.onboarding ?? {}), sign_agreement: true });
    } catch {
      /* non-blocking */
    }
    // Notify the admin (email + in-app). Non-blocking — never block the signer.
    try {
      await supabase.functions.invoke("notify-partner-signed", {
        body: {
          partner_legal_name: payload.partner_legal_name,
          signatory_name: payload.signatory_name,
          signatory_title: payload.signatory_title,
          territory: payload.territory,
          agreement_version: payload.agreement_version,
        },
      });
    } catch (err) {
      console.error("Admin notification failed", err);
    }
    toast({ title: "Agreement signed", description: "You can download your signed copy below." });
  };

  const record: SignedRecord | null = signed;

  const downloadPdf = () => {
    if (!record) return;
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 48;
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const maxW = pageW - margin * 2;
      let y = margin;

      const ensure = (h: number) => {
        if (y + h > pageH - margin) {
          doc.addPage();
          y = margin;
        }
      };
      const writeLines = (text: string, size: number, bold: boolean, gap = 4) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(ascii(text), maxW);
        for (const line of lines) {
          ensure(size + gap);
          doc.text(line, margin, y);
          y += size + gap;
        }
      };

      writeLines("alfred ai", 18, true, 2);
      writeLines(AGREEMENT_TITLE, 15, true, 6);
      writeLines("alfred ai Consulting Partner Program", 10, false, 8);

      writeLines("Parties", 12, true, 4);
      writeLines("Party A - The Provider: Alfred AI Agent Services Pty Ltd (trading as alfred ai), ABN 62 684 936 525, of Level 35, International Tower One, Barangaroo NSW 2000, Australia.", 10, false);
      writeLines(`Party B - The Consulting Partner: ${record.partner_legal_name}, ${record.partner_abn || ""}, of ${record.partner_address || ""}.`, 10, false);
      writeLines(`Territory: ${record.territory || ""}`, 10, false, 8);

      for (const block of AGREEMENT_BLOCKS as AgreementBlock[]) {
        if (block.type === "table" && block.headers && block.rows) {
          ensure(20);
          writeLines(block.headers.join("   |   "), 9, true, 2);
          for (const row of block.rows) writeLines(row.join("   |   "), 9, false, 2);
          y += 4;
        } else if (block.type === "h2") {
          y += 4;
          writeLines(block.text || "", 12, true, 4);
        } else if (block.type === "h3") {
          writeLines(block.text || "", 11, true, 4);
        } else if (block.type === "note") {
          writeLines(block.text || "", 9, false, 4);
        } else {
          writeLines(block.text || "", 10, false);
        }
      }

      // Execution block
      doc.addPage();
      y = margin;
      writeLines("Execution", 13, true, 6);
      writeLines("Signed by the Parties as a binding agreement. Each signatory warrants they are authorised to sign for their organisation.", 10, false, 8);
      writeLines("For Alfred AI Agent Services Pty Ltd", 10, true, 2);
      writeLines("Name: William Zhang", 10, false, 2);
      writeLines("Title: Chief Executive Officer", 10, false, 8);
      writeLines("For the Consulting Partner", 10, true, 2);
      writeLines(`Signature: ${record.signature_text}`, 10, false, 2);
      writeLines(`Name: ${record.signatory_name}`, 10, false, 2);
      writeLines(`Title: ${record.signatory_title || ""}`, 10, false, 2);
      writeLines(`Date: ${new Date(record.signed_at).toLocaleString("en-AU")}`, 10, false, 8);
      writeLines(`Document version: ${record.agreement_version || AGREEMENT_VERSION}`, 8, false, 2);
      writeLines("Disclaimer: This document does not constitute legal, financial or tax advice. Each Party should obtain independent advice.", 8, false);

      doc.save(`AlfredAI_Consulting_Partner_Agreement_${ascii(record.partner_legal_name).replace(/\s+/g, "_") || "signed"}.pdf`);
    } catch (err) {
      console.error("PDF download failed", err);
      const subject = encodeURIComponent("Partner agreement download issue");
      const body = encodeURIComponent(`I couldn't download my signed agreement.\nPage: ${window.location.href}\n`);
      toast({
        title: "Download failed",
        description: "We couldn't generate the PDF. Email us and we'll send your signed copy.",
        variant: "destructive",
      });
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    }
  };

  const renderBlock = (block: AgreementBlock, i: number) => {
    if (block.type === "table" && block.headers && block.rows) {
      return (
        <div key={i} className="my-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {block.headers.map((h, hi) => (
                  <th key={hi} className="border border-slate-200 bg-slate-50 p-2 text-left font-semibold text-partner-navy">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((c, ci) => (
                    <td key={ci} className="border border-slate-200 p-2 text-slate-600">{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (block.type === "h2") return <h2 key={i} className="mt-6 text-base font-bold text-partner-navy">{block.text}</h2>;
    if (block.type === "h3") return <h3 key={i} className="mt-4 text-sm font-bold text-partner-navy">{block.text}</h3>;
    if (block.type === "note")
      return (
        <p key={i} className="my-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs italic text-slate-500">{block.text}</p>
      );
    return <p key={i} className="mt-2 text-sm leading-relaxed text-slate-600">{block.text}</p>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded bg-slate-100" />
        <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
      </div>
    );
  }

  if (loadError) {
    const subject = encodeURIComponent("Partner agreement load issue");
    const body = encodeURIComponent(`I couldn't load the partner agreement.\nPage: ${window.location.href}\n`);
    return (
      <Card className="space-y-4 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-partner-pink" />
        <h1 className="text-lg font-bold text-partner-navy">We couldn't load the agreement</h1>
        <p className="text-sm text-slate-500">Please head back and try again, or email us with this page and a screenshot and we'll help.</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button onClick={() => navigate("/partners/portal/get-started")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-partner-navy px-4 py-2.5 text-sm font-medium text-white">
            <ArrowLeft className="h-4 w-4" /> Back to Get Started
          </button>
          <a href={`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-partner-navy">
            <Mail className="h-4 w-4" /> Email support
          </a>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <button onClick={() => navigate("/partners/portal/get-started")} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-partner-navy">
        <ArrowLeft className="h-4 w-4" /> Back to Get Started
      </button>

      <div>
        <h1 className="font-portal-display text-2xl font-bold text-partner-navy">{AGREEMENT_TITLE}</h1>
        <p className="mt-1 text-sm text-slate-500">alfred ai Consulting Partner Program — read the terms, complete your details and sign digitally.</p>
      </div>

      {redirectedFromLocked && !record && (
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-partner-pink" />
          <div>
            <p className="font-medium text-partner-navy">Sign to unlock the partner portal</p>
            <p className="mt-0.5 text-slate-500">Sign the Consulting Partner Agreement to access the rest of the onboarding steps.</p>
          </div>
        </div>
      )}

      {record && (
        <Card className="flex flex-col gap-3 border-partner-teal/40 bg-partner-teal/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-partner-teal text-white">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-partner-navy">Signed by {record.signatory_name}</p>
              <p className="text-xs text-slate-500">{new Date(record.signed_at).toLocaleString("en-AU")} · Version {record.agreement_version || AGREEMENT_VERSION}</p>
            </div>
          </div>
          <button onClick={downloadPdf} className="inline-flex items-center justify-center gap-2 rounded-lg bg-partner-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-partner-navy/90">
            <Download className="h-4 w-4" /> Download signed PDF
          </button>
        </Card>
      )}

      {/* Parties / details */}
      <Card className="space-y-4 p-5">
        <div className="flex items-center gap-2 text-partner-navy">
          <FileText className="h-4 w-4" />
          <h2 className="text-sm font-bold">Your details (Party B — The Consulting Partner)</h2>
        </div>
        <form ref={formRef} className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          <Field label="Partner legal name" name="partner_legal_name" value={form.partner_legal_name} onChange={(v) => set("partner_legal_name", v)} onBlur={() => blur("partner_legal_name")} error={errorFor("partner_legal_name")} disabled={!!record} required />
          <Field label="ABN / ACN / company number" name="partner_abn" value={form.partner_abn} onChange={(v) => set("partner_abn", v)} onBlur={() => blur("partner_abn")} error={errorFor("partner_abn")} disabled={!!record} required />
          <div className="sm:col-span-2">
            <Field label="Registered address" name="partner_address" value={form.partner_address} onChange={(v) => set("partner_address", v)} onBlur={() => blur("partner_address")} error={errorFor("partner_address")} disabled={!!record} required />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="territory" className="text-sm font-medium text-partner-navy">Territory <span className="text-partner-pink">*</span></label>
            <select id="territory" name="territory" value={record?.territory || form.territory} onChange={(e) => set("territory", e.target.value)} onBlur={() => blur("territory")} disabled={!!record} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-partner-navy outline-none focus:border-partner-pink focus:ring-2 focus:ring-partner-pink/20 disabled:bg-slate-50">
              {TERRITORY_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {errorFor("territory") && <FieldError msg={errorFor("territory")!} />}
          </div>
        </form>
      </Card>

      {/* Agreement body */}
      <Card className="max-h-[60vh] overflow-y-auto p-5 scrollbar-visible">
        <p className="text-sm font-semibold text-partner-navy">Party A — The Provider</p>
        <p className="mt-1 text-sm text-slate-600">Alfred AI Agent Services Pty Ltd (trading as alfred ai), ABN 62 684 936 525, of Level 35, International Tower One, Barangaroo NSW 2000, Australia (“alfred ai” or “the Provider”).</p>
        {AGREEMENT_BLOCKS.map((b, i) => renderBlock(b, i))}
      </Card>

      {/* Execution */}
      {!record ? (
        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-bold text-partner-navy">Execution — sign digitally</h2>
          <p className="text-xs text-slate-500">Each signatory warrants they are authorised to sign for their organisation.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Signatory full name" name="signatory_name" value={form.signatory_name} onChange={(v) => set("signatory_name", v)} onBlur={() => blur("signatory_name")} error={errorFor("signatory_name")} required />
            <Field label="Signatory title" name="signatory_title" value={form.signatory_title} onChange={(v) => set("signatory_title", v)} onBlur={() => blur("signatory_title")} error={errorFor("signatory_title")} required />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="signature_text" className="text-sm font-medium text-partner-navy">Type your full name to sign <span className="text-partner-pink">*</span></label>
            <input id="signature_text" name="signature_text" value={form.signature_text} onChange={(e) => set("signature_text", e.target.value)} onBlur={() => blur("signature_text")} placeholder="Your full name" className="rounded-lg border border-slate-200 bg-white px-3 py-3 font-[cursive] text-xl text-partner-navy outline-none focus:border-partner-pink focus:ring-2 focus:ring-partner-pink/20" />
            {errorFor("signature_text") && <FieldError msg={errorFor("signature_text")!} />}
          </div>
          <label className="flex items-start gap-3 text-sm text-slate-600">
            <input type="checkbox" name="agreed" checked={form.agreed} onChange={(e) => set("agreed", e.target.checked)} onBlur={() => blur("agreed")} className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-partner-teal focus:ring-partner-teal" />
            <span>I have read and agree to the alfred ai Consulting Partner Agreement, and I am authorised to sign on behalf of the Consulting Partner.</span>
          </label>
          {errorFor("agreed") && <FieldError msg={errorFor("agreed")!} />}
          <button onClick={handleSign} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-partner-teal px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-partner-teal/90 disabled:opacity-60 sm:w-auto">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saving ? "Signing…" : "Sign agreement"}
          </button>
        </Card>
      ) : (
        <Card className="space-y-2 p-5">
          <h2 className="text-sm font-bold text-partner-navy">Execution</h2>
          <p className="text-sm text-slate-600"><span className="font-medium">For Alfred AI Agent Services Pty Ltd:</span> William Zhang, Chief Executive Officer</p>
          <p className="text-sm text-slate-600"><span className="font-medium">For the Consulting Partner:</span></p>
          <p className="font-[cursive] text-2xl text-partner-navy">{record.signature_text}</p>
          <p className="text-xs text-slate-500">{record.signatory_name}{record.signatory_title ? ` · ${record.signatory_title}` : ""} · {new Date(record.signed_at).toLocaleString("en-AU")}</p>
        </Card>
      )}
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <span className="mt-1 flex items-center gap-1 text-xs text-partner-pink">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {msg}
    </span>
  );
}

function Field({
  label, name, value, onChange, onBlur, error, disabled, required,
}: {
  label: string; name: string; value: string; onChange: (v: string) => void; onBlur: () => void;
  error?: string; disabled?: boolean; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-partner-navy">
        {label} {required && <span className="text-partner-pink">*</span>}
      </label>
      <input
        id={name}
        name={name}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-partner-navy outline-none transition-colors placeholder:text-slate-400 focus:border-partner-pink focus:ring-2 focus:ring-partner-pink/20 disabled:bg-slate-50 disabled:text-slate-500"
      />
      {error && <FieldError msg={error} />}
    </div>
  );
}
