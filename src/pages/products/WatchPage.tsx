import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Radar,
  AlertTriangle,
  ListChecks,
  Bot,
  GitBranch,
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Users,
  HardHat,
  Activity,
  ShieldCheck,
  Bell,
  Zap,
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
import SEO from "@/components/SEO";
import { productSchemaFor } from "@/lib/productSchema";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GHLBookingModal } from "@/components/GHLBookingWidget";
import PremiumCTASection from "@/components/sections/PremiumCTASection";
import WatchLivePortal from "@/components/products/WatchLivePortal";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

const questions = [
  "Which project is starting to slip?",
  "Which tender needs action today?",
  "Which client has gone quiet?",
  "Which invoice needs escalation?",
  "Which task is blocking delivery?",
  "Which workflow is stuck?",
  "Which AI agent needs approval?",
  "Which staff member is overloaded?",
  "Which issue is likely to become a bigger problem?",
  "What should the business owner look at first today?",
];

const notDashboard = [
  { a: "A normal dashboard displays data.", b: "Watch helps interpret what the data means." },
  { a: "A normal dashboard shows metrics.", b: "Watch surfaces signals." },
  { a: "A normal dashboard waits for someone to look.", b: "Watch triggers attention, follow-up, escalation, and action." },
  { a: "A normal dashboard tells you what happened.", b: "Watch shows what is happening and what is likely next." },
];

const capabilities = [
  {
    icon: Radar,
    name: "Live business visibility",
    description:
      "Brings important business signals into one view instead of switching between email, CRM, accounting software, spreadsheets, project tools, and chat.",
  },
  {
    icon: Radar,
    name: "Forward intelligence",
    description:
      "Identifies early signals — approaching deadlines, repeated delays, quiet clients, overdue invoices, ownerless tasks — before they become larger problems.",
  },
  {
    icon: ListChecks,
    name: "Priority view",
    description:
      "Separates noise from priority: what needs action today, what needs attention, what can wait, what is blocked, overdue, or becoming risky.",
  },
  {
    icon: Bot,
    name: "Agent monitoring",
    description:
      "Visibility over what Butler agents are doing — active, completed, awaiting review, requiring approval, failed, escalated, and value created.",
  },
  {
    icon: GitBranch,
    name: "Workflow orchestration",
    description:
      "Coordinates work across people, agents, and systems — routing, triggering Butlers, escalating issues, and supporting human-in-the-loop approvals.",
  },
  {
    icon: LayoutDashboard,
    name: "Management cockpit",
    description:
      "A daily cockpit for owners and managers to review priorities, open risks, overdue work, agent activity, deadlines, and recommended actions.",
  },
];

const useCases = [
  {
    icon: HardHat,
    title: "Construction & project delivery",
    body: "Projects at risk, delayed RFIs, overdue approvals, subcontractor issues, unresolved variations, tender deadlines, and delivery bottlenecks.",
    example:
      "A project has repeated delayed responses and overdue actions. Watch flags it as an emerging risk and recommends review before the delay becomes expensive.",
  },
  {
    icon: TrendingUp,
    title: "Sales & tender pipeline",
    body: "New leads, tenders due soon, proposals waiting for review, clients needing follow-up, no-response opportunities, and high-value deals at risk.",
    example:
      "A high-value tender is due in three days but the risk review is incomplete. Watch flags it, notifies the right person, and triggers Tender Butler to prepare a summary.",
  },
  {
    icon: Wallet,
    title: "Finance & cashflow",
    body: "Overdue invoices, receivable follow-ups, disputed invoices, supplier bottlenecks, high-value debtors, and recurring late payers.",
    example:
      "A large invoice is overdue and the client has gone quiet. Watch escalates the account to management and triggers Finance Butler to prepare a follow-up sequence.",
  },
  {
    icon: Users,
    title: "Team workload & accountability",
    body: "Ownerless tasks, overdue actions, repeated blockers, workload concentration, unresolved meeting actions, and approvals waiting too long.",
    example:
      "One senior staff member is carrying too many reviews while juniors wait for feedback. Watch highlights the bottleneck and recommends redistribution.",
  },
];

