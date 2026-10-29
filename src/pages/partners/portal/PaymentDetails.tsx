import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, AlertCircle, Mail } from "lucide-react";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { usePartnerPortal } from "@/contexts/PartnerPortalContext";
import { useToast } from "@/hooks/use-toast";
import { CONTACT_INFO } from "@/lib/contactInfo";

const CONTACT_EMAIL = CONTACT_INFO.email.support;
const ACCOUNTS_EMAIL = "accounts@alfredai.bot";

interface PayoutForm {
  account_name: string;
  bank_name: string;
  bsb: string;
  account_number: string;
  swift_code: string;
  payout_email: string;
  payout_method: string;
  country: string;
  abn: string;
  gst_registered: boolean;
  notes: string;
}

type FieldErrors = Partial<Record<keyof PayoutForm, string>>;

const EMPTY: PayoutForm = {
  account_name: "",
  bank_name: "",
  bsb: "",
  account_number: "",
  swift_code: "",
  payout_email: "",
  payout_method: "bank_transfer",
  country: "Australia",
  abn: "",
  gst_registered: false,
  notes: "",
};

// Field-level validation. Bank vs PayPal requirements are enforced with a
// refinement so partners get a precise message on exactly the field to fix.
const payoutSchema = z
  .object({
    account_name: z
      .string()
      .trim()
      .min(2, "Enter the account or payee name (at least 2 characters).")
      .max(120, "Keep the name under 120 characters."),
    payout_method: z.enum(["bank_transfer", "paypal"]),
    bank_name: z.string().trim().max(120, "Keep the bank name under 120 characters.").optional(),
    bsb: z.string().trim().optional(),
    account_number: z.string().trim().optional(),
    swift_code: z.string().trim().optional(),
    payout_email: z.string().trim().optional(),
    country: z.string().trim().max(80, "Keep the country under 80 characters.").optional(),
    abn: z.string().trim().optional(),
    gst_registered: z.boolean(),
    notes: z.string().trim().max(1000, "Keep notes under 1000 characters.").optional(),
  })
  .superRefine((val, ctx) => {
    if (val.payout_method === "bank_transfer") {
      const bsbDigits = (val.bsb ?? "").replace(/\D/g, "");
      if (!val.bsb || val.bsb.trim().length === 0) {
        ctx.addIssue({ code: "custom", path: ["bsb"], message: "BSB is required for bank transfers." });
      } else if (bsbDigits.length !== 6) {
        ctx.addIssue({ code: "custom", path: ["bsb"], message: "BSB must be 6 digits (e.g. 062-000)." });
      }

      const acctDigits = (val.account_number ?? "").replace(/\D/g, "");
      if (!val.account_number || val.account_number.trim().length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["account_number"],
          message: "Account number is required for bank transfers.",
        });
      } else if (acctDigits.length < 5 || acctDigits.length > 12) {
        ctx.addIssue({
          code: "custom",
          path: ["account_number"],
          message: "Account number should be 5–12 digits.",
        });
      }

      // SWIFT code is optional but must be valid when provided.
      if (val.swift_code && val.swift_code.trim().length > 0) {
        const normalized = val.swift_code.trim().toUpperCase();
        if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(normalized)) {
          ctx.addIssue({
            code: "custom",
            path: ["swift_code"],
            message: "SWIFT code must be 8 or 11 characters (e.g. CTBAAU2S or CTBAAU2SXXX).",
          });
        }
      }
    } else {
      if (!val.payout_email || val.payout_email.trim().length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["payout_email"],
          message: "PayPal email is required.",
        });
      } else if (!z.string().email().safeParse(val.payout_email).success) {
        ctx.addIssue({
          code: "custom",
          path: ["payout_email"],
          message: "Enter a valid email address (e.g. you@example.com).",
        });
      }
    }

    // ABN is optional, but if provided it must be 11 digits.
    if (val.abn && val.abn.trim().length > 0) {
      const abnDigits = val.abn.replace(/\D/g, "");
      if (abnDigits.length !== 11) {
        ctx.addIssue({ code: "custom", path: ["abn"], message: "An ABN is 11 digits." });
      }
    }
  });

