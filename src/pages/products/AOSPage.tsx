import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,

  LayoutGrid,
  Plug,
  Workflow,
  Bot,
  Lock,
  ClipboardList,
  ScrollText,
  ShieldCheck,
  Blocks,
  HardHat,
  Briefcase,
  Wallet,
  Layers,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { VibeCodingHeroAnimation, type VibeExample } from "@/components/products/VibeCodingHeroAnimation";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { productSchemaFor } from "@/lib/productSchema";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GHLBookingModal } from "@/components/GHLBookingWidget";
import PremiumCTASection from "@/components/sections/PremiumCTASection";
import accountableLinkLogo from "@/assets/logos/accountable-link-icon.png";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

const fragmentation = [
  "A CRM for sales",
  "An accounting system for finance",
  "A project system for delivery",
  "A document drive for files",
  "A spreadsheet for tracking",
  "An email inbox for communication",
  "A calendar for meetings",
  "A chat tool for internal messages",
  "An AI tool for productivity",
];

const capabilities = [
  {
    icon: Plug,
    name: "Connects your systems",
    description:
      "Connects email, calendars, CRM, accounting, project tools, document storage, spreadsheets, forms, chat, and industry software — without forcing your team into one rigid platform.",
  },
  {
    icon: Workflow,
    name: "Runs your workflows",
    description:
      "Turns business processes into trackable workflows — each with owners, steps, triggers, approvals, due dates, escalation rules, and AI agent support.",
  },
  {
    icon: Bot,
    name: "Gives AI agents a home",
    description:
      "Butler agents receive tasks, access approved context, draft outputs, update status, request review, trigger next steps, record actions, and work with human users.",
  },
  {
    icon: Lock,
    name: "Manages users & permissions",
    description:
      "Role-based access and permission control so the right people reach the right workflows, documents, AI agents, and information. AI must be powerful but controlled.",
  },
  {
    icon: ClipboardList,
    name: "Tracks ownership & accountability",
    description:
      "Answers who owns this, what's the status, what's waiting, what's overdue, what needs approval, what changed, and what the AI agent did.",
  },
  {
    icon: ScrollText,
    name: "Records audit trails",
    description:
      "Records task history, agent actions, human approvals, document changes, decisions, escalations, review notes, timestamps, and integration events for governance.",
  },
];

const notJust = [
  { a: "It is not just a CRM.", b: "AOS manages operational execution across systems, workflows, people, approvals, and agents." },
  { a: "It is not just project management.", b: "It connects work to AI agents, business logic, integrations, governance, and the Omega brain that directs it all." },
  { a: "It is not just automation software.", b: "It is the environment where actions are owned, tracked, reviewed, escalated, and governed." },
  { a: "It is not just an AI chatbot or dashboard.", b: "AOS is where the work actually happens." },
];

const useCases = [
  {
    icon: HardHat,
    title: "Construction operations",
    body: "Connects tendering, delivery, finance, documentation, and reporting. Supports PDF to take-off, tender and contract review, RFI tracking, variations, site reports, subcontractor compliance, and delivery risk escalation.",
    example:
      "A drawing set is uploaded. AOS creates a take-off workflow, triggers PDF to Take-Off Butler, routes output to the estimator, tracks review, escalates via Omega, and shows progress in Watch.",
  },
  {
    icon: Briefcase,
    title: "Professional services",
    body: "Manages client workflows, document collection, internal review, task assignment, reporting, and follow-up — onboarding, email triage, meeting actions, proposals, and CRM updates.",
    example:
      "A new enquiry comes in. AOS creates a client workflow, triggers Sales Butler, records the lead, assigns follow-up, stores the meeting summary, and tracks the opportunity to proposal.",
  },
  {
    icon: Wallet,
    title: "Finance & admin operations",
    body: "Handles recurring work that gets missed — receivable follow-up, supplier invoice review, approval routing, payment reminders, expense workflows, document filing, and exception escalation.",
    example:
      "An invoice becomes overdue. AOS triggers Finance Butler, creates a follow-up task, routes the draft for approval, records the action, and escalates if the client does not respond.",
  },
  {
    icon: ShieldCheck,
    title: "AI agent governance",
    body: "Provides the structure to deploy AI agents safely — agent permissions, workflow-specific access, approval checkpoints, action logs, output review, and monitoring.",
    example:
      "A Contract Butler can review contracts but cannot send legal comments externally without manager approval. AOS manages the access, approval, and audit trail.",
  },
];