const howItWorks = [
  { step: "01", title: "Define what matters", body: "We identify the key signals, workflows, risks, metrics, and decisions that matter to your business." },
  { step: "02", title: "Connect the data", body: "Watch connects to relevant systems, workflows, documents, and agents through AOS and your existing tools." },
  { step: "03", title: "Configure the operating view", body: "We design owner, manager, department, project, exception, risk, and daily priority views around your needs." },
  { step: "04", title: "Set signals and rules", body: "We define what triggers attention — overdue invoices, stuck tasks, tenders due soon, quiet clients, failed workflows." },
  { step: "05", title: "Orchestrate action", body: "Watch triggers follow-ups, alerts, tasks, escalations, Butler workflows, and human approvals." },
  { step: "06", title: "Improve over time", body: "As the business evolves, Watch is refined to monitor better signals, reduce noise, and improve recommendations." },
];

const ecosystem = [
  { pair: "Watch + Axiom", body: "Axiom gives Watch the business context to interpret signals properly, so Watch knows which delays or behaviours actually matter." },
  { pair: "Watch + Butler", body: "Butler does the work. Watch monitors, coordinates, and escalates it — showing overdue accounts and management priorities." },
  { pair: "Watch + Omega", body: "Watch decides what needs attention; Omega routes the issue, triggers reminders, and updates workflow status in real time." },
  { pair: "Watch + AOS", body: "Operations run inside AOS. Watch turns that activity into a clear management view for leaders." },
];

