import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Layers,
  Search,
  Network,
  Boxes,
  Settings2,
  FlaskConical,
  TrendingUp,
  FileText,
  ShieldCheck,
  Eye,
  Bot,
  LayoutGrid,
  Building2,
  Calculator,
  Home,
  Users,
} from "lucide-react";
import { Engine6 } from "@/components/icons/Engine6";
import AxiomHeroDemo from "@/components/products/AxiomHeroDemo";
import AxiomVisuals from "@/components/products/AxiomVisuals";
import heroVideo from "@/assets/axiom-hero-preconstruction.mp4.asset.json";
import AxiomLearnsAnimation from "@/components/products/AxiomLearnsAnimation";
import MachineLearningExplainer from "@/components/products/MachineLearningExplainer";
import BusinessContextDiagram from "@/components/products/BusinessContextDiagram";
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

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};



const learns = [
  "Industry-specific terminology",
  "Company SOPs",
  "Drawings and specifications",
  "Project records",
  "Tender documents",
  "Contracts and commercial rules",
  "Risk registers",
  "HR policies",
  "Delivery workflows",
  "Delay patterns",
  "Quality standards",
  "Safety procedures",
  "Internal templates",
  "Report examples",
  "Client communication history",
  "Meeting notes",
  "Pricing logic",
  "Approval processes",
  "Compliance obligations",
  "Lessons learned",
  "Management preferences",
  "Decision-making rules",
];

const whatItDoes = [
  {
    icon: Search,
    title: "Captures business knowledge",
    description:
      "We help identify where your important knowledge lives — documents, folders, emails, spreadsheets, project systems, templates, meeting notes, SOPs, or inside the heads of experienced staff.",
  },
  {
    icon: Boxes,
    title: "Structures messy information",
    description:
      "Most company knowledge is scattered, inconsistent, duplicated, or undocumented. Axiom structures it into a usable intelligence layer so AI can retrieve the right information and apply it properly.",
  },
  {
    icon: Network,
    title: "Models business logic",
    description:
      "A business runs on judgement, not just documents. Axiom defines the logic behind your workflows, decisions, approvals, risks, and escalation points.",
  },
  {
    icon: Engine6,
    title: "Creates an AI-ready knowledge layer",
    description:
      "We prepare your knowledge for AI agents, dashboards, internal tools, and automation — retrieval systems, knowledge bases, structured data, prompt systems, evaluation sets, business rules, and access controls.",
  },
  {
    icon: TrendingUp,
    title: "Improves over time",
    description:
      "Your business changes. Axiom is maintained and improved over time so your AI stays aligned with how your business actually operates.",
  },
];

const howItWorks = [
  { step: "01", title: "Discover", description: "We review your business, workflows, systems, documents, and high-value use cases — identifying where your important knowledge lives and where AI can create the most value." },
  { step: "02", title: "Map", description: "We map your knowledge, decision rules, workflows, document types, users, permissions, and operational logic — a clear picture of what the AI needs to understand." },
  { step: "03", title: "Structure", description: "We organise your knowledge into an AI-ready format: document structuring, data cleanup, taxonomy creation, knowledge base setup, metadata tagging, and instruction design." },
  { step: "04", title: "Configure", description: "We configure the AI layer around your business: retrieval systems, model instructions, role-specific access, prompt architecture, evaluation sets, and output standards." },
  { step: "05", title: "Test", description: "We test the AI against real scenarios — tenders, contracts, reports, emails, drawings, policies, project documents, and operational questions." },
  { step: "06", title: "Improve", description: "We refine the system based on feedback, edge cases, new documents, and changing needs. The intelligence layer becomes more useful as it learns from real operations." },
];

const primaryIndustries = [
  {
    icon: Building2,
    title: "Construction companies",
    description: "Builders managing tenders, contracts, programmes, and project documents at scale.",
  },
  {
    icon: Users,
    title: "Contracting firms",
    description: "Contractors and subcontractors handling compliance, claims, and on-site delivery.",
  },
];

