import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Loader2, Save, CreditCard, Mail, Check, AlertCircle } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { usePartnerPortal } from "@/contexts/PartnerPortalContext";
import { useToast } from "@/hooks/use-toast";
import { CONTACT_INFO } from "@/lib/contactInfo";

const SUPPORT_EMAIL = CONTACT_INFO.email.support;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB

interface ProfileForm {
  full_name: string;
  company: string;
  phone: string;
  contact_email: string;
}

type FieldErrors = Partial<Record<keyof ProfileForm, string>>;

const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Enter your full name (at least 2 characters).")
    .max(120, "Keep your name under 120 characters."),
  company: z.string().trim().max(120, "Keep the company name under 120 characters.").optional(),
  phone: z
    .string()
    .trim()
    .max(30, "Keep the phone number under 30 characters.")
    .refine((v) => v.length === 0 || /^[+()\d\s-]{6,30}$/.test(v), "Enter a valid phone number.")
    .optional(),
  contact_email: z
    .string()
    .trim()
    .max(254, "Keep the email under 254 characters.")
    .refine(
      (v) => v.length === 0 || z.string().email().safeParse(v).success,
      "Enter a valid email address (e.g. you@example.com).",
    )
    .optional(),
});

const EMPTY: ProfileForm = { full_name: "", company: "", phone: "", contact_email: "" };

