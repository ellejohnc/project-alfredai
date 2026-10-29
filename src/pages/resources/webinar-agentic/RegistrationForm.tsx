import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, CalendarPlus, Users, ArrowRight, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { webinarConfig } from "./config";
import { trackWebinar, downloadICS } from "./lib";
import { getUTMData } from "@/lib/utmTracking";

const schema = z
  .object({
    first_name: z.string().trim().min(1, "First name is required").max(100),
    last_name: z.string().trim().min(1, "Last name is required").max(100),
    email: z.string().trim().email("Enter a valid email address").max(254),
    phone: z.string().trim().min(1, "Phone number is required").max(40),
    company: z.string().trim().min(1, "Company name is required").max(200),
    role: z.string().trim().min(1, "Role is required").max(120),
    industry: z.string().trim().min(1, "Industry is required").max(120),
    country: z.string().trim().min(1, "Please select your country").max(80),
    country_other: z.string().trim().max(120).optional().or(z.literal("")),
    business_size: z.string().trim().min(1, "Please select your business size").max(60),
    business_size_other: z.string().trim().max(120).optional().or(z.literal("")),
    turnover: z.string().trim().min(1, "Please select your annual turnover").max(60),
    turnover_other: z.string().trim().max(120).optional().or(z.literal("")),
    ai_interest: z.string().trim().max(120).optional().or(z.literal("")),
    ai_interest_other: z.string().trim().max(120).optional().or(z.literal("")),
    repetitive_workflow: z.string().trim().min(1, "This field is required").max(1000),
    consent: z.literal(true, { errorMap: () => ({ message: "Please tick the consent box to register" }) }),
  })
  .refine((d) => d.business_size !== "Other" || (d.business_size_other?.trim().length ?? 0) > 0, {
    path: ["business_size_other"],
    message: "Please specify your business size",
  })
  .refine((d) => d.turnover !== "Other" || (d.turnover_other?.trim().length ?? 0) > 0, {
    path: ["turnover_other"],
    message: "Please specify your annual turnover",
  })
  .refine((d) => d.country !== "Other" || (d.country_other?.trim().length ?? 0) > 0, {
    path: ["country_other"],
    message: "Please specify your country",
  });


type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  industry: string;
  country: string;
  country_other: string;
  business_size: string;
  business_size_other: string;
  turnover: string;
  turnover_other: string;
  ai_interest: string;
  ai_interest_other: string;
  repetitive_workflow: string;
  consent: boolean;
};

const initialState: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  company: "",
  role: "",
  industry: "",
  country: "",
  country_other: "",
  business_size: "",
  business_size_other: "",
  turnover: "",
  turnover_other: "",
  ai_interest: "",
  ai_interest_other: "",
  repetitive_workflow: "",
  consent: false,
};

const inputClass =
  "w-full min-h-[48px] rounded-xl border border-neutral-300 bg-white px-4 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-colors";

