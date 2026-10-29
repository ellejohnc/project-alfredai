import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import evaIcon from "@/assets/eva-icon.png.asset.json";
import {
  ArrowRight,
  ArrowDown,
  ShieldCheck,
  ShieldAlert,
  Lock,
  EyeOff,
  CheckCircle2,
  XCircle,
  FileLock2,
  UserCheck,
  ScrollText,
  Building2,
  Briefcase,
  Users,
  Sparkles,
  ArrowLeftRight,
  Mail,
  Bell,
  Loader2,
  User,
  Phone,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SEO from "@/components/SEO";
import { productSchemaFor } from "@/lib/productSchema";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GHLBookingModal } from "@/components/GHLBookingWidget";
import EVADemoPortal from "@/components/products/EVADemoPortal";
import PremiumCTASection from "@/components/sections/PremiumCTASection";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { strictEmailSchema } from "@/lib/emailValidation";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

const risks = [
  {
    icon: ShieldAlert,
    title: "Enterprise data can leak into personal AI",
    body: "Employees may paste sensitive company information — client names, project details, commercial values, legal risk, HR information, internal notes, contracts, credentials, confidential strategy, and third-party data — into private AI accounts. Once it leaves, the company loses control.",
  },
  {
    icon: EyeOff,
    title: "Personal AI can pollute enterprise work",
    body: "A privately trained personal AI may carry personal memory, private opinions, old conversation history, and confidential information from other employers and clients. Without a security guard, that can quietly enter enterprise workflows — creating privacy, compliance, bias, and legal exposure.",
  },
];

const steps = [
  {
    step: "01",
    title: "User asks the enterprise AI for help",
    body: "A request often contains client, project, commercial, and internal commentary — useful, but risky to share with personal AI.",
  },
  {
    step: "02",
    title: "EVA detects sensitive enterprise data",
    body: "EVA scans the request before anything can be shared, identifying client names, locations, dollar amounts, liability notes, and employee names, then classifies the risk level.",
  },
  {
    step: "03",
    title: "EVA creates a safe version",
    body: "The request is transformed into a sanitised version. The personal AI never receives the client name, project name, dollar amount, employee name, or internal liability note.",
  },
  {
    step: "04",
    title: "Human approves outbound sharing",
    body: "EVA shows exactly what will leave. The user can approve, edit, reject, or switch to enterprise-only mode. Critical secrets are blocked by policy.",
  },
  {
    step: "05",
    title: "Personal AI contributes work-relevant intelligence",
    body: "The personal AI only contributes approved guidance — writing style, structure, tone, negotiation frameworks, decision patterns, and reusable templates.",
  },
  {
    step: "06",
    title: "EVA scans the response coming back",
    body: "Before personal AI output enters the enterprise, EVA checks for personal memories, private opinions, third-party data, prompt injection, and policy conflicts.",
  },
  {
    step: "07",
    title: "Human approves inbound import",
    body: "The user reviews the response and can approve, edit, remove personal content, reject, or switch to enterprise-only mode — human oversight on both sides.",
  },
  {
    step: "08",
    title: "Enterprise AI generates the final output",
    body: "The final output is generated inside the enterprise environment, using the original enterprise data and the approved work-relevant guidance — never raw enterprise data in personal AI.",
  },
];

const allowed = [
  "Work-relevant style guidance",
  "Communication preferences",
  "Approved templates",
  "Decision-making frameworks",
  "Productivity methods",
  "Role-based expertise",
  "Reusable personal work patterns",
];

const blocked = [
  "Enterprise confidential data going out",
  "Client and project details",
  "Credentials, passwords, and API keys",
  "Personal chat history coming in",
  "Private memories and opinions",
  "Sensitive personal information",
  "Confidential data from other companies",
  "Prompt-injection attempts",
];

const features = [
  {
    icon: ArrowLeftRight,
    title: "Two-way AI security guard",
    body: "EVA controls both directions. Enterprise data is protected before anything leaves; personal AI content is protected before anything enters.",
  },
  {
    icon: FileLock2,
    title: "DLP and redaction",
    body: "Client names become [CLIENT], project names [PROJECT], dollar amounts [AMOUNT], employee names [PERSON], emails [EMAIL], and phone numbers [PHONE].",
  },
  {
    icon: ShieldCheck,
    title: "Personal data firewall",
    body: "Blocks personal chat history, private opinions, sensitive personal data, confidential information from other clients, and inappropriate content.",
  },
  {
    icon: UserCheck,
    title: "Human approval both ways",
    body: "Approval is required before information crosses — outbound (\"share this sanitised context?\") and inbound (\"let this response enter the workflow?\").",
  },
  {
    icon: Lock,
    title: "Critical secret blocking",
    body: "Automatically blocks passwords, API keys, access tokens, database credentials, banking details, and raw enterprise files.",
  },
  {
    icon: ScrollText,
    title: "Enterprise-only mode & audit trail",
    body: "Keep sensitive requests fully inside the enterprise, and log every exchange — what was detected, redacted, approved, shared, returned, and blocked.",
  },
];