const industries = [
  "Engineering firms",
  "Property & development",
  "Strata & remedial services",
  "Accounting & advisory",
  "Recruitment & migration",
  "Charities & associations",
  "Professional services",
  "Trade & service businesses",
  "Project-based businesses",
  "Compliance-heavy businesses",
];

const useCases = [
  {
    icon: Building2,
    title: "Construction & engineering",
    learns: "Drawings, specifications, tenders, contracts, RFIs, site reports, defect reports, QA checklists, safety procedures, variations, delay events, design standards.",
    supports: "Tender review, contract review, technical report drafting, site inspection reporting, project & delay risk analysis, variation prep, RFI drafting, onboarding, proposal generation.",
  },
  {
    icon: Calculator,
    title: "Accounting & advisory",
    learns: "Client profiles, email history, internal checklists, tax workflows, document collection processes, meeting summaries, advisory templates, compliance procedures.",
    supports: "Client email triage, document request automation, meeting summaries, onboarding, knowledge search, workflow automation, advisory report drafting, staff training.",
  },
  {
    icon: Home,
    title: "Strata & property services",
    learns: "Defect reports, committee communication, contractor quotes, maintenance history, meeting minutes, compliance registers, owner correspondence, building reports.",
    supports: "Defect report review, quote comparison, owner communication, minute summaries, maintenance planning, compliance tracking, issue escalation, report drafting.",
  },
  {
    icon: Users,
    title: "Recruitment & migration",
    learns: "Candidate profiles, job descriptions, client requirements, visa criteria, CV formats, screening rules, placement history, communication templates, compliance checklists.",
    supports: "CV screening, candidate ranking, job matching, document review, interview summaries, client follow-up, placement workflow automation.",
  },
];

const problems = [
  { title: "Your knowledge is scattered", description: "Important knowledge lives across emails, folders, systems, spreadsheets, documents, and people's heads. Axiom turns scattered knowledge into structured intelligence." },
  { title: "Your AI gives generic output", description: "Generic AI does not know your standards, clients, projects, risks, templates, or preferences. Axiom grounds AI in your business context." },
  { title: "Your team repeats the same explanations", description: "Senior staff answer the same internal questions repeatedly. Axiom turns repeated knowledge into reusable AI support." },
  { title: "Your workflows depend too much on key people", description: "When knowledge sits with a few experienced people, the business becomes fragile. Axiom preserves and distributes operational knowledge." },
  { title: "Your AI agents are not ready for serious work", description: "Agents need context before they can execute complex tasks. Axiom gives them the knowledge and logic they need to work properly." },
];

const differentiators = [
  { icon: Layers, title: "Deeper than a chatbot over documents", description: "Uploading PDFs into a chatbot is not enough. Axiom structures knowledge, maps workflows, defines business rules, and tests outputs for real operational use." },
  { icon: Network, title: "Captures both knowledge and judgement", description: "Your documents explain part of the business. Your judgement explains the rest. Axiom captures both." },
  { icon: Settings2, title: "Built for execution", description: "The goal is not just better search — it is to power agents, dashboards, reports, workflows, and decisions." },
  { icon: ShieldCheck, title: "Done for you", description: "Your team does not need to become AI engineers. We design, configure, test, and improve the intelligence layer for your business." },
];

const ecosystem = [
  { icon: Bot, name: "Butler", slug: "butler", line: "Axiom gives the business knowledge. Butler uses that knowledge to complete work.", example: "A Tender Butler can only review tenders properly if Axiom understands your pricing logic, risk appetite, project history, and contract terms." },
  { icon: Eye, name: "Watch", slug: "watch", line: "Axiom gives Watch the context to detect risks, patterns, trends, and forward signals.", example: "A dashboard becomes more useful when it knows which delays are normal, which issues are dangerous, and which risks to escalate." },
  { icon: LayoutGrid, name: "AOS", slug: "aos", line: "Axiom connects your knowledge into the operating system that runs workflows, users, integrations, approvals, and agents.", example: "When a task, approval, report, or agent action happens inside AOS, Axiom provides the business context behind it." },
];