const RegistrationForm = () => {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);

  const update = (key: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (!started) {
      setStarted(true);
      trackWebinar("form_start");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Please check the highlighted fields.");
      return;
    }
    setErrors({});
    setSubmitting(true);
    trackWebinar("form_submit");

    const utm = (() => {
      try {
        return getUTMData() as Record<string, string | undefined>;
      } catch {
        return {} as Record<string, string | undefined>;
      }
    })();

    const resolvedBusinessSize =
      parsed.data.business_size === "Other"
        ? parsed.data.business_size_other || "Other"
        : parsed.data.business_size;
    const resolvedTurnover =
      parsed.data.turnover === "Other"
        ? parsed.data.turnover_other || "Other"
        : parsed.data.turnover;
    const resolvedCountry =
      parsed.data.country === "Other"
        ? parsed.data.country_other || "Other"
        : parsed.data.country;
    const resolvedAiInterest = parsed.data.repetitive_workflow;

    try {
      const { data, error } = await supabase.functions.invoke("register-webinar", {
        body: {
          webinar_slug: webinarConfig.slug,
          ...parsed.data,
          business_size: resolvedBusinessSize,
          turnover: resolvedTurnover,
          country: resolvedCountry,
          ai_interest: resolvedAiInterest,
          last_name: form.last_name,
          utm_source: utm.utm_source ?? null,
          utm_medium: utm.utm_medium ?? null,
          utm_campaign: utm.utm_campaign ?? null,
          webinar_title: webinarConfig.title,
          webinar_date_label: webinarConfig.details.dateLabel,
          webinar_time_label: webinarConfig.details.timeLabel,
          join_url: webinarConfig.details.joinUrl,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || "Registration failed");
      }
      setDone(true);
      toast.success("You're registered!");
    } catch (err) {
      const pageUrl = typeof window !== "undefined" ? window.location.href : "";
      toast.error("We couldn't complete your registration.", {
        description: "Please try again, or email us and we'll register you manually.",
        action: {
          label: "Email us",
          onClick: () => {
            window.location.href = `mailto:${webinarConfig.brand.contactEmail}?subject=${encodeURIComponent(
              "Webinar registration issue",
            )}&body=${encodeURIComponent(
              `I had trouble registering on ${pageUrl}. Please register me. Name: ${form.first_name} ${form.last_name}, Email: ${form.email}.`,
            )}`;
          },
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCalendar = () => {
    trackWebinar("add_to_calendar_click");
    downloadICS({
      title: webinarConfig.title,
      description: `${webinarConfig.subtitle}\n\nJoin: ${webinarConfig.details.joinUrl}`,
      startISO: webinarConfig.details.startISO,
      endISO: webinarConfig.details.endISO,
      url: webinarConfig.details.joinUrl,
    });
  };

  const handleInvite = async () => {
    const url = typeof window !== "undefined" ? window.location.href : webinarConfig.details.joinUrl;
    const shareTitle = "AI for SMEs Webinar — worth a look";
    const shareText =
      "I just registered for this free 60-minute webinar on using AI to get more leads, improve sales follow-up and reduce admin. Thought you'd find it useful:";

    // 1. Native share sheet (best on mobile/touch)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return; // user cancelled
        // otherwise fall through to clipboard
      }
    }

    // 2. Copy link to clipboard
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied — share it with a friend", { description: url });
        return;
      } catch {
        // fall through to email
      }
    }

    // 3. Final fallback: email draft
    toast.error("We couldn't open the share menu — opening email instead.", { description: url });
    window.location.href = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(
      `${shareText}\n\n${url}`,
    )}`;
  };

  const handleBookReview = () => {
    trackWebinar("opportunity_review_click");
    window.location.href = webinarConfig.brand.bookingUrl;
  };

  if (done) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-pink-200 bg-pink-50/60 p-8 text-center shadow-sm md:p-12">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-pink-500 text-white">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-bold text-neutral-900 md:text-3xl">{webinarConfig.form.success.heading}</h3>
        <p className="mt-3 text-[15px] text-neutral-600">{webinarConfig.form.success.body}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={handleAddToCalendar}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-pink-500 px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-pink-700"
          >
            <CalendarPlus className="h-5 w-5" /> Add to Calendar
          </button>
          <button
            onClick={handleInvite}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-[15px] font-semibold text-neutral-800 transition-colors hover:border-pink-500 hover:text-pink-700"
          >
            <Users className="h-5 w-5" /> Invite a Business Friend
          </button>
          <button
            onClick={handleBookReview}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#EC4899]/40 bg-[#EC4899]/5 px-6 py-3 text-[15px] font-semibold text-[#d61f63] transition-colors hover:bg-[#EC4899]/10"
          >
            Book an AI Opportunity Review <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  const fieldError = (key: string) =>
    errors[key] ? (
      <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
        <AlertCircle className="h-3.5 w-3.5" /> {errors[key]}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto max-w-2xl rounded-3xl border border-neutral-200 bg-white p-6 shadow-lg shadow-pink-900/5 md:p-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="first_name" className="mb-1.5 block text-sm font-medium text-neutral-700">First name *</label>
          <input id="first_name" className={inputClass} value={form.first_name} onChange={(e) => update("first_name", e.target.value)} autoComplete="given-name" />
          {fieldError("first_name")}
        </div>
        <div>
          <label htmlFor="last_name" className="mb-1.5 block text-sm font-medium text-neutral-700">Last name *</label>
          <input id="last_name" className={inputClass} value={form.last_name} onChange={(e) => update("last_name", e.target.value)} autoComplete="family-name" />
          {fieldError("last_name")}
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-700">Email *</label>
          <input id="email" type="email" className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" />
          {fieldError("email")}
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-neutral-700">Phone number *</label>
          <input id="phone" type="tel" className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} autoComplete="tel" />
          {fieldError("phone")}
        </div>
        <div>
          <label htmlFor="company" className="mb-1.5 block text-sm font-medium text-neutral-700">Company name *</label>
          <input id="company" className={inputClass} value={form.company} onChange={(e) => update("company", e.target.value)} autoComplete="organization" />
          {fieldError("company")}
        </div>
        <div>
          <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-neutral-700">Role *</label>
          <input id="role" className={inputClass} value={form.role} onChange={(e) => update("role", e.target.value)} autoComplete="organization-title" />
          {fieldError("role")}
        </div>
        <div>
          <label htmlFor="industry" className="mb-1.5 block text-sm font-medium text-neutral-700">Industry *</label>
          <input id="industry" className={inputClass} value={form.industry} onChange={(e) => update("industry", e.target.value)} />
          {fieldError("industry")}
        </div>
        <div>
          <label htmlFor="country" className="mb-1.5 block text-sm font-medium text-neutral-700">Country *</label>
          <select id="country" className={inputClass} value={form.country} onChange={(e) => update("country", e.target.value)}>
            <option value="">Select…</option>
            {webinarConfig.form.countries.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {form.country === "Other" && (
            <input
              className={`${inputClass} mt-2`}
              placeholder="Please specify your country"
              value={form.country_other}
              onChange={(e) => update("country_other", e.target.value)}
            />
          )}
          {fieldError("country")}
          {fieldError("country_other")}
        </div>
        <div>
          <label htmlFor="business_size" className="mb-1.5 block text-sm font-medium text-neutral-700">Business size *</label>
          <select id="business_size" className={inputClass} value={form.business_size} onChange={(e) => update("business_size", e.target.value)}>
            <option value="">Select…</option>
            {webinarConfig.form.businessSizes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {form.business_size === "Other" && (
            <input
              className={`${inputClass} mt-2`}
              placeholder="Please specify your business size"
              value={form.business_size_other}
              onChange={(e) => update("business_size_other", e.target.value)}
            />
          )}
          {fieldError("business_size")}
          {fieldError("business_size_other")}
        </div>
        <div>
          <label htmlFor="turnover" className="mb-1.5 block text-sm font-medium text-neutral-700">Annual turnover *</label>
          <select id="turnover" className={inputClass} value={form.turnover} onChange={(e) => update("turnover", e.target.value)}>
            <option value="">Select…</option>
            {webinarConfig.form.turnoverRanges.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {form.turnover === "Other" && (
            <input
              className={`${inputClass} mt-2`}
              placeholder="Please specify your annual turnover"
              value={form.turnover_other}
              onChange={(e) => update("turnover_other", e.target.value)}
            />
          )}
          {fieldError("turnover")}
          {fieldError("turnover_other")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="repetitive_workflow" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Which repetitive workflow would you most like AI to improve? *
          </label>
          <select id="repetitive_workflow" className={inputClass} value={form.repetitive_workflow} onChange={(e) => update("repetitive_workflow", e.target.value)}>
            <option value="">Select…</option>
            {webinarConfig.form.workflows.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {fieldError("repetitive_workflow")}
        </div>
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-neutral-600">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => update("consent", e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-neutral-300 text-pink-500 focus:ring-pink-500"
        />
        <span>{webinarConfig.form.consentLabel}</span>
      </label>
      {fieldError("consent")}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-pink-500 px-6 py-4 text-base font-semibold text-white shadow-md shadow-pink-500/20 transition-all hover:bg-pink-700 active:scale-[0.99] disabled:opacity-60"
      >
        {submitting ? "Registering…" : webinarConfig.form.submit}
      </button>
      <p className="mt-3 text-center text-xs text-neutral-400">{webinarConfig.hero.microcopy}</p>
    </form>
  );
};

export default RegistrationForm;