const buildables = [
  "Client portals",
  "Project dashboards",
  "Approval tools",
  "Reporting tools",
  "Document trackers",
  "Contractor registers",
  "Compliance registers",
  "Sales trackers",
  "Job management views",
  "Finance follow-up boards",
  "Event management tools",
  "Operational control panels",
];

const implementation = [
  { step: "01", title: "Map your operating model", body: "We review how work flows through your business — people, systems, workflows, approvals, documents, AI opportunities, and bottlenecks." },
  { step: "02", title: "Design the operating layer", body: "We define what AOS should manage first — sales, tendering, finance follow-up, delivery, onboarding, reporting, or agent operations." },
  { step: "03", title: "Connect systems", body: "We connect key tools — CRM, email, accounting, project tools, document storage, calendars, spreadsheets, forms, and internal systems." },
  { step: "04", title: "Configure workflows & permissions", body: "We set up tasks, owners, statuses, approvals, notifications, role-based access, escalation rules, and AI agent boundaries." },
  { step: "05", title: "Deploy AI agents", body: "We connect Butler agents into workflows so they can draft, review, summarise, follow up, extract, update, or prepare work inside AOS." },
  { step: "06", title: "Add Watch and Omega", body: "Watch gives leadership visibility. Omega moves actions through the system in real time — turning a workflow platform into a live operating system." },
];

const ecosystem = [
  { pair: "AOS + Axiom", body: "Axiom provides the business intelligence layer. AOS applies that context inside real workflows, tasks, approvals, and agent actions." },
  { pair: "AOS + Butler", body: "Butler agents execute work inside AOS — drafting, assigning for review, tracking approval, and recording final outputs." },
  { pair: "AOS + Watch", body: "Watch gives leadership visibility over stuck workflows, overdue tasks, agent activity, project risk, and today's priorities inside AOS." },
  { pair: "AOS + Omega", body: "Omega routes approvals, triggers agents, escalates blocked work, carries context between steps, and updates workflow status in real time." },
];

const verticals = [
  {
    name: "Accountable",
    tagline: "The core vertical of the Agentic Operating System",
    body: "Accountable is the core vertical of AOS — connecting your people, workflows, integrations, approvals, permissions, and AI agents into one accountable system with enterprise-grade governance.",
    highlights: ["Workflow & approval orchestration", "Roles, permissions & audit trails", "AI agent governance"],
    url: "https://www.accountable.link",
  },
  {
    name: "alfredHUB",
    tagline: "Operating system for associations & member bodies",
    body: "An agentic operating system for business associations, professional bodies, chambers of commerce, and charities — replacing fragmented legacy tools with one accountable platform.",
    highlights: ["AI business matchmaking", "AGM & committee automation", "Member engagement & renewals"],
  },
  {
    name: "alfredBID",
    tagline: "The full bid operating system",
    body: "From three weeks to three hours. alfredBID manages the entire bidding lifecycle for construction and professional services firms — tender discovery, AI drafting, CV matching, and take-off automation.",
    highlights: ["Tender discovery", "AI drafting & CV matching", "Take-off automation"],
    url: "http://alfredbid.ai/",
  },
  {
    name: "BOTO",
    tagline: "iOS app for B2B matchmaking",
    body: "BOTO is alfred-ai's iOS app for B2B matchmaking — connecting businesses with the right partners, subcontractors, and opportunities through intelligent AI-driven matching on mobile.",
    highlights: ["AI-driven B2B matching", "Mobile-first iOS experience", "Real-time partner discovery"],
    appStoreUrl: "https://apps.apple.com/us/app/alfred-ai/id6755116821",
  },
  {
    name: "Portal Strata",
    tagline: "Unified strata operating environment",
    body: "A unified strata operating environment that modernises building management — a portfolio command centre, specialised AI agents, automation, and cross-portfolio network intelligence.",
    highlights: ["Portfolio command centre", "Specialised AI agents", "Predictive detection"],
    url: "https://psi.alfredai.app",
  },
];

