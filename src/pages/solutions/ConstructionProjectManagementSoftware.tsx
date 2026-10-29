import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  ClipboardList,
  FileText,
  Users,
  Layers,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BookingChatModal from "@/components/BookingChatModal";
import PremiumCTASection from "@/components/sections/PremiumCTASection";
import SEO from "@/components/SEO";

const pillars = [
  {
    icon: ClipboardList,
    title: "Project visibility",
    desc: "Live status across every active job — RFIs, variations, approvals, milestones — without chasing your PMs for updates.",
    link: { to: "/impact-studies/execution", label: "How execution improves" },
  },
  {
    icon: FileText,
    title: "Document & drawing intelligence",
    desc: "AI reads drawings, contracts, RFIs and purchase bills. Extract scope, costs and risks in minutes, not hours.",
    link: { to: "/demos/drawings-to-estimate", label: "See drawings → estimate" },
  },
  {
    icon: Users,
    title: "Subcontractor & vendor management",
    desc: "Onboarding, insurance, licences and compliance verified automatically. Your supplier base stays audit-ready.",
    link: { to: "/demos/vendor-compliance", label: "See vendor compliance" },
  },
  {
    icon: Layers,
    title: "Estimating & bidding",
    desc: "Turn drawings into priced, trade-grouped estimates. Respond to more tenders without growing your estimating team.",
    link: { to: "/solutions/ai-takeoff", label: "Estimating software" },
  },
  {
    icon: ShieldCheck,
    title: "Compliance & audit trail",
    desc: "Every approval, change and document captured automatically. AU standards and 10% GST handled correctly.",
    link: { to: "/impact-studies/reduce-admin", label: "Admin reduction outcomes" },
  },
  {
    icon: TrendingUp,
    title: "Cost & margin control",
    desc: "Purchase bills, variations and forecasts in one place. See margin movement on every job before it hits your P&L.",
    link: { to: "/demos/purchase-bill-intake", label: "See purchase-bill intake" },
  },
];

const buyersBy = [
  {
    title: "For residential builders",
    desc: "Manage 5–50 active builds with structured workflows for client comms, variations and progress claims.",
    href: "/compare/vs-construction-builders",
    cta: "See builder comparison",
  },
  {
    title: "For commercial & enterprise",
    desc: "Tender management, subcontractor compliance, multi-project visibility and AU/NZ regulatory coverage.",
    href: "/compare/vs-construction-enterprise",
    cta: "See enterprise comparison",
  },
  {
    title: "Already using Procore or Monday?",
    desc: "alfred ai sits alongside existing tools — no rip-and-replace. We automate the work that still happens in email and Excel.",
    href: "/compare/vs-procore",
    cta: "alfred ai vs Procore",
  },
];

const faqs = [
  {
    question: "What is construction project management software?",
    answer:
      "Construction project management software is a system of record for live construction projects — covering scheduling, document control, RFIs, variations, subcontractor management, cost control and compliance. AI-powered platforms like alfred ai go further, automating the document-heavy admin that traditional tools still leave to your PMs.",
  },
  {
    question: "What's the best construction project management software for Australian builders?",
    answer:
      "The right fit depends on your size and project mix. Procore and Monday dominate enterprise; Buildxact and Methvin lead on estimating. alfred ai is the AI layer that automates the admin across whichever tools you already use — purpose-built for AU builders with AUD + 10% GST handled natively.",
  },
  {
    question: "How is AI construction project management different from traditional tools?",
    answer:
      "Traditional tools are databases — you still do the work of reading drawings, chasing subcontractors, processing bills and reconciling variations. Agentic AI executes those workflows for you: reading documents, drafting responses, flagging exceptions and updating your systems automatically.",
  },
  {
    question: "Do I need to replace Procore, Buildxact or Monday to use alfred ai?",
    answer:
      "No. alfred ai integrates with your existing tools rather than replacing them. Most AU builders use alfred ai alongside their current PM, estimating or accounting stack — automating the manual work that happens between systems.",
  },
  {
    question: "How long does it take to implement?",
    answer:
      "Most builders are live on their first two workflows within 2–3 weeks. Full estimating and project visibility usually rolls out across 60–90 days. ROI typically lands inside 90 days.",
  },
  {
    question: "How much does construction project management software cost in Australia?",
    answer:
      "Traditional platforms range from $50–$400/user/month. alfred ai uses a setup + monthly retainer in AUD (incl. 10% GST), priced on workflow volume rather than per-user — so your whole team can use it without per-seat fees. See the pricing page for ranges, or book an impact conversation for a tailored quote.",
  },
];