export default function ProfileSettings() {
  const { user } = useUserAuth();
  const { profile, refresh } = usePartnerPortal();
  const { toast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProfileForm>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ProfileForm, boolean>>>({});
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  // The last values we successfully persisted — used to avoid redundant saves.
  const savedRef = useRef<ProfileForm>(EMPTY);
  // Always-current form snapshot so the unmount flush saves the latest values.
  const formRef = useRef<ProfileForm>(EMPTY);
  formRef.current = form;

  // Hydrate the form from the loaded profile.
  useEffect(() => {
    if (!profile) return;
    const next: ProfileForm = {
      full_name: profile.full_name ?? "",
      company: profile.company ?? "",
      phone: profile.phone ?? "",
      contact_email: profile.contact_email ?? user?.email ?? "",
    };
    setForm(next);
    savedRef.current = next;
    setAvatarPath(profile.avatar_url ?? null);

    if (profile.updated_at) {
      const ts = Date.parse(profile.updated_at);
      if (!Number.isNaN(ts)) setSavedAt(ts);
    }
  }, [profile, user?.email]);

  // Resolve a viewable signed URL for the private avatar each time the path changes.
  useEffect(() => {
    let active = true;
    async function resolve() {
      if (!avatarPath) {
        setAvatarUrl(null);
        return;
      }
      try {
        const { data } = await supabase.storage
          .from("partner-avatars")
          .createSignedUrl(avatarPath, 60 * 60);
        if (active) setAvatarUrl(data?.signedUrl ?? null);
      } catch {
        if (active) setAvatarUrl(null);
      }
    }
    resolve();
    return () => {
      active = false;
    };
  }, [avatarPath]);

  // Live validation result for the current form.
  const allErrors: FieldErrors = useMemo(() => {
    const res = profileSchema.safeParse(form);
    if (res.success) return {};
    const out: FieldErrors = {};
    for (const issue of res.error.issues) {
      const key = issue.path[0] as keyof ProfileForm;
      if (key && !out[key]) out[key] = issue.message;
    }
    return out;
  }, [form]);

  const errorFor = (key: keyof ProfileForm) =>
    touched[key] || errors[key] ? errors[key] ?? allErrors[key] : undefined;

  const initials = (form.full_name || "Partner")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const mailtoFor = useCallback(
    (issue: string) =>
      `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Partner portal — profile error")}&body=${encodeURIComponent(
        `I ${issue}.\n\nPage: ${window.location.href}\n\nPlease attach a screenshot.`,
      )}`,
    [],
  );

  const set = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const isDirty = (values: ProfileForm) =>
    (Object.keys(values) as (keyof ProfileForm)[]).some(
      (k) => values[k].trim() !== savedRef.current[k].trim(),
    );

  // Core persistence. Returns true on success. `silent` skips the success toast
  // (used for auto-save on blur so we don't spam notifications).
  const persist = useCallback(
    async (values: ProfileForm, { silent }: { silent?: boolean } = {}): Promise<boolean> => {
      if (!user) return false;
      const parsed = profileSchema.safeParse(values);
      if (!parsed.success) return false;
      if (!isDirty(values)) return true;

      setSaving(true);
      try {
        const clean = parsed.data;
        const { error } = await supabase
          .from("partner_profiles")
          .update({
            full_name: clean.full_name,
            company: clean.company?.trim() || null,
            phone: clean.phone?.trim() || null,
            contact_email: clean.contact_email?.trim() || null,
          })
          .eq("user_id", user.id);
        if (error) throw error;

        savedRef.current = { ...values };
        setSavedAt(Date.now());
        await refresh();
        if (!silent) {
          toast({ title: "Profile saved", description: "Your details have been updated." });
        }
        return true;
      } catch (err) {
        console.error("Profile save failed", err);
        const mailto = mailtoFor("couldn't save my profile details");
        toast({
          variant: "destructive",
          title: "Couldn't save your profile",
          description: (
            <span>
              Please try again, or{" "}
              <a className="underline" href={mailto}>
                email us
              </a>{" "}
              with a screenshot.
            </span>
          ),
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [user, refresh, toast, mailtoFor],
  );

  // Auto-save when leaving a field ("click away, save all").
  const handleBlur = (key: keyof ProfileForm) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors((e) => ({ ...e, [key]: allErrors[key] }));
    // Only auto-save when the whole form is valid and something changed.
    if (Object.keys(allErrors).length === 0 && isDirty(formRef.current)) {
      void persist(formRef.current, { silent: true });
    }
  };

  // Flush any unsaved valid changes when navigating away from the page.
  useEffect(() => {
    return () => {
      const values = formRef.current;
      if (profileSchema.safeParse(values).success && isDirty(values)) {
        void persist(values, { silent: true });
      }
    };
  }, [persist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(allErrors).length > 0) {
      // Reveal every error and focus the first invalid field.
      setErrors(allErrors);
      setTouched(
        Object.keys(allErrors).reduce(
          (acc, k) => ({ ...acc, [k]: true }),
          {} as Partial<Record<keyof ProfileForm, boolean>>,
        ),
      );
      const firstKey = Object.keys(allErrors)[0];
      if (firstKey) document.getElementById(`field-${firstKey}`)?.focus();
      toast({
        variant: "destructive",
        title: "Please fix the highlighted fields",
        description: "A few details need attention before we can save.",
      });
      return;
    }
    if (!isDirty(form)) {
      toast({ title: "Nothing to save", description: "Your profile is already up to date." });
      return;
    }
    await persist(form);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Unsupported file",
        description: "Please choose an image file (PNG or JPG).",
      });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast({ variant: "destructive", title: "Image too large", description: "Please choose an image under 5MB." });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("partner-avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { error: dbErr } = await supabase
        .from("partner_profiles")
        .update({ avatar_url: path })
        .eq("user_id", user.id);
      if (dbErr) throw dbErr;

      setAvatarPath(path);
      await refresh();
      toast({ title: "Photo updated", description: "Your profile photo has been saved." });
    } catch (err) {
      console.error("Avatar upload failed", err);
      const mailto = mailtoFor("couldn't upload my profile photo");
      toast({
        variant: "destructive",
        title: "Couldn't upload photo",
        description: (
          <span>
            Please try again, or{" "}
            <a className="underline" href={mailto}>
              email us
            </a>{" "}
            with a screenshot.
          </span>
        ),
      });
    } finally {
      setUploading(false);
    }
  };

  const handlePickFile = () => fileInput.current?.click();

  // Inline error helper.
  const FieldError = ({ name }: { name: keyof ProfileForm }) => {
    const msg = errorFor(name);
    if (!msg) return null;
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive" role="alert">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        {msg}
      </p>
    );
  };

  const inputClass = (name: keyof ProfileForm) =>
    `mt-1.5 ${errorFor(name) ? "border-destructive focus-visible:ring-destructive" : ""}`;

  const dirty = isDirty(form);

  const savedAtText = useMemo(() => {
    if (!savedAt) return null;
    const date = new Date(savedAt);
    const time = format(date, "h:mm a");
    return isSameDay(date, new Date()) ? `at ${time}` : `on ${format(date, "d MMM")} at ${time}`;
  }, [savedAt]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-portal-display text-2xl font-semibold text-partner-navy">My Profile</h1>
      <p className="mt-1 text-sm text-slate-500">
        Manage your profile photo, contact details and payment information. Changes save automatically when you
        click away.
      </p>

      {/* Photo + identity */}
      <Card className="mt-6 p-5 sm:p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-partner-navy text-xl font-semibold text-white">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <button
              type="button"
              onClick={handlePickFile}
              disabled={uploading}
              aria-label="Change profile photo"
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-partner-pink text-white shadow-md transition-colors hover:bg-partner-pink-hover disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
          </div>
          <div className="text-center sm:text-left">
            <p className="font-portal-display text-lg font-semibold text-partner-navy">
              {form.full_name || "Partner"}
            </p>
            <p className="text-sm text-slate-500">{form.company || "—"}</p>
            <button
              type="button"
              onClick={handlePickFile}
              disabled={uploading}
              className="mt-2 text-sm font-medium text-partner-pink hover:underline"
            >
              {uploading ? "Uploading…" : "Change photo"}
            </button>
          </div>
        </div>
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </Card>

      {/* Contact details */}
      <form onSubmit={handleSubmit}>
        <Card className="mt-6 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-portal-display text-base font-semibold text-partner-navy">Contact details</h2>
            <span className="flex items-center gap-1.5 text-xs font-medium">
              {saving ? (
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                </span>
              ) : !dirty && savedAt ? (
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <Check className="h-3.5 w-3.5" /> Last saved {savedAtText}
                </span>
              ) : dirty ? (
                <span className="text-amber-600">Unsaved changes</span>
              ) : null}
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="field-full_name">Full name</Label>
              <Input
                id="field-full_name"
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                onBlur={() => handleBlur("full_name")}
                className={inputClass("full_name")}
                autoComplete="name"
                aria-invalid={!!errorFor("full_name")}
              />
              <FieldError name="full_name" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="field-company">Company</Label>
              <Input
                id="field-company"
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                onBlur={() => handleBlur("company")}
                className={inputClass("company")}
                autoComplete="organization"
                aria-invalid={!!errorFor("company")}
              />
              <FieldError name="company" />
            </div>
            <div>
              <Label htmlFor="field-phone">Phone</Label>
              <Input
                id="field-phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                onBlur={() => handleBlur("phone")}
                className={inputClass("phone")}
                inputMode="tel"
                autoComplete="tel"
                placeholder="+61 ..."
                aria-invalid={!!errorFor("phone")}
              />
              <FieldError name="phone" />
            </div>
            <div>
              <Label htmlFor="field-contact_email">Contact email</Label>
              <Input
                id="field-contact_email"
                value={form.contact_email}
                onChange={(e) => set("contact_email", e.target.value)}
                onBlur={() => handleBlur("contact_email")}
                className={inputClass("contact_email")}
                inputMode="email"
                autoComplete="email"
                aria-invalid={!!errorFor("contact_email")}
              />
              <FieldError name="contact_email" />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-partner-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-partner-navy/90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </button>
        </Card>
      </form>

      {/* Payment details link */}
      <Card className="mt-6 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-partner-pink/10 text-partner-pink">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="font-portal-display text-base font-semibold text-partner-navy">Payment details</p>
              <p className="text-sm text-slate-500">
                Set how we pay your commission when client payments clear.
              </p>
            </div>
          </div>
          <Link
            to="/partners/portal/payment-details"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-partner-navy transition-colors hover:bg-slate-50"
          >
            Manage payment details
          </Link>
        </div>
      </Card>

      {/* Help / fallback */}
      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
        <Mail className="h-3.5 w-3.5" />
        Having trouble?{" "}
        <a className="underline" href={mailtoFor("need help with my profile")}>
          Email support
        </a>
      </p>
    </div>
  );
}