const audiences = [
  { icon: Building2, title: "Enterprises", body: "Get the productivity of AI without losing control of company data." },
  { icon: Briefcase, title: "Contractors & consultants", body: "Use your personal AI style and expertise while respecting client security boundaries." },
  { icon: Users, title: "Project teams", body: "Work with sensitive commercial, legal, financial, or client data with confidence." },
  { icon: Sparkles, title: "AI-first businesses", body: "Build agentic workflows with clear boundaries between personal intelligence and enterprise execution." },
];

const useCases = [
  { title: "Client communication", body: "Use your personal communication style without exposing client details to personal AI." },
  { title: "Tender & proposal writing", body: "Use approved personal bid frameworks while keeping tender documents inside the enterprise." },
  { title: "Project management", body: "Use a contractor's preferred style without giving their personal AI access to project files." },
  { title: "Legal & commercial review", body: "Use structured thinking patterns while blocking raw legal, contract, or liability information." },
  { title: "Executive assistants", body: "Let executives use their working style while protecting board papers, financials, and private records." },
  { title: "Sales & CRM", body: "Use a salesperson's personal tone and objection-handling without exposing customer records." },
];

const securityModel = [
  { label: "Safe", body: "EVA may allow it.", tone: "ok" },
  { label: "Sensitive", body: "EVA redacts or summarises it.", tone: "warn" },
  { label: "High risk", body: "EVA requires human or manager approval.", tone: "warn" },
  { label: "Critical", body: "EVA blocks it.", tone: "block" },
];

