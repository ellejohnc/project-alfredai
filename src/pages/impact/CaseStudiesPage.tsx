import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, Building2, Home, Users2, Shield, FileText, 
  Clock, TrendingUp, DollarSign, Filter, HardHat, Briefcase,
  Wrench, Calculator, Megaphone, Plane, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DragScrollArea } from "@/components/ui/drag-scroll-area";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BookingChatModal from "@/components/BookingChatModal";
import PremiumCTASection from "@/components/sections/PremiumCTASection";
import SEO from "@/components/SEO";

const industries = ["All", "Construction", "Contracting", "Consultants", "Accounting", "Recruitment", "Immigration", "Marketing", "Charity"];

const caseStudies = [
  {
    id: "wzw-construction",
    industry: "Construction",
    icon: Building2,
    title: "WZW Construction Cuts Project Admin by 60%",
    company: "WZW Construction",
    role: "Operations Manager",
    challenge: "Drawings, RFIs and site notes scattered across email, WhatsApp and shared drives meant PMs were spending 2+ hours a day chasing the latest version — and rework was eating margin.",
    solution: "Deployed alfred ai's Business Operating System with agentic Document Intelligence to auto-route drawings, RFIs and variations into a single source of truth across every project.",
    results: [
      { metric: "60%", label: "Admin Reduction" },
      { metric: "18 hrs/week", label: "Per PM Saved" },
      { metric: "$145K/year", label: "Capacity Recovered" },
      { metric: "10 weeks", label: "Payback Period" },
    ],
    quote: "Our PMs got two full days a week back. The agents own the document trail end-to-end — we just review and approve.",
    quoteAuthor: "Operations Manager, WZW Construction",
    outcomes: ["reduce-admin", "execution"],
  },
  {
    id: "worthington-homes",
    industry: "Construction",
    icon: Home,
    title: "Worthington Homes Compresses Pre-Construction by 38%",
    company: "Worthington Homes",
    role: "Estimating Lead",
    challenge: "Manual takeoffs and supplier-rate comparisons were stretching tender turnaround past three weeks, and live opportunities were being lost to faster competitors.",
    solution: "alfred ai's Drawings-to-Estimate agent extracts quantities directly from drawings, benchmarks supplier rates and prepares a reviewable draft — humans only touch exceptions.",
    results: [
      { metric: "38%", label: "Faster Tenders" },
      { metric: "24 hrs/tender", label: "Estimator Time Saved" },
      { metric: "+22%", label: "Tender Win Rate" },
      { metric: "8 weeks", label: "Payback Period" },
    ],
    quote: "We're tendering more jobs with the same team, and our estimators spend their time on commercial strategy instead of data entry.",
    quoteAuthor: "Estimating Lead, Worthington Homes",
    outcomes: ["scale-without-hiring", "revenue-per-head"],
  },
  {
    id: "first-facades",
    industry: "Contracting",
    icon: HardHat,
    title: "First Facades Eliminates 70% of RFI Backlog",
    company: "First Facades",
    role: "Project Director",
    challenge: "Façade RFIs sat queued for days, holding up installation crews on site and exposing the business to EOT claims.",
    solution: "AI agents triage incoming RFIs, draft a response with full drawing context and route to the right engineer for sign-off — with a clear audit trail.",
    results: [
      { metric: "70%", label: "RFI Backlog ↓" },
      { metric: "12 hrs/week", label: "Engineer Time Saved" },
      { metric: "4 days", label: "Earlier Site Delivery" },
      { metric: "6 weeks", label: "Payback Period" },
    ],
    quote: "RFIs used to be the bottleneck holding our crews back. Now answers come back same-day with the right detail attached.",
    quoteAuthor: "Project Director, First Facades",
    outcomes: ["execution", "reduce-admin"],
  },
  {
    id: "krgs-doors",
    industry: "Contracting",
    icon: Wrench,
    title: "KRGS Doors Scales Quoting Without New Hires",
    company: "KRGS Doors",
    role: "General Manager",
    challenge: "Quote volume was up 40% year-on-year but the estimating team was capped at current headcount, and response times to builders were starting to slip.",
    solution: "alfred ai's Quote-Assist agent pre-fills line items from spec sheets, applies current supplier rates and flags missing data so estimators review and approve rather than build from scratch.",
    results: [
      { metric: "2.1x", label: "Quoting Throughput" },
      { metric: "0", label: "New Hires Needed" },
      { metric: "$210K/year", label: "Cost Avoided" },
      { metric: "9 weeks", label: "Payback Period" },
    ],
    quote: "We doubled our quoting capacity without adding a single estimator. The agents handle the heavy lifting — we sign off.",
    quoteAuthor: "General Manager, KRGS Doors",
    outcomes: ["scale-without-hiring", "revenue-per-head"],
  },
  {
    id: "aspect-windows",
    industry: "Contracting",
    icon: HardHat,
    title: "Aspect Windows Compresses Quote-to-Order by 45%",
    company: "Aspect Windows",
    role: "Sales Manager",
    challenge: "Custom window quotes required manual takeoffs from architectural drawings, supplier price look-ups and CAD-spec checks — turnaround was stretching past a week and builders were going elsewhere.",
    solution: "alfred ai's Quote Agent reads supplied drawings, generates compliant frame/glass schedules and assembles a pricing-ready quote that the sales team reviews and releases.",
    results: [
      { metric: "45%", label: "Faster Quote-to-Order" },
      { metric: "16 hrs/week", label: "Estimator Time Saved" },
      { metric: "+19%", label: "Quote Conversion" },
      { metric: "7 weeks", label: "Payback Period" },
    ],
    quote: "Builders get a same-day quote with the right schedule attached. We're winning the jobs we used to lose to the faster supplier.",
    quoteAuthor: "Sales Manager, Aspect Windows",
    outcomes: ["execution", "revenue-per-head"],
  },
  {
    id: "jca-lift-consultants",
    industry: "Consultants",
    icon: Briefcase,
    title: "JCA Lift Consultants Doubles Inspection Reporting Capacity",
    company: "JCA Lift Consultants",
    role: "Principal Consultant",
    challenge: "Senior consultants were writing inspection reports late into the evening, and turnaround to clients averaged five business days — limiting how many sites they could service.",
    solution: "A voice-to-report AI agent drafts compliant inspection reports from on-site dictation, then the engineer reviews and signs off in minutes rather than hours.",
    results: [
      { metric: "2.0x", label: "Reports Per Consultant" },
      { metric: "48 hrs", label: "Client Turnaround" },
      { metric: "11 hrs/week", label: "Senior Time Reclaimed" },
      { metric: "6 weeks", label: "Payback Period" },
    ],
    quote: "I dictate on site, the agent drafts the report by the time I'm back in the car. Evenings are mine again.",
    quoteAuthor: "Principal Consultant, JCA Lift Consultants",
    outcomes: ["revenue-per-head", "reduce-admin"],
  },
  {
    id: "aslan",
    industry: "Consultants",
    icon: Shield,
    title: "Aslan Resolves 3x More Support Cases Without Growing the Team",
    company: "Aslan",
    role: "Head of Client Success",
    challenge: "Inbound help requests were arriving across email, web chat and forms — triaging, drafting responses and pulling case context was eating most of the consultant day.",
    solution: "alfred ai's Support Agent classifies each request, pulls the matching policy and case history, and drafts a recommended response — consultants review, adjust and send.",
    results: [
      { metric: "3.0x", label: "Cases Resolved/Day" },
      { metric: "72%", label: "First-Reply Auto-Drafted" },
      { metric: "14 hrs/week", label: "Per Consultant Saved" },
      { metric: "6 weeks", label: "Payback Period" },
    ],
    quote: "Our consultants spend their time on the calls that actually need a human. The agent handles the rest with our voice.",
    quoteAuthor: "Head of Client Success, Aslan",
    outcomes: ["scale-without-hiring", "execution"],
  },
  {
    id: "access-link-consulting",
    industry: "Consultants",
    icon: Briefcase,
    title: "Access Link Consulting Halves Report Turnaround",
    company: "Access Link Consulting",
    role: "Managing Consultant",
    challenge: "Compliance and access-strategy reports required hours of manual evidence-gathering across client portals, regulatory sources and prior engagements — slowing every deliverable.",
    solution: "An alfred ai research agent assembles the evidence pack, pre-drafts the report against the firm's templates and flags gaps for the consultant to address.",
    results: [
      { metric: "50%", label: "Faster Reports" },
      { metric: "2.2x", label: "Engagements/Quarter" },
      { metric: "18 hrs/week", label: "Per Consultant Saved" },
      { metric: "7 weeks", label: "Payback Period" },
    ],
    quote: "We deliver a tighter, better-evidenced report in half the time. Clients notice, and our pipeline reflects it.",
    quoteAuthor: "Managing Consultant, Access Link Consulting",
    outcomes: ["revenue-per-head", "execution"],
  },
  {
    id: "pop-business",
    industry: "Accounting",
    icon: Calculator,
    title: "Pop Business Lifts Advisory Hours by 32%",
    company: "Pop Business",
    role: "Practice Lead",
    challenge: "Senior accountants were stuck in BAS prep and reconciliations, leaving little capacity for the higher-margin advisory work clients were actually asking for.",
    solution: "alfred ai's Bookkeeping Co-Pilot autonomously reconciles ledgers, drafts BAS lodgements and surfaces exceptions — accountants review and approve rather than rebuild.",
    results: [
      { metric: "+32%", label: "Advisory Hours" },
      { metric: "14 hrs/week", label: "Per Accountant Saved" },
      { metric: "$185K/year", label: "Extra Advisory Revenue" },
      { metric: "7 weeks", label: "Payback Period" },
    ],
    quote: "Compliance work just happens in the background now. Our team finally has the headroom to do the advisory clients pay us for.",
    quoteAuthor: "Practice Lead, Pop Business",
    outcomes: ["revenue-per-head", "reduce-admin"],
  },
  {
    id: "yousolved-recruitment",
    industry: "Recruitment",
    icon: Users2,
    title: "YouSolved Triples Candidate Shortlists Per Consultant",
    company: "YouSolved",
    role: "Managing Director",
    challenge: "Consultants were screening 200+ CVs per role manually, and the best candidates were being snapped up by faster-moving competitors before YouSolved could respond.",
    solution: "AI agents shortlist, score and pre-screen candidates against the role brief, then hand off only qualified pipelines — with the full reasoning attached for the consultant.",
    results: [
      { metric: "3.0x", label: "Shortlists/Consultant" },
      { metric: "+28%", label: "Placement Rate" },
      { metric: "22 hrs/week", label: "Screening Time Saved" },
      { metric: "5 weeks", label: "Payback Period" },
    ],
    quote: "We're presenting shortlists in hours, not days. Our consultants spend their time with people, not spreadsheets.",
    quoteAuthor: "Managing Director, YouSolved",
    outcomes: ["scale-without-hiring", "execution"],
  },
  {
    id: "australian-skilled-migration",
    industry: "Immigration",
    icon: Plane,
    title: "Australian Skilled Migration Cuts Case Prep by 55%",
    company: "Australian Skilled Migration",
    role: "Migration Practice Lead",
    challenge: "Document collection, eligibility checks and Department of Home Affairs form preparation were consuming roughly 60% of agent time on every file.",
    solution: "alfred ai's Casework Agent collects, validates and assembles client documentation against current DHA criteria, so registered agents focus on assessment and strategy.",
    results: [
      { metric: "55%", label: "Faster Case Prep" },
      { metric: "2.0x", label: "Active Caseload/Agent" },
      { metric: "20 hrs/week", label: "Per Agent Saved" },
      { metric: "8 weeks", label: "Payback Period" },
    ],
    quote: "Files arrive at the agent already assembled and checked against DHA requirements. Approval rates held; throughput doubled.",
    quoteAuthor: "Migration Practice Lead, Australian Skilled Migration",
    outcomes: ["scale-without-hiring", "execution"],
  },
  {
    id: "eweb-marketing",
    industry: "Marketing",
    icon: Megaphone,
    title: "Eweb Marketing Delivers 2.4x More Client Campaigns",
    company: "Eweb Marketing",
    role: "Agency Director",
    challenge: "Strategists were spending hours hand-writing briefs, monthly reports and ad-copy variants for every retainer client, capping how many accounts each could service.",
    solution: "alfred ai's Campaign Agent drafts briefs, ad variants and monthly performance reports from live account data — strategists edit, brand-check and approve.",
    results: [
      { metric: "2.4x", label: "Campaigns/Month" },
      { metric: "+37%", label: "Retainer Margin" },
      { metric: "16 hrs/week", label: "Per Strategist Saved" },
      { metric: "6 weeks", label: "Payback Period" },
    ],
    quote: "Our strategists spend their time on strategy, not first drafts. Clients are getting more, better work — and we keep more of the retainer.",
    quoteAuthor: "Agency Director, Eweb Marketing",
    outcomes: ["revenue-per-head", "execution"],
  },
  {
    id: "netsynergy-media",
    industry: "Marketing",
    icon: Megaphone,
    title: "NetSynergy Media Lifts Paid-Media Output by 2.8x",
    company: "NetSynergy Media",
    role: "Founder",
    challenge: "Building monthly ad creative, landing-page copy and reporting decks for every client was capping how many accounts the team could profitably run.",
    solution: "alfred ai's Creative Agent generates on-brand ad variants, landing copy and monthly performance summaries from live campaign data — humans review and ship.",
    results: [
      { metric: "2.8x", label: "Creative Output" },
      { metric: "+31%", label: "Account Margin" },
      { metric: "15 hrs/week", label: "Per Strategist Saved" },
      { metric: "6 weeks", label: "Payback Period" },
    ],
    quote: "We're running more clients with the same team, and every account gets more creative tests per month than they used to in a quarter.",
    quoteAuthor: "Founder, NetSynergy Media",
    outcomes: ["scale-without-hiring", "revenue-per-head"],
  },
  {
    id: "st-merkorious-charity",
    industry: "Charity",
    icon: Heart,
    title: "St Merkorious Charity Triples Cases Served Per Caseworker",
    company: "St Merkorious Charity",
    role: "Operations Lead",
    challenge: "Volunteer caseworkers were spending most of their week on intake forms, donor acknowledgements and grant reporting — leaving limited time for the families who needed direct support.",
    solution: "alfred ai's Caseworker Agent handles intake triage, drafts donor thank-yous and assembles grant-acquittal reports from program data, with humans approving every send.",
    results: [
      { metric: "3.0x", label: "Cases/Caseworker" },
      { metric: "12 hrs/week", label: "Volunteer Time Reclaimed" },
      { metric: "100%", label: "Acquittals On Time" },
      { metric: "5 weeks", label: "Payback Period" },
    ],
    quote: "Our volunteers came here to help people, not chase paperwork. The agent gives them their week back so they can do the work that matters.",
    quoteAuthor: "Operations Lead, St Merkorious Charity",
    outcomes: ["reduce-admin", "scale-without-hiring"],
  },
];

