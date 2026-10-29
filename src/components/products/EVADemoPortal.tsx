import { useEffect, useRef, useState } from "react";
import { getVisitorId } from '@/lib/visitorId';
import { motion } from "framer-motion";
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  Maximize2,
  ExternalLink,
  Lock,
  AlertTriangle,
  MousePointerClick,
  Mail,
  Send,
  Building2,
  User,
  Phone,
  Briefcase,
  Factory,
  ShieldCheck,
  Users,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CONTACT_INFO } from "@/lib/contactInfo";
import { logGHLSubmission } from "@/hooks/useGHLLogging";
import { getLeadIdentitySync } from "@/hooks/useLeadIdentity";
import { getUTMData } from "@/lib/utmTracking";
import { useToast } from "@/hooks/use-toast";
import { businessEmailSchema } from "@/lib/emailValidation";
import { cn } from "@/lib/utils";
import {
  COUNTRY_CODES,
  detectCountryFromLocale,
  getCountryByCode,
  formatPhoneDisplay,
  validatePhoneForCountry,
  formatInternationalPhone,
} from "@/lib/phoneUtils";

const QUALIFICATION_QUESTIONS = [
  {
    id: "role",
    label: "Your role",
    icon: Briefcase,
    options: ["CEO / Founder", "CFO", "CTO / CISO", "Operations Leader", "Project Manager", "Compliance / Risk", "Legal", "HR / People Ops", "Other"],
  },
  {
    id: "industry",
    label: "Industry",
    icon: Factory,
    options: ["Construction & Contracting", "Property Services", "Professional Services", "Insurance & Risk", "Marketing Agency", "Associations & Charities", "Government", "Other"],
  },
  {
    id: "challenge",
    label: "Biggest AI governance concern",
    icon: ShieldCheck,
    options: ["Enterprise data leaking to personal AI", "Personal AI memory entering company work", "No visibility over AI usage", "Compliance & audit gaps", "Lack of approval workflows", "Employee misuse of AI tools", "Other"],
  },
  {
    id: "size",
    label: "Team size",
    icon: Users,
    options: ["1-10 employees", "11-50 employees", "51-200 employees", "200+ employees"],
  },
  {
    id: "timeline",
    label: "Timeline to get started",
    icon: Clock,
    options: ["Immediately / ASAP", "Next quarter", "Exploring options"],
  },
] as const;

const PORTAL_URL = "https://eva.alfredai.app/demo";

const SUPPORT_EMAIL = CONTACT_INFO.email.support;
const LOAD_TIMEOUT_MS = 14000;

type DeviceKey = "desktop" | "tablet" | "mobile";

const DEVICES: Record<
  DeviceKey,
  { label: string; icon: typeof Monitor; width: string; ratio: string }
> = {
  desktop: { label: "Desktop", icon: Monitor, width: "100%", ratio: "4 / 3" },
  tablet: { label: "Tablet", icon: Tablet, width: "1024px", ratio: "4 / 3" },
  mobile: { label: "Mobile", icon: Smartphone, width: "375px", ratio: "9 / 16" },
};