const ConstructionProjectManagementSoftware = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Construction Project Management Software for AU Builders"
        description="Agentic AI construction project management software for Australian builders. Automate document, subcontractor, estimating and compliance workflows — without replacing your stack."
        path="/solutions/construction-project-management-software"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Solutions", url: "/solutions" },
          { name: "Construction Project Management Software", url: "/solutions/construction-project-management-software" },
        ]}
        faqs={faqs.map((f) => ({ question: f.question, answer: f.answer }))}
      />
      <Header />

      <main>
        {/* Hero */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent pointer-events-none" />
          <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="container-wide relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <Badge className="bg-primary mb-4">The complete guide</Badge>
              <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-4 leading-tight">
                Construction project management software, reimagined with agentic AI
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                The complete guide for Australian builders evaluating modern construction project management software — what it does, how AI changes the game, and how to pick the right stack for your business.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={() => setIsBookingOpen(true)} className="text-base h-12 px-6">
                  Book an impact conversation
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base h-12 px-6">
                  <Link to="/resources/demos">Browse live demos</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ROI band */}
        <section className="py-12 bg-primary">
          <div className="container-wide">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary-foreground mb-2">70%</div>
                <div className="text-primary-foreground/80">Less project admin</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary-foreground mb-2">15+ hrs</div>
                <div className="text-primary-foreground/80">Saved per PM/week</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary-foreground mb-2">2–3x</div>
                <div className="text-primary-foreground/80">More jobs per PM</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary-foreground mb-2">90 days</div>
                <div className="text-primary-foreground/80">Typical payback</div>
              </div>
            </div>
          </div>
        </section>

        {/* On this page nav */}
        <section className="py-10 bg-background-alt border-b border-border">
          <div className="container-wide max-w-4xl">
            <div className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">On this page</div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "what-it-is", label: "What it is" },
                { id: "pillars", label: "Six pillars" },
                { id: "ai-difference", label: "AI vs traditional" },
                { id: "who-its-for", label: "Who it's for" },
                { id: "evaluate", label: "How to evaluate" },
                { id: "faq", label: "FAQ" },
              ].map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="px-3 py-1.5 rounded-full bg-card border border-border text-sm text-foreground hover:bg-primary/10 hover:border-primary/30 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* What it is */}
        <section id="what-it-is" className="py-16 bg-background scroll-mt-24">
          <div className="container-wide max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">What is construction project management software?</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Construction project management (CPM) software is the system of record for live building projects. It covers programme and milestones, document and drawing control, RFIs and variations, subcontractor and supplier management, cost control, and compliance — across every active job, from one place.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Traditional tools (Procore, Monday, Buildxact, spreadsheets) store the data. They don't <em>do</em> the work. Your PMs still read every drawing, chase every subcontractor, code every bill and update every status.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Agentic AI changes that. alfred ai executes the document-heavy workflows your PMs spend their days on — alongside the tools you already use. See <Link to="/products" className="text-primary underline">the product</Link> and <Link to="/explained" className="text-primary underline">how it works</Link>.
            </p>
          </div>
        </section>

        {/* Six pillars */}
        <section id="pillars" className="py-16 bg-background-alt scroll-mt-24">
          <div className="container-wide">
            <div className="max-w-3xl mx-auto text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">The six pillars of modern construction project management</h2>
              <p className="text-muted-foreground">What "great" looks like across every active job in your business.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pillars.map((p, index) => {
                const Icon = p.icon;
                return (
                  <motion.div
                    key={p.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.06 }}
                    className="bg-card rounded-2xl border border-border p-6 flex flex-col"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{p.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">{p.desc}</p>
                    <Link to={p.link.to} className="text-sm text-primary font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">
                      {p.link.label} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* AI vs Traditional */}
        <section id="ai-difference" className="py-16 bg-background scroll-mt-24">
          <div className="container-wide max-w-5xl">
            <div className="max-w-3xl mx-auto text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">Traditional CPM tools vs agentic AI</h2>
              <p className="text-muted-foreground">Same data, fundamentally different operating model.</p>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-background-alt">
                  <tr>
                    <th className="text-left p-4 font-semibold text-foreground">Workflow</th>
                    <th className="text-left p-4 font-semibold text-foreground">Procore / Monday / Buildxact</th>
                    <th className="text-left p-4 font-semibold text-primary">alfred ai</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Read drawings & extract scope", "PM does it manually", "AI extracts, PM reviews"],
                    ["Estimating & re-pricing", "Templates + manual edits", "Auto take-off + auto-price"],
                    ["Subcontractor compliance", "Forms & reminders", "Auto-verified, audit-ready"],
                    ["Purchase bill processing", "Manual data entry", "AI extracted & coded"],
                    ["RFIs & variations", "Email chains", "Drafted, tracked, routed"],
                    ["Status reporting", "PM writes weekly", "Live, auto-generated"],
                    ["Per-user licensing", "Yes", "No — workflow pricing"],
                  ].map((row) => (
                    <tr key={row[0]} className="border-t border-border">
                      <td className="p-4 text-foreground font-medium">{row[0]}</td>
                      <td className="p-4 text-muted-foreground">{row[1]}</td>
                      <td className="p-4 text-foreground">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 text-center">
              <Link to="/compare" className="text-sm text-primary font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">
                Full comparison hub <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section id="who-its-for" className="py-16 bg-background-alt scroll-mt-24">
          <div className="container-wide">
            <div className="max-w-3xl mx-auto text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">Who is it for?</h2>
              <p className="text-muted-foreground">Pick the path that matches your business.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {buyersBy.map((b) => (
                <div key={b.title} className="bg-card rounded-2xl border border-border p-6 flex flex-col">
                  <h3 className="font-semibold text-foreground mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground mb-5 flex-1">{b.desc}</p>
                  <Button asChild variant="outline" className="w-full">
                    <Link to={b.href}>{b.cta}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How to evaluate */}
        <section id="evaluate" className="py-16 bg-background scroll-mt-24">
          <div className="container-wide max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-6">How to evaluate construction project management software</h2>
            <div className="space-y-4">
              {[
                {
                  title: "1. Start with the workflows that hurt most",
                  body: "Don't buy a platform — buy outcomes. List the three admin workflows costing your team the most hours this month. That's your shortlist criteria.",
                },
                {
                  title: "2. Demand AI that actually does the work",
                  body: "Many vendors brand any feature as AI. Ask for a live demo on your own document, drawing or job. If a human still has to do the work, it's not agentic AI.",
                },
                {
                  title: "3. Check AU fit: AUD, 10% GST, local trade categories",
                  body: "US-built tools often miss local tax, trade structures and contract standards. Make sure pricing, reporting and compliance are tuned to how AU builders operate.",
                },
                {
                  title: "4. Test integration, not replacement",
                  body: "The best CPM stack works with your existing tools. Ask how the platform connects to Procore, Xero, MYOB, Buildxact, Methvin and your accounting system.",
                },
                {
                  title: "5. Pricing model: per-user vs per-workflow",
                  body: "Per-user pricing punishes you for rolling out across the team. Workflow-based pricing means everyone can use it without growing your licence bill.",
                },
                {
                  title: "6. ROI in 90 days, or walk away",
                  body: "Modern AI platforms should pay back inside 90 days. Use our ROI calculator and a real impact conversation to model the numbers for your business.",
                },
              ].map((item) => (
                <div key={item.title} className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-foreground mb-1">{item.title}</div>
                      <p className="text-sm text-muted-foreground">{item.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 rounded-2xl bg-primary/10 border border-primary/20 text-center">
              <div className="font-semibold text-foreground mb-2">Want to model your numbers?</div>
              <p className="text-sm text-muted-foreground mb-4">Use the ROI calculator or jump into a guided impact conversation.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="outline">
                  <Link to="/impact-studies/roi-breakdowns">See ROI breakdowns</Link>
                </Button>
                <Button asChild>
                  <Link to="/pricing">View pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Related demos */}
        <section className="py-16 bg-background-alt">
          <div className="container-wide max-w-5xl">
            <div className="max-w-3xl mx-auto text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3 flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" /> See it in action
              </h2>
              <p className="text-muted-foreground">Interactive demos — no booking required.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { href: "/demos/drawings-to-estimate", title: "Drawings → Estimate", icon: Building2 },
                { href: "/demos/purchase-bill-intake", title: "Purchase Bill Intake", icon: FileText },
                { href: "/demos/vendor-compliance", title: "Vendor Compliance", icon: ShieldCheck },
                { href: "/demos/technical-report-agent", title: "Technical Report Agent", icon: ClipboardList },
              ].map((d) => {
                const Icon = d.icon;
                return (
                  <Link
                    key={d.href}
                    to={d.href}
                    className="group bg-card rounded-xl border border-border p-5 hover:border-primary/40 hover:shadow-md transition-all"
                  >
                    <Icon className="w-6 h-6 text-primary mb-3" />
                    <div className="font-medium text-foreground mb-2 group-hover:text-primary transition-colors">{d.title}</div>
                    <div className="text-xs text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Try it <ArrowRight className="w-3 h-3" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 bg-background scroll-mt-24">
          <div className="container-wide max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-8 text-center">
              Construction project management software — FAQ
            </h2>
            <div className="space-y-4">
              {faqs.map((f) => (
                <details
                  key={f.question}
                  className="group bg-card rounded-xl border border-border p-5 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex items-center justify-between cursor-pointer font-medium text-foreground gap-3">
                    <span>{f.question}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-90 shrink-0" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.answer}</p>
                </details>
              ))}
            </div>

            <div className="mt-8 p-5 rounded-xl bg-card border border-border flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground">
                Still have a question? <Link to="/contact" className="text-primary underline">Email us</Link> with your scenario and we'll come back within one business day. Browse the <Link to="/faq" className="text-primary underline">full FAQ</Link> or <Link to="/documentation" className="text-primary underline">documentation</Link> for more.
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <PremiumCTASection
          title="Ready to see what AI-led project management looks like for your business?"
          description="Book an impact conversation. We'll model the time, cost and capacity impact on your live projects — no pitch deck."
          buttonText="Book an impact conversation"
          onButtonClick={() => setIsBookingOpen(true)}
          variant="light"
        />
      </main>

      <Footer />
      <BookingChatModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
    </div>
  );
};

export default ConstructionProjectManagementSoftware;