export default function PaymentDetails() {
  const { user } = useUserAuth();
  const { profile, updateOnboarding } = usePartnerPortal();
  const { toast } = useToast();

  const [form, setForm] = useState<PayoutForm>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof PayoutForm, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user) return;
      setLoading(true);
      setLoadError(false);
      try {
        const { data, error } = await supabase
          .from("partner_payout_details")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (active && data) {
          setForm({
            account_name: data.account_name ?? "",
            bank_name: data.bank_name ?? "",
            bsb: data.bsb ?? "",
            account_number: data.account_number ?? "",
            swift_code: data.swift_code ?? "",
            payout_email: data.payout_email ?? "",
            payout_method: data.payout_method ?? "bank_transfer",
            country: data.country ?? "Australia",
            abn: data.abn ?? "",
            gst_registered: data.gst_registered ?? false,
            notes: data.notes ?? "",
          });
        }
      } catch (err) {
        console.error("Failed to load payout details", err);
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user]);

  // Compute current validation result so we can surface errors live.
  const validation = useMemo(() => payoutSchema.safeParse(form), [form]);
  const allErrors: FieldErrors = useMemo(() => {
    if (validation.success) return {};
    const out: FieldErrors = {};
    for (const issue of validation.error.issues) {
      const key = issue.path[0] as keyof PayoutForm;
      if (key && !out[key]) out[key] = issue.message;
    }
    return out;
  }, [validation]);

  const set = <K extends keyof PayoutForm>(key: K, value: PayoutForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    // Clear the visible error for this field as soon as the user edits it.
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const markTouched = (key: keyof PayoutForm) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors((e) => ({ ...e, [key]: allErrors[key] }));
  };

  // Only show an error when the field has been touched or a save was attempted.
  const errorFor = (key: keyof PayoutForm) =>
    touched[key] || errors[key] ? errors[key] ?? allErrors[key] : undefined;

  const isBank = form.payout_method === "bank_transfer";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validation.success) {
      // Reveal every field error at once and focus the first invalid field.
      setErrors(allErrors);
      setTouched(
        Object.keys(allErrors).reduce(
          (acc, k) => ({ ...acc, [k]: true }),
          {} as Partial<Record<keyof PayoutForm, boolean>>,
        ),
      );
      const firstKey = Object.keys(allErrors)[0];
      if (firstKey) {
        document.getElementById(`field-${firstKey}`)?.focus();
      }
      toast({
        variant: "destructive",
        title: "Please fix the highlighted fields",
        description: "A few details need attention before we can save.",
      });
      return;
    }

    setSaving(true);
    try {
      const clean = validation.data;
      const { error } = await supabase
        .from("partner_payout_details")
        .upsert(
          {
            user_id: user.id,
            account_name: clean.account_name,
            bank_name: clean.bank_name ?? "",
            bsb: clean.bsb ?? "",
            account_number: clean.account_number ?? "",
            swift_code: clean.swift_code ?? "",
            payout_email: clean.payout_email ?? "",
            payout_method: clean.payout_method,
            country: clean.country ?? "Australia",
            abn: clean.abn ?? "",
            gst_registered: clean.gst_registered,
            notes: clean.notes ?? "",
          },
          { onConflict: "user_id" },
        );
      if (error) throw error;

      // Mark the onboarding step complete so progress persists across devices.
      if (profile && !profile.onboarding?.payment_details) {
        await updateOnboarding({ ...(profile.onboarding ?? {}), payment_details: true });
      }

      toast({
        title: "Payment details saved",
        description: "We'll use these to pay your commission when client payments clear.",
      });
    } catch (err) {
      console.error("Failed to save payout details", err);
      const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
        "Partner portal — couldn't save payment details",
      )}&body=${encodeURIComponent(
        `I hit an error saving my payment details.\n\nPage: ${window.location.href}\n\nPlease attach a screenshot.`,
      )}`;
      toast({
        variant: "destructive",
        title: "Couldn't save your details",
        description: (
          <span>
            Please try again. If it keeps happening,{" "}
            <a className="underline" href={mailto}>
              email us
            </a>{" "}
            with a screenshot of this page.
          </span>
        ),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-portal-display text-2xl font-bold text-partner-navy">
          Payment &amp; tax details
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          So we can pay your commission as soon as a client payment clears in Stripe. Your details
          are stored securely and only visible to you and the alfred ai partner team.
        </p>
      </div>

      {loadError && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            We couldn't load your saved details. You can still enter and save them below — if it
            keeps failing,{" "}
            <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
              email us
            </a>
            .
          </p>
        </div>
      )}

      <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your details…
          </div>
        ) : (
          <form onSubmit={handleSave} noValidate className="space-y-5">
            <Field label="Payout method" htmlFor="field-payout_method">
              <select
                id="field-payout_method"
                value={form.payout_method}
                onChange={(e) => set("payout_method", e.target.value)}
                className="portal-input"
              >
                <option value="bank_transfer">Bank transfer</option>
                <option value="paypal">PayPal</option>
              </select>
            </Field>

            <Field
              label="Account / payee name"
              htmlFor="field-account_name"
              required
              error={errorFor("account_name")}
            >
              <input
                id="field-account_name"
                type="text"
                value={form.account_name}
                onChange={(e) => set("account_name", e.target.value)}
                onBlur={() => markTouched("account_name")}
                className={inputClass(errorFor("account_name"))}
                placeholder="Full legal name or business name"
                autoComplete="name"
                aria-invalid={!!errorFor("account_name")}
              />
            </Field>

            {isBank ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Bank name" htmlFor="field-bank_name" error={errorFor("bank_name")}>
                  <input
                    id="field-bank_name"
                    type="text"
                    value={form.bank_name}
                    onChange={(e) => set("bank_name", e.target.value)}
                    onBlur={() => markTouched("bank_name")}
                    className={inputClass(errorFor("bank_name"))}
                    placeholder="e.g. Commonwealth Bank"
                  />
                </Field>
                <Field label="Country" htmlFor="field-country" error={errorFor("country")}>
                  <input
                    id="field-country"
                    type="text"
                    value={form.country}
                    onChange={(e) => set("country", e.target.value)}
                    onBlur={() => markTouched("country")}
                    className={inputClass(errorFor("country"))}
                  />
                </Field>
                <Field label="BSB" htmlFor="field-bsb" required error={errorFor("bsb")}>
                  <input
                    id="field-bsb"
                    type="text"
                    inputMode="numeric"
                    value={form.bsb}
                    onChange={(e) => set("bsb", e.target.value)}
                    onBlur={() => markTouched("bsb")}
                    className={inputClass(errorFor("bsb"))}
                    placeholder="062-000"
                    aria-invalid={!!errorFor("bsb")}
                  />
                </Field>
                <Field
                  label="Account number"
                  htmlFor="field-account_number"
                  required
                  error={errorFor("account_number")}
                >
                  <input
                    id="field-account_number"
                    type="text"
                    inputMode="numeric"
                    value={form.account_number}
                    onChange={(e) => set("account_number", e.target.value)}
                    onBlur={() => markTouched("account_number")}
                    className={inputClass(errorFor("account_number"))}
                    placeholder="Account number"
                    aria-invalid={!!errorFor("account_number")}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field
                    label="SWIFT / BIC code (optional)"
                    htmlFor="field-swift_code"
                    error={errorFor("swift_code")}
                  >
                    <input
                      id="field-swift_code"
                      type="text"
                      value={form.swift_code}
                      onChange={(e) => set("swift_code", e.target.value)}
                      onBlur={() => markTouched("swift_code")}
                      className={inputClass(errorFor("swift_code"))}
                      placeholder="e.g. CTBAAU2S"
                      aria-invalid={!!errorFor("swift_code")}
                    />
                  </Field>
                </div>
              </div>
            ) : (
              <Field
                label="PayPal email"
                htmlFor="field-payout_email"
                required
                error={errorFor("payout_email")}
              >
                <input
                  id="field-payout_email"
                  type="email"
                  value={form.payout_email}
                  onChange={(e) => set("payout_email", e.target.value)}
                  onBlur={() => markTouched("payout_email")}
                  className={inputClass(errorFor("payout_email"))}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={!!errorFor("payout_email")}
                />
              </Field>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="ABN (if registered)" htmlFor="field-abn" error={errorFor("abn")}>
                <input
                  id="field-abn"
                  type="text"
                  inputMode="numeric"
                  value={form.abn}
                  onChange={(e) => set("abn", e.target.value)}
                  onBlur={() => markTouched("abn")}
                  className={inputClass(errorFor("abn"))}
                  placeholder="00 000 000 000"
                  aria-invalid={!!errorFor("abn")}
                />
              </Field>
              <label className="flex items-center gap-3 self-end pb-2.5">
                <input
                  type="checkbox"
                  checked={form.gst_registered}
                  onChange={(e) => set("gst_registered", e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-partner-teal focus:ring-partner-teal"
                />
                <span className="text-sm text-partner-navy">I'm registered for GST</span>
              </label>
            </div>

            <Field label="Notes (optional)" htmlFor="field-notes" error={errorFor("notes")}>
              <textarea
                id="field-notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                onBlur={() => markTouched("notes")}
                className={`${inputClass(errorFor("notes"))} min-h-[80px]`}
                placeholder="Anything we should know about paying you"
              />
            </Field>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">
                Fields marked with <span className="text-partner-pink">*</span> are required.
              </p>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-partner-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-partner-teal/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Save payment details
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Card>

      <InvoiceEmailCard form={form} />
    </div>
  );
}

function InvoiceEmailCard({ form }: { form: PayoutForm }) {
  const subject = `Partner invoice / Stripe payment link — ${form.account_name || "Consulting Partner"}`;
  const body = [
    "Hi alfred ai Accounts team,",
    "",
    "Please find my Stripe invoice / payment link attached for my partner commission.",
    "",
    `Payee name: ${form.account_name || "(add your name)"}`,
    form.abn ? `ABN: ${form.abn}` : "ABN: (if applicable)",
    `GST registered: ${form.gst_registered ? "Yes" : "No"}`,
    form.swift_code ? `SWIFT / BIC code: ${form.swift_code}` : "SWIFT / BIC code: (if applicable)",
    "",
    "Stripe invoice / payment link: (paste your Stripe invoice URL or attach the PDF here)",
    "",
    "Thank you,",
    form.account_name || "",
  ].join("\n");

  const mailto = `mailto:${ACCOUNTS_EMAIL}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;

  return (
    <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-portal-display text-base font-semibold text-partner-navy">
            Send your Stripe invoice / payment link
          </h2>
          <p className="text-sm text-slate-500">
            Email your Stripe invoice or payment link to{" "}
            <a className="font-medium text-partner-teal underline" href={`mailto:${ACCOUNTS_EMAIL}`}>
              {ACCOUNTS_EMAIL}
            </a>{" "}
            so we can process your commission once the client payment clears. The button below
            opens a pre-filled email — just attach the invoice or paste your Stripe link.
          </p>
        </div>
        <a
          href={mailto}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border border-partner-teal/40 bg-white px-5 py-2.5 text-sm font-semibold text-partner-teal transition-colors hover:bg-partner-teal/10"
        >
          <Mail className="h-4 w-4" />
          Email accounts team
        </a>
      </div>
    </Card>
  );
}


function inputClass(error?: string) {
  return `portal-input${error ? " border-red-400 focus:border-red-400 focus:ring-red-400" : ""}`;
}

function Field({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-partner-navy">
        {label} {required && <span className="text-partner-pink">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