const VIBE_EXAMPLES: VibeExample[] = [
  { category: "A new menu item & feature",
    prompt: "Add a variations register to every project, and make anything over $10k need a director's sign-off.",
    tab: "Variations",
    result: ["New Variations tab on each project", "Approval step routed to directors above $10k", "Status visible on the project dashboard"] },
  { category: "A dashboard",
    prompt: "Build me a dashboard of every invoice waiting more than 5 days for approval, grouped by approver.",
    tab: "Approvals",
    result: ["New overdue-approvals dashboard, added to your menu", "Grouped by approver, oldest first", "One-tap nudge to each approver"] },
  { category: "A workflow",
    prompt: "When a subcontractor's insurance expires within 30 days, remind them and tell me.",
    tab: "Insurance",
    result: ["Expiry dates tracked on each subcontractor", "Automatic reminder email 30 days out", "Alert to you, with a list of who's overdue"] },
  { category: "A mini-app",
    prompt: "Build a phone app for site supervisors to log daily diaries — photos, weather and hours.",
    tab: "Daily diaries",
    result: ["Phone mini-app built for site, added to your menu", "Entries saved against the right project", "Weekly summary sent to the project manager"] },
];

const AOSPage = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingTitle, setBookingTitle] = useState("Book a consultation");

  const openBooking = (title: string) => {
    setBookingTitle(title);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="AOS | Agentic Operating System for Accountable Business Operations"
        description="AOS, the Agentic Operating System, connects your people, workflows, integrations, approvals, permissions, AI agents, documents, dashboards, and operations into one accountable operating system."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Products", url: "/products" },
          { name: "AOS", url: "/products/aos" },
        ]}
        product={productSchemaFor("aos")}
      />
      <Header />

      <main>
        {/* Hero */}
        <section className="relative flex items-center min-h-[88vh] pt-32 pb-16 md:pt-40 md:pb-28 bg-background overflow-hidden">
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
                  <BreadcrumbPage>AOS</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
              <motion.div {...fadeUp} className="max-w-3xl">
                <div className="inline-flex items-center gap-2 mb-6 rounded-full border border-border bg-card/70 backdrop-blur-sm px-3.5 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
                    Agentic Operating System
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <img src={accountableLinkLogo} alt="AOS — Agentic Operating System" className="w-12 h-12 object-contain" />
                  <h1 className="text-4xl md:text-6xl font-black text-foreground leading-[1.05] tracking-tight font-product">
                    AOS<span className="sr-only"> — the alfred ai operating system that holds it all together</span>
                  </h1>
                </div>
                <p className="text-xl md:text-2xl font-semibold text-foreground mb-4 leading-snug">
                  Talk to the Vibe-coding Studio. Your operating system changes.
                </p>
                <motion.p
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed"
                >
                  Finally, software you can shape yourself. Describe what you need in plain English and AOS
                  rebuilds the screens, forms and workflows to fit how you work today — and again as your
                  operations keep growing.
                </motion.p>

                <div className="flex flex-col sm:flex-row gap-3 mt-7">
                  <Button variant="cta" size="lg" onClick={() => openBooking("Book a consultation")} className="min-h-touch">
                    Book a consultation
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    variant="cta-outline"
                    size="lg"
                    onClick={() => openBooking("Map your operating system")}
                    className="min-h-touch"
                  >
                    Map your operating system
                  </Button>
                </div>
              </motion.div>

              {/* Vibe-coding Studio — live demo of the core selling point */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                <VibeCodingHeroAnimation examples={VIBE_EXAMPLES} />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Vibe-coding Studio — core selling point */}
        <section aria-labelledby="vibe-heading" className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-2">Vibe-coding Studio</p>
              <h2 id="vibe-heading" className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                Say it. AOS builds it.
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                No waiting on a developer, no new tool to buy. Type a request the way you'd say it to a colleague —
                a new menu item, a dashboard, a workflow, a whole mini-app — review the change, and approve it.
                Here's what that looks like.
              </p>
            </motion.div>
            <div className="grid gap-3 md:grid-cols-2">
              {VIBE_EXAMPLES.map((ex) => (
                <motion.div key={ex.prompt} {...fadeUp} className="rounded-2xl border border-border bg-card p-5 md:p-6">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">You say</p>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/70 rounded-full border border-border px-2 py-0.5">
                      {ex.category}
                    </span>
                  </div>
                  <p className="rounded-xl border border-border bg-background px-3.5 py-3 text-sm font-medium text-foreground leading-relaxed">
                    "{ex.prompt}"
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-4 mb-2">AOS changes</p>
                  <ul className="space-y-1.5">
                    {ex.result.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" aria-hidden />
                        {r}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Coordination problem */}
        <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <motion.div {...fadeUp}>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-4">
                Most businesses do not have an operations problem. They have a coordination problem.
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Work lives across too many systems. Tasks are created in one place and forgotten in another. Approvals
                happen in emails. Documents sit in folders. AI agents operate separately from normal workflows.
                AOS sits above and between your systems, connecting work into one operating layer where
                ownership, status, approvals, agent activity, and accountability are visible.
              </p>
            </motion.div>
            <motion.div {...fadeUp} className="rounded-2xl border border-border bg-card p-8 flex flex-col justify-center">
              <p className="text-2xl md:text-3xl font-black text-foreground leading-tight">Not another tool.</p>
              <p className="text-3xl md:text-4xl font-black text-primary leading-tight mt-1">The Agentic Operating System.</p>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                For how work actually gets done. It does not replace every tool — it makes the tools work together.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Fragmentation */}
        <section className="py-14 md:py-20 bg-background">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                Each tool helps. Together, they create fragmentation.
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Every growing business reaches the same point — more tools to solve more problems. AOS connects
                them into one accountable operating layer.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {fragmentation.map((f) => (
                <div key={f} className="flex items-start gap-3 rounded-xl border border-border bg-card p-5">
                  <Plug className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground leading-relaxed">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What AOS does */}
        <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                What AOS does
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                The Agentic Operating System for AI-powered operations — where alfred ai's agents become part of the way
                your business actually operates.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {capabilities.map((c) => (
                <motion.div
                  key={c.name}
                  {...fadeUp}
                  className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-colors"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <c.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">{c.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Software within software */}
        <section className="py-14 md:py-20 bg-background">
          <div className="container-wide grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <motion.div {...fadeUp}>
              <div className="flex items-center gap-3 mb-4">
                <Blocks className="w-7 h-7 text-primary" />
                <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                  Software within software
                </h2>
              </div>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                AOS is not just for workflows. With guarded AI-assisted development and configured workflows,
                businesses can build lightweight internal tools around their operations — custom software flexibility
                without building everything from scratch. It also absorbs secure AI deployment: access control,
                human-in-the-loop approvals, audit trails, governance, and monitoring inside the operating system.
              </p>
            </motion.div>
            <motion.div {...fadeUp} className="grid grid-cols-2 gap-3">
              {buildables.map((b) => (
                <div key={b} className="flex items-start gap-2 rounded-xl border border-border bg-card p-4">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground leading-snug">{b}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* What makes it different */}
        <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                What makes AOS different
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                It is the operating environment where work is owned, tracked, reviewed, escalated, governed, and
                connected to the business.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 gap-4">
              {notJust.map((row) => (
                <div key={row.a} className="rounded-2xl border border-border bg-card p-6">
                  <p className="text-sm text-muted-foreground leading-relaxed line-through decoration-muted-foreground/40">
                    {row.a}
                  </p>
                  <p className="text-base font-semibold text-foreground leading-snug mt-2">{row.b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="py-14 md:py-20 bg-background">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">Example use cases</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Connecting workflows, AI agents, and operations into one accountable layer across industries.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 gap-4">
              {useCases.map((u) => (
                <motion.div key={u.title} {...fadeUp} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <u.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-foreground">{u.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{u.body}</p>
                  <div className="rounded-xl border border-border bg-background/60 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Example
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{u.example}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Implementation */}
        <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                Implementation approach
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Start with one high-value workflow, prove value, then build the operating system around the business over
                time.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {implementation.map((s) => (
                <motion.div key={s.step} {...fadeUp} className="rounded-2xl border border-border bg-card p-6">
                  <span className="text-2xl font-black text-primary/30">{s.step}</span>
                  <h3 className="text-base font-bold text-foreground mt-2 mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Ecosystem */}
        <section className="py-14 md:py-20 bg-background">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                The central system that brings everything together
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                AOS is where Axiom, Butler, Watch, and Omega operate together as one Agentic Operating System.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 gap-4">
              {ecosystem.map((e) => (
                <motion.div key={e.pair} {...fadeUp} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                    <h3 className="text-base font-bold text-foreground">{e.pair}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{e.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Vertical Solutions */}
        <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-background rounded-full text-xs font-medium text-muted-foreground mb-4 border border-border">
                <Layers className="w-3.5 h-3.5" />
                Vertical Solutions
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                Industry solutions built on AOS
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Purpose-built verticals that run on the AOS platform — each inherits the same governance,
                security, and orchestration while serving a specific industry.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 gap-4">
              {verticals.map((v) => (
                <motion.div key={v.name} {...fadeUp} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="text-base md:text-lg font-bold text-foreground mb-1">{v.name}</h3>
                  <p className="text-sm font-medium text-primary mb-3">{v.tagline}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{v.body}</p>
                  <ul className="space-y-2 mb-4">
                    {v.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground leading-relaxed">{h}</span>
                      </li>
                    ))}
                  </ul>
                  {"url" in v && v.url && (
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Visit {v.name}
                    </a>
                  )}
                  {"appStoreUrl" in v && v.appStoreUrl && (
                    <a
                      href={v.appStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Download on the App Store
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>



        {/* Outcome */}
        <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <motion.div {...fadeUp}>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-4">
                With AOS, your business runs on an Agentic Operating System built for AI-powered work.
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Systems become more connected. Tasks have owners. Approvals are tracked. AI agents operate inside real
                workflows. Managers get clearer visibility. Governance becomes easier. Workflows move with less friction,
                and operations become more accountable — helping your business run with more structure, speed, and
                control.
              </p>
            </motion.div>
            <motion.div {...fadeUp} className="grid grid-cols-2 gap-4">
              {[
                { icon: Plug, label: "Connected systems" },
                { icon: ClipboardList, label: "Clear ownership" },
                { icon: ShieldCheck, label: "Governed AI" },
                { icon: ScrollText, label: "Full audit trails" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-card p-5">
                  <item.icon className="w-5 h-5 text-primary mb-3" />
                  <span className="text-sm font-medium text-foreground leading-snug">{item.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <PremiumCTASection
          title="Build your Agentic Operating System for accountable work."
          description="Book an AOS strategy session and see how your workflows, systems, AI agents, and operations can come together. Not sure where to start? We can map your current systems, workflows, approvals, and bottlenecks to find the best first layer to build."
          buttonText="Book a consultation"
          onButtonClick={() => openBooking("Book a consultation")}
          variant="light"
        />
      </main>

      <Footer />
      <GHLBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        title={bookingTitle}
        description="Book a 30-minute working session to see how AOS can become the Agentic Operating System for your business."
      />
    </div>
  );
};

export default AOSPage;