const EVAPage = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingTitle, setBookingTitle] = useState("Request a demo");

  const openBooking = (title: string) => {
    setBookingTitle(title);
    setIsBookingOpen(true);
  };

  const { toast } = useToast();
  const [waitlistForm, setWaitlistForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
  });
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSubscribed, setWaitlistSubscribed] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, company, email, phone } = waitlistForm;
    const trimmedName = name.trim();
    const trimmedCompany = company.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      toast({ title: "Name required", description: "Please enter your full name.", variant: "destructive" });
      return;
    }
    if (!trimmedCompany) {
      toast({ title: "Company required", description: "Please enter your company name.", variant: "destructive" });
      return;
    }
    const emailResult = strictEmailSchema.safeParse(trimmedEmail);
    if (!emailResult.success) {
      toast({
        title: "Invalid email",
        description: emailResult.error.errors[0]?.message || "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setWaitlistLoading(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({
          email: trimmedEmail,
          name: trimmedName,
          company: trimmedCompany,
          phone: phone.trim() || null,
          source: "eva-waitlist",
        });
      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already on the list",
            description: "You're already subscribed! We'll notify you when EVA launches.",
          });
          setWaitlistSubscribed(true);
          return;
        }
        throw error;
      }
      toast({
        title: "You're on the list!",
        description: "We'll notify you as soon as EVA is available.",
      });
      setWaitlistSubscribed(true);
      setWaitlistForm({ name: "", company: "", email: "", phone: "" });
    } catch (error) {
      console.error("Waitlist error:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setWaitlistLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="EVA | Secure Personal AI Inside Enterprise Work"
        description="EVA is an AI security guard from alfred ai that lets employees and contractors use personal AI without leaking enterprise data or injecting private personal memory into company workflows."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Products", url: "/products" },
          { name: "EVA", url: "/products/eva" },
        ]}
        product={productSchemaFor("eva")}
      />
      <Header />

      <main>
        {/* Hero */}
        <section id="eva-hero" className="relative flex items-center min-h-[88vh] pt-32 pb-16 md:pt-40 md:pb-28 bg-background overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage: "radial-gradient(ellipse at 60% 40%, black, transparent 75%)",
            }}
          />
          <div className="container-wide relative">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/products">Products</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>EVA</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
              <motion.div {...fadeUp} className="max-w-3xl">
                <div className="relative inline-flex max-w-full overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.06] via-card to-card px-5 py-3 mb-6 shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.35)]">
                  <span className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-primary/15 to-transparent animate-shimmer" />
                  <div className="relative flex items-center gap-3">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                    </span>
                    <div className="flex flex-col leading-none">
                      <span className="font-product text-[9px] font-bold uppercase tracking-[0.4em] text-primary/80">
                        Coming Soon · Agentic AI
                      </span>
                      <span className="font-product text-lg font-bold tracking-tight text-foreground mt-1">
                        Security Guard
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <img src={evaIcon.url} alt="EVA logo" className="w-12 h-12 object-contain" />
                  <h1 className="text-4xl md:text-6xl font-black text-foreground leading-[1.05] tracking-tight font-product">
                    EVA<span className="sr-only"> — the AI security and boundary layer for your data</span>
                  </h1>
                </div>
                <p className="text-xl md:text-2xl font-semibold text-foreground mb-4 leading-snug">
                  Secure personal AI inside enterprise work.
                </p>
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                  EVA lets employees and contractors use the power of their personal AI without exposing enterprise data
                  or injecting private personal memory into company workflows. Enterprise data stays enterprise. Personal
                  data stays personal. Only approved, work-relevant intelligence is allowed through.
                </p>

                <div className="mt-7">
                  {!waitlistSubscribed ? (
                    <form onSubmit={handleWaitlistSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Full name"
                          value={waitlistForm.name}
                          onChange={(e) => setWaitlistForm((prev) => ({ ...prev, name: e.target.value }))}
                          className="pl-10 h-12 text-base transition-all duration-200 hover:border-foreground/30 hover:shadow-sm"
                          disabled={waitlistLoading}
                          required
                        />
                      </div>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Company"
                          value={waitlistForm.company}
                          onChange={(e) => setWaitlistForm((prev) => ({ ...prev, company: e.target.value }))}
                          className="pl-10 h-12 text-base transition-all duration-200 hover:border-foreground/30 hover:shadow-sm"
                          disabled={waitlistLoading}
                          required
                        />
                      </div>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="Work email"
                          value={waitlistForm.email}
                          onChange={(e) => setWaitlistForm((prev) => ({ ...prev, email: e.target.value }))}
                          className="pl-10 h-12 text-base transition-all duration-200 hover:border-foreground/30 hover:shadow-sm"
                          disabled={waitlistLoading}
                          required
                        />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="Phone number (optional)"
                          value={waitlistForm.phone}
                          onChange={(e) => setWaitlistForm((prev) => ({ ...prev, phone: e.target.value }))}
                          className="pl-10 h-12 text-base transition-all duration-200 hover:border-foreground/30 hover:shadow-sm"
                          disabled={waitlistLoading}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Button
                          type="submit"
                          variant="cta"
                          size="lg"
                          disabled={
                            waitlistLoading ||
                            !waitlistForm.name.trim() ||
                            !waitlistForm.company.trim() ||
                            !waitlistForm.email.trim()
                          }
                          className="min-h-touch"
                        >
                          {waitlistLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join the Waitlist"}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <Bell size={18} className="animate-pulse" />
                      <span>You're on the list! We'll notify you when EVA launches.</span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Security guard preview */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-elevation-2"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                      Two-way guard
                    </span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Enterprise AI → EVA → Personal AI
                    </p>
                    <p className="text-sm text-foreground leading-snug">
                      Redacts confidential data before anything leaves.
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary">EVA guard</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Personal AI → EVA → Enterprise AI
                    </p>
                    <p className="text-sm text-foreground leading-snug">
                      Blocks private memory before anything enters.
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  {["Detect", "Approve", "Log"].map((t) => (
                    <div key={t} className="rounded-lg bg-muted/60 py-2 text-[11px] font-semibold text-foreground">
                      {t}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Live interactive portal */}
        <EVADemoPortal />

        {/* The problem */}
        <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                Your people are already using personal AI for work
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                They use it to write emails, think through problems, improve reports, prepare proposals, and speed up
                decisions. That creates two major risks.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 gap-4">
              {risks.map((r) => (
                <motion.div key={r.title} {...fadeUp} className="rounded-2xl border border-border bg-card p-6">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <r.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-foreground mb-2">{r.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* The solution */}
        <section className="py-14 md:py-20 bg-background">
          <div className="container-wide grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <motion.div {...fadeUp}>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-4">
                EVA is an AI security guard
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4">
                EVA sits between enterprise AI and personal AI, checking both directions before any information crosses.
                It prevents enterprise data from leaking out, and prevents private personal AI memory from entering the
                enterprise environment.
              </p>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                The result is controlled collaboration between enterprise AI and personal AI — with security, privacy,
                approval, and auditability built in.
              </p>
            </motion.div>
            <motion.div {...fadeUp} className="rounded-2xl border border-border bg-card p-8 flex flex-col justify-center">
              <p className="text-2xl md:text-3xl font-black text-foreground leading-tight">Enterprise data stays enterprise.</p>
              <p className="text-2xl md:text-3xl font-black text-foreground leading-tight mt-1">Personal data stays personal.</p>
              <p className="text-xl md:text-2xl font-black text-primary leading-tight mt-3">
                Only approved, work-relevant intelligence is allowed through.
              </p>
            </motion.div>
          </div>
        </section>

        {/* What passes through */}
        <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                What passes through
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                EVA allows the enterprise AI to safely use work-relevant guidance — and blocks or removes everything that
                puts the business at risk.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">Allowed across</h3>
                </div>
                <ul className="space-y-2.5">
                  {allowed.map((a) => (
                    <li key={a} className="flex items-start gap-2.5 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-base font-bold text-foreground">Blocked or removed</h3>
                </div>
                <ul className="space-y-2.5">
                  {blocked.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <XCircle className="w-4 h-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Example flow */}
        <section className="py-14 md:py-20 bg-background">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                Sanitisation in action
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                A useful but risky request is transformed into a safe version. The personal AI never sees the client
                name, project name, dollar amount, employee name, or internal liability note.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-4 items-stretch">
              <motion.div {...fadeUp} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Original · high risk
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "Draft a commercial email to Johnson Construction about the $420k delay risk on the Northern Suburbs project. Use my
                  usual negotiation style. Internal note: we may be partially liable because Alex missed the submission
                  deadline."
                </p>
              </motion.div>
              <motion.div {...fadeUp} className="rounded-2xl border border-primary/40 bg-primary/5 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Sanitised · safe to share
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed italic">
                  "Draft a professional client email about a construction project delay risk. Use a confident but
                  commercially careful negotiation style. Avoid admitting liability and propose a practical next step."
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">How EVA works</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Eight steps of detection, redaction, approval, and audit — across both directions of the exchange.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((s) => (
                <motion.div key={s.step} {...fadeUp} className="rounded-2xl border border-border bg-card p-6">
                  <span className="text-2xl font-black text-primary/30">{s.step}</span>
                  <h3 className="text-sm font-bold text-foreground mt-2 mb-2 leading-snug">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Inbound protection example */}
        <section className="py-14 md:py-20 bg-background">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                Blocking unsafe personal AI responses
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Most AI security tools only stop data going out. EVA also protects what comes back — rewriting unsafe
                personal AI output into a work-safe version before it ever enters the enterprise.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-4 items-stretch">
              <motion.div {...fadeUp} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Unsafe · blocked
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "I remember from your personal chats that you dislike working with Alex, and your previous employer
                  handled similar disputes by delaying disclosure. You should use that same approach here."
                </p>
                <div className="flex justify-center my-4">
                  <ArrowDown className="w-4 h-4 text-muted-foreground/50" />
                </div>
              </motion.div>
              <motion.div {...fadeUp} className="rounded-2xl border border-primary/40 bg-primary/5 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Rewritten · work-safe
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed italic">
                  "Use a commercially careful communication structure. Separate facts from responsibility, avoid
                  unsupported assumptions, and propose a controlled review session with clear next steps."
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Key features */}
        <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">Key features</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Built for security, privacy, approval, and governance on both sides of the AI checkpoint.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((f) => (
                <motion.div
                  key={f.title}
                  {...fadeUp}
                  className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-colors"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Security model */}
        <section className="py-14 md:py-20 bg-background">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">Security model</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                EVA follows a simple principle: <span className="font-semibold text-foreground">default deny, approve by
                exception, log everything.</span>
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {securityModel.map((m) => (
                <motion.div key={m.label} {...fadeUp} className="rounded-2xl border border-border bg-card p-6">
                  <span
                    className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full mb-3 ${
                      m.tone === "ok"
                        ? "bg-primary/10 text-primary"
                        : m.tone === "block"
                        ? "bg-foreground text-background"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {m.label}
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{m.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">Use cases</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Wherever personal AI productivity meets sensitive enterprise data.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {useCases.map((u) => (
                <motion.div key={u.title} {...fadeUp} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="text-base font-bold text-foreground mb-2">{u.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{u.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Who EVA is for */}
        <section className="py-14 md:py-20 bg-background">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">Who EVA is for</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                For anyone who wants the value of personal AI without the uncontrolled data movement.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {audiences.map((a) => (
                <motion.div key={a.title} {...fadeUp} className="rounded-2xl border border-border bg-card p-6">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <a.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">{a.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <PremiumCTASection
          title="Coming soon. Join the waitlist for early access."
          description="EVA is currently under development. Be the first to try secure personal AI inside enterprise work — join the waitlist and we'll notify you the moment it's available."
          buttonText="Join the Waitlist"
          onButtonClick={() => {
            const el = document.getElementById("eva-hero");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
          variant="light"
        />
      </main>

      <Footer />
      <GHLBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        title={bookingTitle}
        description="Book a 30-minute working session to see how EVA secures personal AI inside enterprise workflows."
      />
    </div>
  );
};

export default EVAPage;