const deliverables = [
  "AI readiness review",
  "Business knowledge audit",
  "Workflow and process mapping",
  "Document and data source review",
  "Knowledge architecture",
  "AI-ready document structuring",
  "Business rule mapping",
  "Decision logic mapping",
  "Industry-specific configuration",
  "Internal AI instruction layer",
  "Retrieval and knowledge base setup",
  "Evaluation and testing framework",
  "Use case prioritisation",
  "Agent-ready knowledge layer",
  "Access and permission recommendations",
  "Ongoing knowledge updates",
  "Internal AI playbook",
];

const outcomes = [
  "Your AI understands your context.",
  "Your agents follow better instructions.",
  "Your dashboards detect smarter signals.",
  "Your staff find knowledge faster.",
  "Your workflows become more consistent.",
  "Your business becomes less dependent on repeated manual explanation.",
];

const AxiomPage = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingTitle, setBookingTitle] = useState("Book an AI Readiness Session");

  const openBooking = (title: string) => {
    setBookingTitle(title);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Axiom | Machine Learning Deep Tech Engine"
        description="Axiom turns your business documents, workflows, SOPs, risks, policies, templates, and decision rules into a machine learning deep tech engine that powers smarter agents, dashboards, and automation."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Products", url: "/products" },
          { name: "Axiom", url: "/products/axiom" },
        ]}
        product={productSchemaFor("axiom")}
      />
      <Header />

      <main>
        {/* Hero */}
        <section className="relative flex items-center min-h-[92vh] pt-32 pb-16 md:pt-40 md:pb-28 bg-background overflow-hidden">
          {/* Looping construction background video */}
          <video
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            src={heroVideo.url}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
          />
          {/* Readability overlays */}
          <div className="absolute inset-0 bg-background/60 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/35 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background pointer-events-none" />
          {/* Engineered grid texture */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage: "radial-gradient(ellipse at 65% 40%, black, transparent 75%)",
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
                  <BreadcrumbPage>Axiom</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <motion.div {...fadeUp} className="max-w-3xl">
              <div className="inline-flex items-center gap-2 mb-6 rounded-full border border-border bg-card/70 backdrop-blur-sm px-3.5 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
                  Machine learning deep tech · Engine 01
                </span>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <Engine6 className="w-12 h-12 text-foreground" />
                <h1 className="text-4xl md:text-6xl font-black text-foreground leading-[1.05] tracking-tight font-product">
                  Axiom<span className="sr-only"> — AI knowledge and learning engine for construction businesses</span>
                </h1>
              </div>
              <p className="text-xl md:text-2xl font-semibold text-foreground mb-4 leading-snug">
                Train AI on the logic of your business.
              </p>
              <motion.p
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed"
              >
                Axiom turns your tenders, drawings, contracts, SOPs, risk registers, pricing logic, and project
                records into an AI-ready machine learning deep tech engine that powers smarter agents, sharper dashboards, and
                automation that understands how your jobs are actually won and delivered.
              </motion.p>

              <div className="flex flex-col sm:flex-row gap-3 mt-7">
                <Button variant="cta" size="lg" onClick={() => openBooking("Book an AI Readiness Session")} className="min-h-touch">
                  Book a consultation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="cta-outline" size="lg" onClick={() => openBooking("Request an AI Knowledge Audit")} className="min-h-touch">
                  Request an AI knowledge audit
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <AxiomHeroDemo />
            </motion.div>
            </div>
          </div>
        </section>

        {/* What is machine learning? — animated explainer */}
        <MachineLearningExplainer />




        {/* Generic AI vs your business — combined diagram */}
        <BusinessContextDiagram />


        {/* What is Axiom */}
        <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <motion.div {...fadeUp}>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">What is Axiom?</span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mt-2 mb-4">
                A done-for-you AI intelligence engine.
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Axiom trains your AI on how your construction or contracting business actually works — turning your
                knowledge, workflows and rules into a ready-to-use intelligence layer.
              </p>
            </motion.div>
            <motion.div {...fadeUp}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                It can power
              </h3>
              <ul className="grid sm:grid-cols-2 gap-3">
                {[
                  "AI agents",
                  "Chat assistants",
                  "Workflow automation",
                  "Dashboards & reporting",
                  "Onboarding systems",
                  "Decision support",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground leading-relaxed">{p}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>

        {/* What Axiom learns */}
        <section className="py-14 md:py-20 bg-background">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">What Axiom learns</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Instead of relying on generic knowledge, your AI starts working from your company's own operating logic.
              </p>
            </motion.div>

            <motion.div {...fadeUp} className="mb-10">
              <AxiomLearnsAnimation />
            </motion.div>

            <div className="flex flex-wrap gap-2.5">
              {learns.map((l, i) => (
                <motion.span
                  key={l}
                  initial={{ opacity: 0, y: 12, scale: 0.92 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.35,
                    delay: Math.min(i * 0.04, 0.6),
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{ scale: 1.06, y: -2 }}
                  className="cursor-default rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:border-foreground/30 hover:bg-muted/60 hover:text-foreground"
                >
                  {l}
                </motion.span>
              ))}
            </div>
          </div>
        </section>

        {/* What Axiom does */}
        <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <motion.h2 {...fadeUp} className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-8">
              What Axiom does
            </motion.h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {whatItDoes.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.25) }}
                    className="rounded-2xl border border-border bg-card p-6 hover:border-foreground/20 hover:shadow-elevation-3 transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-14 md:py-20 bg-background">
          <div className="container-wide">
            <motion.h2 {...fadeUp} className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-8">
              How Axiom works
            </motion.h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {howItWorks.map((s) => (
                <div key={s.step} className="rounded-2xl border border-border bg-card p-6">
                  <span className="text-2xl font-bold tracking-tight text-muted-foreground/30 tabular-nums">{s.step}</span>
                  <h3 className="text-base font-bold text-foreground mt-2 mb-1.5">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Built for industries — clean enterprise light */}
        <section className="bg-background text-foreground py-20 md:py-28 border-y border-border">
          <div className="container-wide">
            {/* Header */}
            <motion.div {...fadeUp} className="max-w-3xl mb-14 md:mb-16">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Built for industries</span>
              <h2 className="mt-3 text-3xl md:text-[2.75rem] font-extrabold tracking-tight leading-[1.08]">
                Engineered for the sectors where generic AI falls short.
              </h2>
            </motion.div>

            {/* Primary focus — two flagship cards */}
            <div className="grid md:grid-cols-2 gap-5 lg:gap-6 mb-14 md:mb-16">
              {primaryIndustries.map((ind, i) => {
                const Icon = ind.icon;
                return (
                  <motion.div
                    key={ind.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className="group rounded-2xl border border-border bg-card p-7 md:p-10 shadow-sm transition-all duration-400 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted text-foreground mb-5">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-2">{ind.title}</h3>
                    <p className="text-sm md:text-[15px] leading-relaxed text-muted-foreground">
                      {ind.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            {/* Also built for — structured text row */}
            <motion.div {...fadeUp} className="border-t border-border pt-8 md:pt-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground mb-5">
                Also built for
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-3">
                {industries.map((ind, i) => (
                  <motion.span
                    key={ind}
                    initial={{ opacity: 0, y: 6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {ind}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>


        {/* Use cases */}
        <section className="py-14 md:py-20 bg-background">
          <div className="container-wide">
            <motion.h2 {...fadeUp} className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-8">
              Example use cases
            </motion.h2>
            <div className="grid md:grid-cols-2 gap-5">
              {useCases.map((u, i) => {
                const Icon = u.icon;
                return (
                  <motion.div
                    key={u.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.2) }}
                    className="rounded-2xl border border-border bg-card p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center">
                        <Icon className="w-5 h-5 text-foreground" />
                      </div>
                      <h3 className="text-base font-bold text-foreground">{u.title}</h3>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Learns from</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{u.learns}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Supports</p>
                    <p className="text-sm text-foreground leading-relaxed">{u.supports}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* The problem Axiom solves */}
        <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <motion.h2 {...fadeUp} className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-8">
              The problem Axiom solves
            </motion.h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {problems.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.25) }}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <h3 className="text-base font-bold text-foreground mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* What makes it different */}
        <section className="py-14 md:py-20 bg-background">
          <div className="container-wide">
            <motion.h2 {...fadeUp} className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-8">
              What makes Axiom different?
            </motion.h2>
            <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
              {differentiators.map((d, i) => {
                const Icon = d.icon;
                return (
                  <motion.div
                    key={d.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.2) }}
                    className="rounded-2xl border border-border bg-card p-6 flex gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground mb-1.5">{d.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{d.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Visuals: system diagram, comparison, graphs, testimonial */}
        <AxiomVisuals />

        {/* Ecosystem */}
        <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                Built to power the alfred ai ecosystem
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Axiom is the intelligence foundation behind the rest of the alfred ai suite.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-3 gap-4 md:gap-5">
              {ecosystem.map((e, i) => {
                const Icon = e.icon;
                return (
                  <motion.div
                    key={e.name}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.2) }}
                    className="rounded-2xl border border-border bg-card p-6"
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <Engine6 className="w-4 h-4 text-foreground" />
                      <span className="text-sm font-semibold text-muted-foreground">Axiom +</span>
                      <Icon className="w-4 h-4 text-foreground" />
                      <span className="text-sm font-bold text-foreground">{e.name}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed mb-3">{e.line}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4 italic">{e.example}</p>
                    <Link
                      to={`/products/${e.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:gap-2.5 transition-all min-h-touch"
                    >
                      Explore {e.name}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* What you get */}
        <section className="py-14 md:py-20 bg-background">
          <div className="container-wide grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <motion.div {...fadeUp}>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-4">What you get</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4">
                Depending on your scope, Axiom may include a full set of deliverables to build and maintain your
                AI intelligence layer.
              </p>
              <div className="rounded-2xl border border-border bg-muted/40 p-6">
                <FlaskConical className="w-6 h-6 text-foreground mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">It is done for you.</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your team does not need to become AI engineers. We design, configure, test, and improve the
                  intelligence layer for your business.
                </p>
              </div>
            </motion.div>
            <motion.ul {...fadeUp} className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {deliverables.map((d) => (
                <li key={d} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </span>
                  <span className="text-sm text-foreground leading-relaxed">{d}</span>
                </li>
              ))}
            </motion.ul>
          </div>
        </section>

        {/* The outcome */}
        <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">The outcome</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                After Axiom, your business has a stronger AI foundation. Axiom turns your business knowledge into
                operational intelligence.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {outcomes.map((o) => (
                <div key={o} className="flex items-start gap-3 rounded-xl border border-border bg-card p-5">
                  <FileText className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground leading-relaxed">{o}</span>
                </div>
              ))}
            </div>
            <motion.div {...fadeUp} className="mt-8 rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground mb-1">Not sure where to start?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We can review your documents, workflows, and systems to identify the highest-value AI opportunities in
                  your business.
                </p>
              </div>
              <Button
                variant="cta-outline"
                size="lg"
                onClick={() => openBooking("Request an AI Knowledge Audit")}
                className="min-h-touch flex-shrink-0"
              >
                Request an AI knowledge audit
              </Button>
            </motion.div>
          </div>
        </section>

        <PremiumCTASection
          title="Build AI that understands your business."
          description="Book an AI readiness session and see how Axiom can turn your business knowledge into a practical intelligence layer."
          buttonText="Book a consultation"
          onButtonClick={() => openBooking("Book an AI Readiness Session")}
          variant="light"
        />
      </main>

      <Footer />
      <GHLBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        title={bookingTitle}
        description="Book a 30-minute working session to see how Axiom turns your business knowledge into operational intelligence."
      />
    </div>
  );
};

export default AxiomPage;