const CaseStudiesPage = () => {
  const [searchParams] = useSearchParams();
  const [activeIndustry, setActiveIndustry] = useState("All");
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<typeof caseStudies[0] | null>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  // Handle deep-link to specific case study
  useEffect(() => {
    const studyId = searchParams.get("study");
    if (studyId) {
      const study = caseStudies.find(s => s.id === studyId);
      if (study) {
        // Set the industry filter to match
        if (study.industry !== activeIndustry && activeIndustry !== "All") {
          setActiveIndustry(study.industry);
        }
        // Scroll to the card after a short delay
        setTimeout(() => {
          const cardEl = cardRefs.current[studyId];
          if (cardEl) {
            cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
            // Open the full story modal
            setSelectedStudy(study);
          }
        }, 300);
      }
    }
  }, [searchParams]);

  const filteredStudies = activeIndustry === "All" 
    ? caseStudies 
    : caseStudies.filter(s => s.industry === activeIndustry);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Case Studies" 
        description="Real transformation stories from organisations using alfred ai. See challenges, solutions, and verified results across industries."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Impact Studies", url: "/impact-studies" },
          { name: "Case Studies", url: "/impact/case-studies" }
        ]}
      />
      <Header />
      
      <main>
        {/* Hero */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 bg-background relative overflow-hidden">
          {/* Animated gradient orbs */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent pointer-events-none" />
          <motion.div 
            className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] pointer-events-none"
            animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-secondary/15 rounded-full blur-[100px] pointer-events-none"
            animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.2, 0.15] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          
          <div className="container-wide relative">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Link
                to="/impact-studies"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Impact Studies
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="max-w-3xl"
            >
              <motion.div 
                className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <FileText className="w-7 h-7 text-primary" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-4 leading-tight">
                Case Studies
              </h1>
              <p className="text-xl text-muted-foreground">
                Real transformation stories from organisations that measured their impact. See the challenges, solutions, and verified results.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Industry Filter */}
        <section className="py-4 bg-background border-b border-border sticky top-[72px] z-40">
          <div className="container-wide">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <DragScrollArea contentClassName="pb-2">
                <div className="flex gap-2">
                  {industries.map(industry => (
                    <Button
                      key={industry}
                      variant={activeIndustry === industry ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveIndustry(industry)}
                    >
                      {industry}
                    </Button>
                  ))}
                </div>
              </DragScrollArea>
            </div>
          </div>
        </section>

        {/* Case Studies Grid */}
        <section className="py-16 bg-background-alt">
          <div className="container-wide">
            <div className="grid lg:grid-cols-2 gap-8">
              {filteredStudies.map((study, index) => {
                const Icon = study.icon;
                return (
                  <motion.article
                    key={study.id}
                    ref={(el) => (cardRefs.current[study.id] = el)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-card rounded-2xl border overflow-hidden hover:shadow-xl transition-all ${
                      searchParams.get("study") === study.id 
                        ? "border-primary ring-2 ring-primary/20" 
                        : "border-border hover:border-primary/20"
                    }`}
                  >
                    <div className="p-8">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <Badge variant="secondary">{study.industry}</Badge>
                            <p className="text-sm text-muted-foreground mt-1">{study.company}</p>
                          </div>
                        </div>
                      </div>

                      {/* Title & Challenge */}
                      <h2 className="text-xl font-semibold text-foreground mb-4">{study.title}</h2>
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-foreground mb-2">The Challenge</h3>
                        <p className="text-sm text-muted-foreground">{study.challenge}</p>
                      </div>

                      {/* Results Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {study.results.map((result, i) => (
                          <div key={i} className="text-center p-3 bg-primary/5 rounded-lg">
                            <div className="text-lg font-bold text-primary">{result.metric}</div>
                            <div className="text-xs text-muted-foreground">{result.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Quote */}
                      <blockquote className="border-l-2 border-primary pl-4 mb-6">
                        <p className="text-sm italic text-foreground mb-2">"{study.quote}"</p>
                        <cite className="text-xs text-muted-foreground not-italic">— {study.quoteAuthor}</cite>
                      </blockquote>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedStudy(study)}
                        >
                          Read Full Story
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-primary hover:bg-primary-hover text-primary-foreground"
                          onClick={() => setIsCalendlyOpen(true)}
                        >
                          Get Similar Results
                        </Button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <PremiumCTASection
          title="Want to be our next success story?"
          description="Book a conversation to discuss how alfred ai can deliver similar results for your organisation."
          buttonText="Book an Impact Conversation"
          onButtonClick={() => setIsCalendlyOpen(true)}
          variant="light"
        />
      </main>

      <Footer />
      <BookingChatModal isOpen={isCalendlyOpen} onClose={() => setIsCalendlyOpen(false)} />

      {/* Full Case Study Modal */}
      {selectedStudy && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelectedStudy(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-card rounded-2xl border border-border shadow-2xl max-w-2xl w-full my-8 overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <selectedStudy.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <Badge className="bg-primary">{selectedStudy.industry}</Badge>
                  <p className="text-sm text-muted-foreground">{selectedStudy.company}</p>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-foreground mb-6">{selectedStudy.title}</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">The Challenge</h3>
                  <p className="text-muted-foreground">{selectedStudy.challenge}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">The Solution</h3>
                  <p className="text-muted-foreground">{selectedStudy.solution}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-4">The Results</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedStudy.results.map((result, i) => (
                      <div key={i} className="p-4 bg-primary/5 rounded-xl text-center">
                        <div className="text-2xl font-bold text-primary">{result.metric}</div>
                        <div className="text-sm text-muted-foreground">{result.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <blockquote className="border-l-4 border-primary pl-4 py-2 bg-muted/50 rounded-r-lg">
                  <p className="text-foreground italic mb-2">"{selectedStudy.quote}"</p>
                  <cite className="text-sm text-muted-foreground not-italic">— {selectedStudy.quoteAuthor}</cite>
                </blockquote>
              </div>

              <div className="flex gap-3 mt-8">
                <Button variant="outline" onClick={() => setSelectedStudy(null)}>
                  Close
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary-hover text-primary-foreground"
                  onClick={() => {
                    setSelectedStudy(null);
                    setIsCalendlyOpen(true);
                  }}
                >
                  Get Similar Results
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default CaseStudiesPage;
