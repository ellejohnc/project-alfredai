import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  FileText, BarChart3, Building2, Home, Users2, Shield, 
  ArrowRight, Filter, Calculator, HardHat, Wrench, Briefcase,
  Sparkles, Zap, Bot, Megaphone, Plane, Heart
} from "lucide-react";
import SEO from "@/components/SEO";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BookingChatModal from "@/components/BookingChatModal";
import ROICalculator from "@/components/ROICalculator";
import BeforeAfterComparison from "@/components/impact/BeforeAfterComparison";

type ContentType = "all" | "case-studies" | "roi" | "calculator";

const caseStudies = [
  {
    id: "wzw-construction",
    type: "case-study",
    industry: "Construction",
    icon: Building2,
    title: "WZW Construction Cuts Project Admin by 60%",
    role: "Operations Manager",
    problem: "Drawings, RFIs and site notes scattered across email, WhatsApp and shared drives — PMs losing 2+ hours/day chasing the latest version.",
    solution: "Deployed alfred ai's Business Operating System with agentic Document Intelligence to auto-route drawings, RFIs and variations into a single source of truth.",
    outcome: "Project managers reclaim two full days a week — AI agents own the document trail end-to-end.",
    metrics: { timeSaved: 18, timeSavedUnit: "hrs/week", revenue: 145, payback: "10 weeks" },
  },
  {
    id: "worthington-homes",
    type: "case-study",
    industry: "Construction",
    icon: Home,
    title: "Worthington Homes Compresses Pre-Construction by 38%",
    role: "Estimating Lead",
    problem: "Manual takeoffs and supplier pricing comparisons stretching tender turnaround to 3+ weeks, costing live opportunities.",
    solution: "alfred ai's Drawings-to-Estimate agent auto-extracts quantities and benchmarks supplier rates, with humans reviewing exceptions only.",
    outcome: "Tenders go out 38% faster and the win rate has lifted as estimators focus on commercial strategy, not data entry.",
    metrics: { timeSaved: 24, timeSavedUnit: "hrs/tender", revenue: 220, payback: "8 weeks" },
  },
  {
    id: "first-facades",
    type: "case-study",
    industry: "Contracting",
    icon: HardHat,
    title: "First Facades Eliminates 70% of RFI Backlog",
    role: "Project Director",
    problem: "Façade RFIs queued for days, holding up installation crews and triggering EOT claims.",
    solution: "AI agents triage incoming RFIs, draft responses with full drawing context and route to the right engineer for sign-off.",
    outcome: "RFI backlog down 70% and site delivery dates pulled forward by an average of four days per project.",
    metrics: { timeSaved: 12, timeSavedUnit: "hrs/week", revenue: 165, payback: "6 weeks" },
  },
  {
    id: "krgs-doors",
    type: "case-study",
    industry: "Contracting",
    icon: Wrench,
    title: "KRGS Doors Scales Quoting Without New Hires",
    role: "General Manager",
    problem: "Quote volume up 40% year-on-year but the estimating team capped at current headcount, with response times slipping.",
    solution: "alfred ai's Quote-Assist agent pre-fills line items from spec sheets, applies current supplier rates and flags missing data for human sign-off.",
    outcome: "Quoting throughput doubled with zero additional hires — estimators now review and approve rather than build from scratch.",
    metrics: { timeSaved: 28, timeSavedUnit: "hrs/week", revenue: 210, payback: "9 weeks" },
  },
  {
    id: "aspect-windows",
    type: "case-study",
    industry: "Contracting",
    icon: HardHat,
    title: "Aspect Windows Compresses Quote-to-Order by 45%",
    role: "Sales Manager",
    problem: "Custom window quotes required manual takeoffs, supplier price look-ups and CAD-spec checks — turnaround stretching past a week.",
    solution: "alfred ai's Quote Agent reads drawings, generates compliant frame/glass schedules and assembles a pricing-ready quote for the sales team to release.",
    outcome: "Quote-to-order 45% faster and conversion up 19% as builders get a same-day quote with the right schedule attached.",
    metrics: { timeSaved: 16, timeSavedUnit: "hrs/week", revenue: 175, payback: "7 weeks" },
  },
  {
    id: "jca-lift-consultants",
    type: "case-study",
    industry: "Consultants",
    icon: Briefcase,
    title: "JCA Lift Consultants Doubles Inspection Reporting Capacity",
    role: "Principal Consultant",
    problem: "Senior consultants writing inspection reports late into the evening; turnaround averaging five business days.",
    solution: "Voice-to-report AI agent drafts compliant inspection reports from on-site dictation, with the engineer reviewing and signing off.",
    outcome: "Reports turn around in under 48 hours and each consultant handles roughly twice the inspections per month.",
    metrics: { timeSaved: 11, timeSavedUnit: "hrs/week", revenue: 175, payback: "6 weeks" },
  },
  {
    id: "aslan",
    type: "case-study",
    industry: "Consultants",
    icon: Shield,
    title: "Aslan Resolves 3x More Support Cases Without Growing the Team",
    role: "Head of Client Success",
    problem: "Inbound help requests across email, chat and forms — triaging and drafting responses was eating most of the consultant day.",
    solution: "alfred ai's Support Agent classifies each request, pulls policy and case history, and drafts a recommended response for human review.",
    outcome: "3x more cases resolved per day with 72% of first replies auto-drafted in the firm's voice.",
    metrics: { timeSaved: 14, timeSavedUnit: "hrs/week", revenue: 165, payback: "6 weeks" },
  },
  {
    id: "access-link-consulting",
    type: "case-study",
    industry: "Consultants",
    icon: Briefcase,
    title: "Access Link Consulting Halves Report Turnaround",
    role: "Managing Consultant",
    problem: "Compliance and access-strategy reports required hours of manual evidence-gathering across portals, regulators and prior engagements.",
    solution: "An alfred ai research agent assembles the evidence pack, pre-drafts against the firm's templates and flags gaps for the consultant.",
    outcome: "Reports out in half the time and 2.2x more engagements delivered per quarter without adding headcount.",
    metrics: { timeSaved: 18, timeSavedUnit: "hrs/week", revenue: 195, payback: "7 weeks" },
  },
  {
    id: "pop-business",
    type: "case-study",
    industry: "Accounting",
    icon: Calculator,
    title: "Pop Business Lifts Advisory Hours by 32%",
    role: "Practice Lead",
    problem: "Senior accountants stuck in BAS prep and reconciliations, leaving little capacity for high-margin advisory work.",
    solution: "alfred ai's Bookkeeping Co-Pilot autonomously reconciles ledgers, drafts BAS lodgements and surfaces exceptions for human review.",
    outcome: "Advisory hours per accountant up 32%, fuelling a meaningful lift in retainer revenue without growing the team.",
    metrics: { timeSaved: 14, timeSavedUnit: "hrs/week", revenue: 185, payback: "7 weeks" },
  },
  {
    id: "yousolved-recruitment",
    type: "case-study",
    industry: "Recruitment",
    icon: Users2,
    title: "YouSolved Triples Candidate Shortlists Per Consultant",
    role: "Managing Director",
    problem: "Consultants screening 200+ CVs per role manually, with top candidates lost to faster-moving competitors.",
    solution: "AI agents shortlist, score and pre-screen candidates against the role brief, handing off only qualified pipelines.",
    outcome: "Shortlists per consultant tripled and placement rate climbed 28% as recruiters focus on relationships, not screening.",
    metrics: { timeSaved: 22, timeSavedUnit: "hrs/week", revenue: 240, payback: "5 weeks" },
  },
  {
    id: "australian-skilled-migration",
    type: "case-study",
    industry: "Immigration",
    icon: Plane,
    title: "Australian Skilled Migration Cuts Case Prep by 55%",
    role: "Migration Practice Lead",
    problem: "Document collection, eligibility checks and DHA form prep consuming 60% of agent time per file.",
    solution: "alfred ai's Casework Agent collects, validates and assembles client documentation against current DHA criteria — agents focus on assessment.",
    outcome: "Case prep is 55% faster and active caseload per agent has roughly doubled with no drop in approval rates.",
    metrics: { timeSaved: 20, timeSavedUnit: "hrs/week", revenue: 195, payback: "8 weeks" },
  },
  {
    id: "eweb-marketing",
    type: "case-study",
    industry: "Marketing",
    icon: Megaphone,
    title: "Eweb Marketing Delivers 2.4x More Client Campaigns",
    role: "Agency Director",
    problem: "Strategists spending hours hand-writing briefs, reports and ad-copy variants for each retainer client.",
    solution: "alfred ai's Campaign Agent drafts briefs, ad variants and monthly performance reports — strategists edit and approve.",
    outcome: "Campaigns shipped per month up 2.4x and retainer margin up 37% as strategists spend their time on strategy, not first drafts.",
    metrics: { timeSaved: 16, timeSavedUnit: "hrs/week", revenue: 230, payback: "6 weeks" },
  },
  {
    id: "netsynergy-media",
    type: "case-study",
    industry: "Marketing",
    icon: Megaphone,
    title: "NetSynergy Media Lifts Paid-Media Output by 2.8x",
    role: "Founder",
    problem: "Monthly ad creative, landing copy and reporting decks for every client were capping how many accounts the team could profitably run.",
    solution: "alfred ai's Creative Agent generates on-brand ad variants, landing copy and monthly performance summaries from live campaign data.",
    outcome: "Creative output up 2.8x and account margin up 31% — more clients served by the same team.",
    metrics: { timeSaved: 15, timeSavedUnit: "hrs/week", revenue: 215, payback: "6 weeks" },
  },
  {
    id: "st-merkorious-charity",
    type: "case-study",
    industry: "Charity",
    icon: Heart,
    title: "St Merkorious Charity Triples Cases Served Per Caseworker",
    role: "Operations Lead",
    problem: "Volunteer caseworkers spending most of their week on intake forms, donor acknowledgements and grant reporting.",
    solution: "alfred ai's Caseworker Agent handles intake triage, drafts donor thank-yous and assembles grant-acquittal reports for human sign-off.",
    outcome: "3x more cases served per caseworker with grant acquittals filed on time, every time.",
    metrics: { timeSaved: 12, timeSavedUnit: "hrs/week", revenue: 95, payback: "5 weeks" },
  },
];