const EVADemoPortal = () => {
  const [device, setDevice] = useState<DeviceKey>("desktop");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setStatus("loading");
    timeoutRef.current = setTimeout(() => {
      setStatus((prev) => (prev === "ready" ? prev : "error"));
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timeoutRef.current);
  }, [reloadKey]);

  const handleLoaded = () => {
    clearTimeout(timeoutRef.current);
    setStatus("ready");
  };

  const reload = () => setReloadKey((k) => k + 1);

  const enterFullscreen = () => {
    const el = wrapperRef.current;
    if (el?.requestFullscreen) {
      el.requestFullscreen().catch(() => window.open(PORTAL_URL, "_blank", "noopener"));
    } else {
      window.open(PORTAL_URL, "_blank", "noopener");
    }
  };

  const reportError = () => {
    const subject = encodeURIComponent("EVA demo portal — loading issue");
    const body = encodeURIComponent(
      `Hi alfred ai team,\n\nI had trouble loading the EVA demo portal.\n\nPage: ${typeof window !== "undefined" ? window.location.href : "/products/eva"}\nPortal: ${PORTAL_URL}\n\n(Please attach a screenshot of the page.)\n\nThanks,`,
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const [showLeadDialog, setShowLeadDialog] = useState(false);
  const [leadStep, setLeadStep] = useState(0);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [countryCode, setCountryCode] = useState("AU");
  const [qualification, setQualification] = useState<Record<string, string>>({});
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const STEP_ONE_QUESTIONS = QUALIFICATION_QUESTIONS.slice(0, 4);
  const STEP_TWO_QUESTIONS = QUALIFICATION_QUESTIONS.slice(4);
  const TOTAL_STEPS = 3;

  useEffect(() => {
    const identity = getLeadIdentitySync();
    const fullName = identity.name || `${identity.firstName || ""} ${identity.lastName || ""}`.trim();
    if (fullName) setLeadName(fullName);
    if (identity.email) setLeadEmail(identity.email);
    if (identity.company) setLeadCompany(identity.company);
    if (identity.phone) setLeadPhone(identity.phone);
    setCountryCode(detectCountryFromLocale());
  }, []);

  const validateField = (field: "name" | "email" | "phone" | "company", value: string): string => {
    if (field === "name") {
      if (!value.trim()) return "Full name is required";
      if (value.trim().length < 2) return "Name must be at least 2 characters";
      return "";
    }
    if (field === "email") {
      if (!value.trim()) return "Work email is required";
      const result = businessEmailSchema.safeParse(value);
      if (!result.success) {
        return result.error.errors[0]?.message || "Please use your work email";
      }
      return "";
    }
    if (field === "phone") {
      if (!value.trim()) return "Mobile number is required";
      const validation = validatePhoneForCountry(value, countryCode);
      if (!validation.isValid) return validation.error || "Invalid mobile number";
      return "";
    }
    if (field === "company") {
      if (!value.trim()) return "Company is required";
      if (value.trim().length < 2) return "Company must be at least 2 characters";
      return "";
    }
    return "";
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 0) {
      const emailError = validateField("email", leadEmail);
      if (emailError) newErrors.email = emailError;
      setTouched((prev) => ({ ...prev, email: true }));
      STEP_ONE_QUESTIONS.forEach((q) => {
        if (!qualification[q.id]) newErrors[q.id] = `Please select your ${q.label.toLowerCase()}`;
      });
    } else if (step === 1) {
      STEP_TWO_QUESTIONS.forEach((q) => {
        if (!qualification[q.id]) newErrors[q.id] = `Please select your ${q.label.toLowerCase()}`;
      });
    } else if (step === 2) {
      const nameError = validateField("name", leadName);
      const companyError = validateField("company", leadCompany);
      const phoneError = validateField("phone", leadPhone);
      if (nameError) newErrors.name = nameError;
      if (companyError) newErrors.company = companyError;
      if (phoneError) newErrors.phone = phoneError;
      setTouched((prev) => ({ ...prev, name: true, company: true, phone: true }));
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const goToNextStep = () => {
    if (!validateStep(leadStep)) return;
    setLeadStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const goToPrevStep = () => setLeadStep((s) => Math.max(s - 1, 0));

  const openPortalAfterLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(2)) return;

    setIsSubmittingLead(true);
    try {
      const utmData = getUTMData();
      const formattedPhone = leadPhone.trim()
        ? formatInternationalPhone(leadPhone.trim(), countryCode)
        : undefined;
      await logGHLSubmission({
        lead_email: leadEmail.trim(),
        lead_name: leadName.trim(),
        lead_company: leadCompany.trim(),
        lead_phone: formattedPhone,
        source_page: window.location.pathname,
        source_medium: "eva_portal_gate",
        source_campaign: "eva_demo_portal_open",
        lead_source: "demo_share",
          visitor_id: getVisitorId(),
        ghl_status: "submitted",
        qualification_data: { ...qualification },
        utm_data: utmData as Record<string, unknown>,
      });

      localStorage.setItem(
        "alfred_lead_identity",
        JSON.stringify({
          name: leadName.trim(),
          email: leadEmail.trim(),
          company: leadCompany.trim(),
          phone: formattedPhone,
        })
      );

      toast({
        title: "Access granted",
        description: "Opening the EVA Security Guard demo in a new tab.",
      });

      setShowLeadDialog(false);
      window.open(PORTAL_URL, "_blank", "noopener");
    } catch {
      toast({
        title: "Submission failed",
        description: "Please try again or email us for help.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const active = DEVICES[device];

  return (
    <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mb-7"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            <MousePointerClick className="w-3.5 h-3.5" />
            Interactive demo
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            Try the EVA Security Guard live
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            This is the live EVA demo, embedded right here. Explore the actual interface —
            see how enterprise data is protected, redacted, and approved before anything crosses.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
          className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden"
        >
          {/* Browser chrome / toolbar */}
          <div className="flex items-center gap-3 border-b border-border bg-background/70 px-3 sm:px-4 py-2.5">
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-muted-foreground/30" />
              <span className="w-3 h-3 rounded-full bg-muted-foreground/30" />
              <span className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="flex-1 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 min-w-0">
              <Lock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-xs text-muted-foreground truncate">EVA Secure Demo</span>
            </div>

            {/* Device toggles */}
            <div className="hidden md:flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
              {(Object.keys(DEVICES) as DeviceKey[]).map((key) => {
                const D = DEVICES[key];
                const Icon = D.icon;
                const isActive = key === device;
                return (
                  <button
                    key={key}
                    onClick={() => setDevice(key)}
                    aria-label={D.label}
                    title={D.label}
                    className={`flex items-center justify-center w-9 h-9 rounded-md transition-colors ${
                      isActive
                        ? "bg-background text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${key === "tablet" ? "rotate-90" : ""}`} />
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={reload}
                aria-label="Reload"
                title="Reload"
                className="flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={enterFullscreen}
                aria-label="Fullscreen"
                title="Fullscreen"
                className="hidden sm:flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowLeadDialog(true)}
                aria-label="Open in new tab"
                title="Open in new tab"
                className="flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Portal viewport */}
          <div ref={wrapperRef} className="relative bg-background flex justify-center p-3 sm:p-5">
            <div
              className="relative w-full transition-all duration-300"
              style={{ maxWidth: active.width }}
            >
              <div
                className="relative w-full overflow-hidden rounded-xl border border-border bg-muted/40"
                style={{ aspectRatio: active.ratio }}
              >
                {status !== "error" && (
                  <iframe
                    key={reloadKey}
                    src={PORTAL_URL}
                    title="EVA Security Guard — live interactive demo"
                    onLoad={handleLoaded}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                )}

                {/* Loading overlay */}
                {status === "loading" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/90">
                    <span className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin" />
                    <p className="text-xs text-muted-foreground">Loading EVA Security Guard…</p>
                  </div>
                )}

                {/* Error / fallback overlay */}
                {status === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
                    <AlertTriangle className="w-9 h-9 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        The live demo didn't load here
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                        Some browsers block embedded apps. You can open the EVA demo
                        directly, retry, or let us know so we can help.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                      <Button
                        variant="cta"
                        size="sm"
                        className="min-h-[44px] flex-1"
                        onClick={() => window.open(PORTAL_URL, "_blank", "noopener")}
                      >
                        Open EVA Demo
                        <ExternalLink className="w-4 h-4 ml-1.5" />
                      </Button>
                      <Button
                        variant="cta-outline"
                        size="sm"
                        className="min-h-[44px] flex-1"
                        onClick={reload}
                      >
                        <RotateCw className="w-4 h-4 mr-1.5" />
                        Retry
                      </Button>
                    </div>
                    <button
                      onClick={reportError}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Report this issue
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer hint */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-border bg-background/70 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Live, on-brand demo of the actual product — interact freely.
            </p>
            <button
              onClick={() => setShowLeadDialog(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline min-h-[44px]"
            >
              Open full screen
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Lead capture dialog — 3-step wizard */}
      <Dialog
        open={showLeadDialog}
        onOpenChange={(open) => {
          if (isSubmittingLead) return;
          setShowLeadDialog(open);
          if (!open) setLeadStep(0);
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Open EVA Demo</DialogTitle>
            <DialogDescription>
              {leadStep === 0 && "A few quick questions so we can tailor your live walkthrough."}
              {leadStep === 1 && "One last thing about your timeline."}
              {leadStep === 2 && "Your details to unlock the live demo."}
            </DialogDescription>
          </DialogHeader>

          {/* Step progress indicator */}
          <div className="flex items-center gap-2 mt-1" aria-label={`Step ${leadStep + 1} of ${TOTAL_STEPS}`}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i <= leadStep ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Step {leadStep + 1} of {TOTAL_STEPS}
          </p>

          <form onSubmit={openPortalAfterLead} className="space-y-4 mt-2" noValidate>
            {/* Step 1: work email as the first question */}
            {leadStep === 0 && (
              <div className="space-y-2">
                <Label htmlFor="lead-email" className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  Work email
                </Label>
                <Input
                  id="lead-email"
                  type="email"
                  placeholder="you@company.com"
                  value={leadEmail}
                  disabled={isSubmittingLead}
                  onChange={(e) => {
                    setLeadEmail(e.target.value);
                    if (touched.email) {
                      setErrors((prev) => ({ ...prev, email: validateField("email", e.target.value) }));
                    }
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, email: true }));
                    setErrors((prev) => ({ ...prev, email: validateField("email", leadEmail) }));
                  }}
                  className={cn("min-h-[44px]", touched.email && errors.email && "border-destructive focus-visible:ring-destructive")}
                  aria-invalid={touched.email && !!errors.email}
                  aria-describedby={touched.email && errors.email ? "lead-email-error" : undefined}
                />
                {touched.email && errors.email && (
                  <p id="lead-email-error" className="text-xs text-destructive font-medium">
                    {errors.email}
                  </p>
                )}
              </div>
            )}
            {/* Step 1 & 2: qualification questions */}
            {(leadStep === 0 ? STEP_ONE_QUESTIONS : leadStep === 1 ? STEP_TWO_QUESTIONS : []).map((q) => {
              const Icon = q.icon;
              return (
                <div key={q.id} className="space-y-2">
                  <Label htmlFor={`lead-${q.id}`} className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    {q.label}
                  </Label>
                  <Select
                    value={qualification[q.id] || ""}
                    disabled={isSubmittingLead}
                    onValueChange={(value) => {
                      setQualification((prev) => ({ ...prev, [q.id]: value }));
                      setErrors((prev) => ({ ...prev, [q.id]: "" }));
                    }}
                  >
                    <SelectTrigger
                      id={`lead-${q.id}`}
                      className={cn("min-h-[44px]", errors[q.id] && "border-destructive focus:ring-destructive")}
                      aria-invalid={!!errors[q.id]}
                    >
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {q.options.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[q.id] && (
                    <p className="text-xs text-destructive font-medium">{errors[q.id]}</p>
                  )}
                </div>
              );
            })}

            {/* Step 3: contact details */}
            {leadStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="lead-name" className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    Full name
                  </Label>
                  <Input
                    id="lead-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={leadName}
                    disabled={isSubmittingLead}
                    onChange={(e) => {
                      setLeadName(e.target.value);
                      if (touched.name) {
                        setErrors((prev) => ({ ...prev, name: validateField("name", e.target.value) }));
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, name: true }));
                      setErrors((prev) => ({ ...prev, name: validateField("name", leadName) }));
                    }}
                    className={cn("min-h-[44px]", touched.name && errors.name && "border-destructive focus-visible:ring-destructive")}
                    aria-invalid={touched.name && !!errors.name}
                    aria-describedby={touched.name && errors.name ? "lead-name-error" : undefined}
                  />
                  {touched.name && errors.name && (
                    <p id="lead-name-error" className="text-xs text-destructive font-medium">
                      {errors.name}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-company" className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    Company
                  </Label>
                  <Input
                    id="lead-company"
                    type="text"
                    placeholder="Company name"
                    value={leadCompany}
                    disabled={isSubmittingLead}
                    onChange={(e) => {
                      setLeadCompany(e.target.value);
                      if (touched.company) {
                        setErrors((prev) => ({ ...prev, company: validateField("company", e.target.value) }));
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, company: true }));
                      setErrors((prev) => ({ ...prev, company: validateField("company", leadCompany) }));
                    }}
                    className={cn("min-h-[44px]", touched.company && errors.company && "border-destructive focus-visible:ring-destructive")}
                    aria-invalid={touched.company && !!errors.company}
                    aria-describedby={touched.company && errors.company ? "lead-company-error" : undefined}
                  />
                  {touched.company && errors.company && (
                    <p id="lead-company-error" className="text-xs text-destructive font-medium">
                      {errors.company}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-phone" className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    Mobile number
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={countryCode}
                      disabled={isSubmittingLead}
                      onValueChange={(value) => {
                        setCountryCode(value);
                        if (touched.phone) {
                          setErrors((prev) => ({ ...prev, phone: validateField("phone", leadPhone) }));
                        }
                      }}
                    >
                      <SelectTrigger className="w-[110px] min-h-[44px]" aria-label="Country code">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_CODES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.code} {c.dialCode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="lead-phone"
                      type="tel"
                      inputMode="tel"
                      placeholder={getCountryByCode(countryCode)?.placeholder || "Mobile number"}
                      value={leadPhone}
                      disabled={isSubmittingLead}
                      onChange={(e) => {
                        const formatted = formatPhoneDisplay(e.target.value, countryCode);
                        setLeadPhone(formatted);
                        if (touched.phone) {
                          setErrors((prev) => ({ ...prev, phone: validateField("phone", formatted) }));
                        }
                      }}
                      onBlur={() => {
                        setTouched((prev) => ({ ...prev, phone: true }));
                        setErrors((prev) => ({ ...prev, phone: validateField("phone", leadPhone) }));
                      }}
                      className={cn("flex-1 min-h-[44px]", touched.phone && errors.phone && "border-destructive focus-visible:ring-destructive")}
                      aria-invalid={touched.phone && !!errors.phone}
                      aria-describedby={touched.phone && errors.phone ? "lead-phone-error" : undefined}
                    />
                  </div>
                  {touched.phone && errors.phone && (
                    <p id="lead-phone-error" className="text-xs text-destructive font-medium">
                      {errors.phone}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex gap-2 pt-1">
              {leadStep > 0 && (
                <Button
                  type="button"
                  variant="cta-outline"
                  className="flex-1 min-h-[44px]"
                  disabled={isSubmittingLead}
                  onClick={goToPrevStep}
                >
                  Back
                </Button>
              )}
              {leadStep < TOTAL_STEPS - 1 ? (
                <Button
                  type="button"
                  variant="cta"
                  className="flex-1 min-h-[44px]"
                  onClick={goToNextStep}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="cta"
                  className="flex-1 min-h-[44px]"
                  disabled={isSubmittingLead}
                >
                  {isSubmittingLead ? (
                    <span className="w-4 h-4 rounded-full border-2 border-border border-t-primary animate-spin" />
                  ) : (
                    <>
                      Open EVA Demo
                      <Send className="w-4 h-4 ml-1.5" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default EVADemoPortal;