const WatchPage = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingTitle, setBookingTitle] = useState("Book a consultation");

  const openBooking = (title: string) => {
    setBookingTitle(title);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Watch | Mission Control for Business"
        description="Watch is the mission control of alfred ai, helping owners and operators monitor risks, workflows, AI agents, projects, finance, sales, and operations in real time."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Products", url: "/products" },
          { name: "Watch", url: "/products/watch" },
        ]}
        product={productSchemaFor("watch")}
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
                  <BreadcrumbPage>Watch</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
              <motion.div {...fadeUp} className="max-w-3xl">
                <div className="inline-flex items-center gap-2 mb-6 rounded-full border border-border bg-card/70 backdrop-blur-sm px-3.5 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
                    Agentic AI · Engine 03
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <Radar className="w-12 h-12 text-foreground" />
                  <h1 className="text-4xl md:text-6xl font-black text-foreground leading-[1.05] tracking-tight font-product">
                    Watch<span className="sr-only"> — live AI oversight for projects and operations</span>
                  </h1>
                </div>
                <p className="text-xl md:text-2xl font-semibold text-foreground mb-4 leading-snug">
                  Mission control for your business.
                </p>
                <motion.p
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed"
                >
                  Watch is the mission control of alfred ai. It helps owners, managers, and
                  operators see what is happening, what is at risk, what needs attention, and what should happen next
                  across people, systems, workflows, AI agents, projects, clients, finance, and operations.
                </motion.p>

                <div className="flex flex-col sm:flex-row gap-3 mt-7">
                  <Button variant="cta" size="lg" onClick={() => openBooking("Book a consultation")} className="min-h-touch">
                    Book a consultation
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    variant="cta-outline"
                    size="lg"
                    onClick={() => openBooking("Map your business signals")}
                    className="min-h-touch"
                  >
                    Map your business signals
                  </Button>
                </div>
              </motion.div>

              {/* Mission control preview */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-elevation-2"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                      Today's priorities
                    </span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </div>
                <div className="space-y-3">
                  {[
                    { icon: AlertTriangle, label: "Project Northgate slipping", tag: "Risk", tone: "text-primary" },
                    { icon: Bell, label: "Tender #4471 due in 3 days", tag: "Action", tone: "text-foreground" },
                    { icon: Wallet, label: "Invoice $48k overdue 14d", tag: "Escalate", tone: "text-primary" },
                    { icon: Bot, label: "Report Butler — 2 awaiting approval", tag: "Review", tone: "text-foreground" },
                    { icon: Users, label: "S. Patel overloaded (9 reviews)", tag: "Rebalance", tone: "text-foreground" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-3.5 py-3"
                    >
                      <row.icon className={`w-4 h-4 flex-shrink-0 ${row.tone}`} />
                      <span className="text-sm text-foreground leading-snug flex-1">{row.label}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border border-border rounded-full px-2 py-0.5">
                        {row.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Live interactive portal */}
        <WatchLivePortal />

        {/* Not short of data */}
        <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <motion.div {...fadeUp}>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-4">
                Most businesses are not short of data. They are short of visibility.
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Sales updates live in the CRM. Project issues live in emails. Invoices live in accounting software. Tasks
                live in spreadsheets. Risks live in people's heads. Watch brings the important signals together and turns
                scattered business activity into a clear operating view.
              </p>
            </motion.div>
            <motion.div {...fadeUp} className="rounded-2xl border border-border bg-card p-8 flex flex-col justify-center">
              <p className="text-2xl md:text-3xl font-black text-foreground leading-tight">Not just reporting.</p>
              <p className="text-3xl md:text-4xl font-black text-primary leading-tight mt-1">Forward intelligence.</p>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                See what matters before it becomes expensive.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Questions Watch answers */}
        <section className="py-14 md:py-20 bg-background">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                Watch helps answer the questions that keep owners up at night
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                It monitors activity across people, systems, workflows, agents, tasks, documents, clients, projects, and
                operations, then surfaces the signals that need attention.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {questions.map((q) => (
                <div key={q} className="flex items-start gap-3 rounded-xl border border-border bg-card p-5">
                  <ListChecks className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground leading-relaxed">{q}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Not just a dashboard */}
        <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                Watch is not just a dashboard
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                A normal dashboard displays data. Watch helps interpret what the data means.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 gap-4">
              {notDashboard.map((row) => (
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

        {/* Core capabilities */}
        <section className="py-14 md:py-20 bg-background">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">Core capabilities</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Watch can be configured around the parts of your business that matter most. The goal is not to show
                everything — it is to show what matters.
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

        {/* Example use cases */}
        <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">Example use cases</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Watch is business-specific. A construction company should not see the same view as an accounting firm,
                strata business, or recruitment agency.
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

        {/* How Watch works */}
        <section className="py-14 md:py-20 bg-background">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">How Watch works</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                From defining what matters to orchestrating action, Watch helps the business move from visibility to
                action.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {howItWorks.map((s) => (
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
        <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                Built to work with the alfred ai ecosystem
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Watch is the orchestration and mission control layer — connecting context, agents, real-time routing, and
                operations.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 gap-4">
              {ecosystem.map((e) => (
                <motion.div key={e.pair} {...fadeUp} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <h3 className="text-base font-bold text-foreground">{e.pair}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{e.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* What makes Watch different */}
        <section className="py-14 md:py-20 bg-background">
          <div className="container-wide grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <motion.div {...fadeUp}>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-4">
                With Watch, your business gets a clearer view of what matters.
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Owners can see the business without chasing everyone. Managers can act before issues become bigger. Teams
                know what needs attention. AI agents become visible and accountable. Workflows move with less friction,
                risks surface earlier, and decisions become faster.
              </p>
            </motion.div>
            <motion.div {...fadeUp} className="grid grid-cols-2 gap-4">
              {[
                { icon: Radar, label: "Built for action" },
                { icon: Bot, label: "Connects humans & AI agents" },
                { icon: ShieldCheck, label: "Creates accountability" },
                { icon: Radar, label: "Supports forward intelligence" },
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
          title="See what needs attention before it becomes expensive."
          description="Book a Watch strategy session and explore how mission control can work inside your business. Not sure what to monitor first? We can help map your key business signals, risks, workflows, and metrics."
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
        description="Book a 30-minute working session to see how Watch can become mission control for your business."
      />
    </div>
  );
};

export default WatchPage;