const roiBreakdowns = [
  {
    id: 4,
    type: "roi",
    title: "Agentic Workforce ROI Model",
    description: "Detailed breakdown of time and cost savings when AI agents own end-to-end workflows—learning and adapting as they work.",
    metrics: {
      agentDeployment: "$12K/year agent cost",
      humanTimeRecovered: "1,200 hrs/year recovered",
      netSavings: "$126K net savings/year",
      roi: "520%",
    },
  },
  {
    id: 5,
    type: "roi",
    title: "AI-Augmented Revenue Model",
    description: "How AI agents expand your team's capacity to focus on high-value work that drives revenue.",
    metrics: {
      beforeAgents: "$95K revenue/head",
      withAgents: "$142K revenue/head",
      capacityGain: "+49% capacity gain",
      roi: "380%",
    },
  },
  {
    id: 6,
    type: "roi",
    title: "Scale with AI Agents Model",
    description: "Deploy AI agents in days to handle growing workload—compared to months of recruiting, training, and onboarding.",
    metrics: {
      traditionalHire: "$85K per new hire",
      aiAgentCost: "$12K/year per agent",
      timeToValue: "Days vs. months",
      roi: "608%",
    },
  },
];

const filters = [
  { id: "all", label: "All", promoted: false },
  { id: "case-studies", label: "Case Studies", promoted: false },
  { id: "roi", label: "ROI Breakdowns", promoted: false },
  { id: "calculator", label: "Agentic AI ROI Calculator", icon: Calculator, promoted: true },
];

// Animated metrics component for case studies
const CaseStudyMetrics = ({ metrics }: { metrics: { timeSaved: number; timeSavedUnit: string; revenue: number; payback: string } }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  return (
    <div ref={ref} className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
      <div className="text-center">
        <div className="text-sm font-semibold text-secondary">
          {isInView ? (
            <AnimatedNumber value={metrics.timeSaved} suffix={` ${metrics.timeSavedUnit}`} duration={1500} />
          ) : (
            `0 ${metrics.timeSavedUnit}`
          )}
        </div>
        <div className="text-xs text-muted-foreground">Time Recovered</div>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-secondary">
          {isInView ? (
            <AnimatedNumber value={metrics.revenue} prefix="+$" suffix="K/yr" duration={1800} />
          ) : (
            "+$0K/yr"
          )}
        </div>
        <div className="text-xs text-muted-foreground">Revenue Impact</div>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-secondary">{metrics.payback}</div>
        <div className="text-xs text-muted-foreground">Payback</div>
      </div>
    </div>
  );
};

// Animated metrics for ROI breakdowns
const ROIMetric = ({ label, value, isROI = false }: { label: string; value: string; isROI?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });
  
  // Extract numeric value and format
  const numericMatch = value.match(/[\d,]+/);
  const numericValue = numericMatch ? parseInt(numericMatch[0].replace(/,/g, '')) : null;
  const prefix = value.match(/^[^\d]*/)?.[0] || '';
  const suffix = value.match(/[^\d]*$/)?.[0] || '';
  
  return (
    <div ref={ref} className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground capitalize">
        {label.replace(/([A-Z])/g, ' $1').trim()}
      </span>
      <span className={`text-sm font-semibold ${isROI ? 'text-secondary' : 'text-foreground'}`}>
        {numericValue !== null && isInView ? (
          <AnimatedNumber value={numericValue} prefix={prefix} suffix={suffix} duration={1500} />
        ) : (
          value
        )}
      </span>
    </div>
  );
};

const ImpactStudies = () => {
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ContentType>("all");

  const filteredContent = () => {
    switch (activeFilter) {
      case "case-studies":
        return { caseStudies, roiBreakdowns: [], showCalculator: false, limitCaseStudies: false };
      case "roi":
        return { caseStudies: [], roiBreakdowns, showCalculator: false, limitCaseStudies: false };
      case "calculator":
        return { caseStudies: [], roiBreakdowns: [], showCalculator: true, limitCaseStudies: false };
      default:
        return { caseStudies, roiBreakdowns, showCalculator: true, limitCaseStudies: true };
    }
  };

  const content = filteredContent();
  const displayedCaseStudies = content.limitCaseStudies ? content.caseStudies.slice(0, 3) : content.caseStudies;

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Construction AI ROI & Case Studies"
        description="Real results from construction and contracting businesses using agentic AI. Case studies showing 10x faster execution, reduced admin time, and improved accountability."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Impact Studies", url: "/impact-studies" }
        ]}
      />
      <Header />
      
      <main>
        {/* Hero */}
        <section className="pt-32 pb-16 md:pt-40 md:pb-24 bg-background relative overflow-hidden">
          {/* Premium gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent pointer-events-none" />
          <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="container-wide relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-6 leading-tight">
                Outcomes, not promises
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Real results from real organisations. Case studies, ROI breakdowns, and testimonials 
                from decision-makers who measured the impact.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ROI Calculator Promotional Banner */}
        <section className="py-6 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-b border-primary/20">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg"
                  animate={{ 
                    boxShadow: ["0 0 20px hsla(var(--primary) / 0.3)", "0 0 40px hsla(var(--primary) / 0.5)", "0 0 20px hsla(var(--primary) / 0.3)"]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Calculator className="w-6 h-6 text-primary-foreground" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    Calculate Your AI ROI in 60 Seconds
                    <span className="px-2 py-0.5 text-xs font-bold bg-secondary/20 text-secondary rounded-full">
                      FREE
                    </span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    See exactly how much time and money you'll save with Agentic AI
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setActiveFilter("calculator")}
                className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-primary-foreground font-semibold px-6 group"
              >
                <Sparkles className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                Try the Calculator
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Filters */}
        <section className="py-4 bg-background border-b border-border sticky top-[72px] z-40">
          <div className="container-wide">
            <div className="flex items-center gap-4 flex-wrap">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <div className="flex gap-2 flex-wrap">
                {filters.map((filter) => (
                  <motion.button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id as ContentType)}
                    whileHover={{ scale: filter.promoted ? 1.05 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                      filter.promoted
                        ? activeFilter === filter.id
                          ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg"
                          : "bg-gradient-to-r from-primary/20 to-secondary/20 text-foreground border border-primary/30 hover:border-primary/50 hover:shadow-md"
                        : activeFilter === filter.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {filter.promoted && filter.icon && (
                      <filter.icon className="w-4 h-4" />
                    )}
                    {filter.label}
                    {filter.promoted && activeFilter !== filter.id && (
                      <>
                        <Zap className="w-3 h-3 text-secondary" />
                        <motion.span
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 bg-background-alt">
          <div className="container-wide space-y-16">
            {/* Case Studies */}
            {content.caseStudies.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <Bot className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-semibold text-foreground">AI Agent Success Stories</h2>
                  </div>
                  {content.limitCaseStudies && content.caseStudies.length > 3 && (
                    <Link 
                      to="/impact-studies/case-studies"
                      className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                    >
                      See all success stories
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
                <div className="grid lg:grid-cols-3 gap-6">
                  {displayedCaseStudies.map((study, index) => (
                    <Link
                      key={study.id}
                      to={`/impact-studies/case-studies?study=${study.id}`}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all group cursor-pointer h-full"
                      >
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <study.icon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <span className="text-xs font-medium text-primary">{study.industry}</span>
                              <span className="text-xs text-muted-foreground"> • {study.role}</span>
                            </div>
                          </div>
                          <h3 className="text-lg font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                            {study.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">{study.problem}</p>
                          <p className="text-sm text-foreground mb-4">{study.outcome}</p>
                          
                          {/* Metrics with Animated Numbers */}
                          <CaseStudyMetrics metrics={study.metrics} />
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Before/After Comparison - Show on "all" filter */}
            {activeFilter === "all" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <BeforeAfterComparison />
              </motion.div>
            )}

            {/* ROI Breakdowns */}
            {content.roiBreakdowns.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-semibold text-foreground">Agentic AI ROI Models</h2>
                  </div>
                  <Link 
                    to="/impact-studies/roi-breakdowns"
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                  >
                    See all ROI models
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid lg:grid-cols-3 gap-6">
                  {content.roiBreakdowns.map((roi, index) => (
                    <motion.div
                      key={roi.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-all"
                    >
                      <h3 className="text-lg font-semibold text-foreground mb-2">{roi.title}</h3>
                      <p className="text-sm text-muted-foreground mb-6">{roi.description}</p>
                      
                      <div className="space-y-3">
                        {Object.entries(roi.metrics).map(([key, value]) => (
                          <ROIMetric key={key} label={key} value={value} isROI={key === 'roi'} />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ROI Calculator */}
            {content.showCalculator && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Calculator className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                      Agentic AI ROI Calculator
                      <span className="px-2 py-0.5 text-xs font-bold bg-secondary/20 text-secondary rounded-full">
                        INTERACTIVE
                      </span>
                    </h2>
                  </div>
                </div>
                <p className="text-muted-foreground mb-8 max-w-2xl">
                  Unlike traditional automation, alfred ai agents learn, reason, and adapt to your business.
                  Enter your team details to see projected time savings, cost reduction, and revenue impact.
                </p>
                <div className="max-w-2xl">
                  <ROICalculator />
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-accent">
          <div className="container-wide text-center">
            <h2 className="text-3xl md:text-4xl font-semibold text-accent-foreground mb-4">
              Ready to measure your own impact?
            </h2>
            <p className="text-lg text-accent-foreground/70 mb-8 max-w-2xl mx-auto">
              Book a 30-minute Impact Conversation. We'll map your current state and 
              project realistic outcomes for your organisation.
            </p>
            <Button
              onClick={() => setIsCalendlyOpen(true)}
              className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold px-8 py-6 text-lg"
            >
              Book an Impact Conversation
            </Button>
          </div>
        </section>
      </main>

      <Footer />
      <BookingChatModal isOpen={isCalendlyOpen} onClose={() => setIsCalendlyOpen(false)} />
    </div>
  );
};

export default ImpactStudies;
