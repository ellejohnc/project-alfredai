import { TRADES as DEMO_TRADES, FEATURED_TRADES, SUPPORTING_TRADES } from "@/components/demos/takeoff/takeoffData";
import { TRADE_ICONS } from "@/components/demos/takeoff/TradeSymbols";
import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  Send, SlidersHorizontal, Cpu, FileSearch, ShieldCheck, Download,
  ArrowRight, CalendarCheck, Mail, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BOOKING_PAGE_URL } from "@/lib/bookingConfig";
import SEO from "@/components/SEO";
import ErrorBoundary from "@/components/ErrorBoundary";
import { TakeoffRoiCalculator } from "@/components/roi/TakeoffRoiCalculator";
import { cn } from "@/lib/utils";

const PATH = "/ai-construction-takeoff";

/** Six steps, one line each — the order a real take-off runs in. */
const STEPS = [
  { icon: Send, title: "Send the set", text: "After your consultation, share the whole tender package. Every sheet is classified by type, scale and level." },
  { icon: SlidersHorizontal, title: "Choose the depth", text: "Quick, Standard or Thorough — so time and review effort match the job." },
  { icon: Cpu, title: "Measure and cross-check", text: "Quantities are traced off the drawing and checked across plans, elevations, schedules and spec." },
  { icon: FileSearch, title: "Evidence on every line", text: "Tap any figure to see the sheet, the marked area and the method used." },
  { icon: ShieldCheck, title: "You review the flags", text: "Missing information is flagged, never guessed. Accept, Overwrite, raise an RFI or Exclude." },
  { icon: Download, title: "Export to your rates", text: "A BOQ in your categories — out to Excel, CSV or a marked-up PDF, priced with your rate library." },
];

const RESULTS = [
  ["10 days → 10 hours", "per project take-off"],
  ["Every figure", "linked to its drawing"],
];

/** The three trades with a full live demo — larger cards, they lead the section. */
const FEATURED_CARDS = FEATURED_TRADES.map((id) => [DEMO_TRADES[id].label, DEMO_TRADES[id].result, DEMO_TRADES[id].summary, id] as const);
/** Trades without a demo yet — plain cards, "Book a demo" instead of "See the demo". */
const SUPPORTING_CARDS = SUPPORTING_TRADES.map((id) => [DEMO_TRADES[id].label, DEMO_TRADES[id].summary, id] as const);

/** A FAQ answer may point at a section of this page only — never another page. */
type Faq = { question: string; answer: string; link?: { to: `#${string}`; label: string } };

const faqs: Faq[] = [
  { question: "What is AI construction takeoff software?", answer: "Software that uses AI to analyse construction drawings and calculate material quantities. alfred ai Take-Off turns drawings into structured quantity schedules, bills of quantities (BOQs) and estimating outputs." },
  { question: "How does alfred ai Take-Off work?", answer: "It runs as a pipeline. Each sheet is first classified by type, scale and level. Vision models then detect the measurable elements for your trade and measure them against the drawing scale. Omega (AI Brain) checks the results across plans, sections, schedules and the specification. Each quantity gets a confidence score and a link back to its source sheet, and low-confidence or conflicting items are flagged. Your estimator approves them before export, and Axiom (Machine Learning Engine) reuses the approved corrections on later jobs." },
  { question: "Can AI automatically measure quantities from PDF construction drawings?", answer: "Yes. It measures supported elements straight from PDFs — dimensions, counts, areas and lengths. Drawing quality and trade complexity affect results, so an estimator still reviews them." },
  { question: "Which construction trades can alfred ai Take-Off support?", answer: "General building, structural steel, concrete, civil works, windows and doors, drywall and insulation, scaffolding, mechanical, electrical and plumbing. Every company works differently, and we respect that — so the Take-Off agent is customised to your current workflow, procedures and contract scope." },
  { question: "Can alfred ai generate a bill of quantities (BOQ)?", answer: "Yes. Measured quantities are organised into a structured BOQ with descriptions, units and trade groupings, and can be matched to your own BOQ templates." },
  { question: "Does alfred ai calculate construction costs and estimates?", answer: "Yes. It connects measured quantities to your rate cards and pricing rules to produce draft estimates, which an estimator reviews before use." },
  { question: "Can alfred ai detect changes between drawing revisions?", answer: "Yes. It flags drawing changes and their effect on quantities and scope. Your team verifies the commercial impact before relying on the revised figures." },
  { question: "Can alfred ai export quantities to Excel and other estimating software?", answer: "Yes. Exports include Excel, CSV and PDF, plus machine-readable data. Direct integration with third-party estimating systems depends on their import formats and configuration." },
  { question: "Can alfred ai work with our existing BOQ templates and rate cards?", answer: "Yes. The workflow is configured around your item descriptions, units, rate cards and reporting formats, so your team keeps its current estimating process." },
  { question: "Can alfred ai Take-Off help us tender for more construction projects?", answer: "Yes. In the ROI calculator's example, an estimator saves 96 hours a month; putting half into tenders means 2 extra tenders a month, or 24 a year, with the same team.", link: { to: "#roi-calculator", label: "Try the ROI calculator" } },
  { question: "Does alfred ai improve from previous takeoffs and estimator corrections?", answer: "Yes. Approved corrections and your measurement rules are used as context for future take-offs through Omega (AI Brain) and Axiom (Machine Learning Engine), so the same correction isn't repeated." },
  { question: "How accurate is AI construction takeoff compared with manual takeoff?", answer: "Accuracy depends on drawing quality, trade and complexity. Items that are ambiguous, missing information or contradicting another sheet get flagged rather than guessed, so your estimator reviews them before you rely on the figures." },
  { question: "Can alfred ai read specifications, schedules and drawing notes?", answer: "Yes. It reads across drawings, schedules, specifications and annotations, not just geometry. The depth of interpretation depends on document quality and configuration." },
  { question: "Does alfred ai Take-Off understand Standards and Codes?", answer: "No. It's built as a measurement tool, not a judgement tool, so it doesn't interpret building codes or design regulations. It measures what's on the drawing and flags gaps or conflicts within the drawing set itself — code compliance stays with your team." },
  { question: "Is alfred ai suitable for Australian builders and subcontractors?", answer: "Yes. It's built for construction businesses, including Australian general contractors, subcontractors and fabricators, and configured around local estimating conventions." },
  { question: "Will alfred ai replace our estimators or existing estimating software?", answer: "No. It automates repetitive measurement while estimators keep the review and commercial judgement. It works alongside your existing software through compatible exports." },
  { question: "How can I evaluate alfred ai Take-Off for my business?", answer: "Book a demo using a drawing set from one of your own projects. We assess the trade, quantities, output format and likely time savings before defining the implementation scope." },
  { question: "How long does it take to implement alfred ai Take-Off?", answer: "Typically 4–10 weeks, depending on trade, measurement complexity and integrations. It covers sample drawings, measurement rules, BOQ templates, accuracy testing and user training." },
  { question: "How much do AI API tokens and ongoing usage cost?", answer: "It depends on your drawing volume and complexity. We package it around your estimated usage — either monthly with 30 days' notice, or a 12–24 month contract. Contact our sales rep for a quote." },
  { question: "How secure are my construction drawings, project data and company information?", answer: "alfred ai is ISO 27001:2022 certified (independently audited by GCC) and SOC 2 Type II attested. Data is hosted in Australia by default, access is role- and project-based, every change is audit-logged, AI requests run with zero data retention, and your drawings never train models outside your business." },
  { question: "What productivity improvements can construction companies expect from alfred ai Take-Off?", answer: "Typical savings: general contractors 10 days → 10 hours per project (~95%); window fabricators 3 hours → 30 minutes (~83%); steelwork fabricators 3 days → 3 hours (~96%). A 500-sheet set takes 20–120 minutes depending on run depth, plus your estimator's review.", link: { to: "#roi-calculator", label: "Try the ROI calculator" } },
  { question: "How do I calculate the return on investment from alfred ai Take-Off?", answer: "Example: 20 take-offs a month at 8 manual hours each, with a 60% time reduction, saves 96 hours — A$7,680 of labour capacity at A$80/hr, or A$5,180 a month net of a A$2,500 fee. This is capacity value, not guaranteed cash savings.", link: { to: "#roi-calculator", label: "Try the ROI calculator" } },
];

const PRIMARY_FAQS = faqs.slice(0, 10);
const MORE_FAQS = faqs.slice(10);

/** SoftwareApplication — only verified properties: no price, rating or certifications. */
const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "alfred ai Take-Off",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Construction quantity takeoff and estimating",
  operatingSystem: "Web browser",
  url: `https://new.alfredai.bot/ai-construction-takeoff`,
  description: "AI-assisted construction takeoff that measures quantities from drawings, organises them into a bill of quantities and sends flagged items to an estimator for review before export.",
  featureList: [
    "AI-assisted quantity measurement from PDF drawings",
    "Bill of quantities (BOQ) generation",
    "Human review of flagged items",
    "Excel, CSV and PDF outputs",
    "Configurable BOQ templates and rate cards",
  ],
  provider: { "@type": "Organization", name: "alfred ai", url: "https://new.alfredai.bot" },
};

const FaqItem = ({ f }: { f: Faq }) => (
  <details className="group rounded-xl border border-border bg-card">
    <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
      <h3 className="text-base font-semibold leading-snug">{f.question}</h3>
      <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
    </summary>
    <div className="px-4 pb-4">
      <p className="text-[15px] leading-relaxed text-muted-foreground">{f.answer}</p>
      {f.link && (
        <a href={f.link.to} className="mt-2 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary">
          {f.link.label} <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </a>
      )}
    </div>
  </details>
);

const AiTakeoffLiveDemo = lazy(() =>
  import("@/components/demos/takeoff/AiTakeoffLiveDemo").then((m) => ({ default: m.AiTakeoffLiveDemo })),
);

export default function ConstructionEstimatingSoftware() {

  const reportHref = `mailto:hello@alfredai.bot?subject=${encodeURIComponent("AI Take-Off page issue")}&body=${encodeURIComponent(`Page: ${typeof window !== "undefined" ? window.location.href : PATH}\n\nPlease attach a screenshot.`)}`;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        fullTitle="AI Construction Takeoff Software | alfred ai"
        title="AI Construction Takeoff Software"
        description="AI-assisted construction takeoff: measure quantities from PDF drawings, build a BOQ in your format and review flagged items before export. Book a demo."
        path={PATH}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Solutions", url: "/solutions" },
          { name: "AI Take-Off", url: PATH },
        ]}
        faqs={faqs}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
      <Header />

      <main>
        {/* 1 · Hero — one message, one primary action */}
        <section className="pb-10 pt-24 md:pb-14 md:pt-32">
          <div className="container-wide max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">AI Take-Off · Flagship AI agent</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-6xl">From Drawings to Decisions</h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              AI construction takeoff that measures quantities from your drawings, shows the evidence, and leaves only the decisions to your estimator.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {RESULTS.map(([v, l]) => (
                <span key={v} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm">
                  <b className="font-mono font-semibold">{v}</b> <span className="text-muted-foreground">{l}</span>
                </span>
              ))}
            </div>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="min-h-[48px]">
                <a href={BOOKING_PAGE_URL}>
                  <CalendarCheck className="mr-2 h-4 w-4" /> Book a demo
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-h-[48px]">
                <a href="#live-demo">Try the live demo <ArrowRight className="ml-2 h-4 w-4" /></a>
              </Button>
            </div>
          </div>
        </section>

        {/* 2 · Live demo — proof straight after the promise */}
        <section id="live-demo" aria-label="AI Take-Off live demo" className="scroll-mt-24 pb-14">
          <div className="container-wide max-w-5xl">
            <ErrorBoundary
              fallback={
                <div className="rounded-xl border border-border p-6 text-center text-sm">
                  The live demo couldn't load. <a className="underline" href="/demos/ai-takeoff">Open it on its own page</a>, <a className="underline" href={BOOKING_PAGE_URL}>book a demo instead</a> or <a className="underline" href={reportHref}>report it</a>.
                </div>
              }
            >
              <Suspense fallback={<div className="h-[560px] animate-pulse rounded-2xl border border-border bg-muted/40" aria-label="Loading demo" />}>
                <AiTakeoffLiveDemo heading="Try it on a sample set" />
              </Suspense>
            </ErrorBoundary>
          </div>
        </section>

        {/* 3 · Trades — top three get the standout demo cards; the rest are plain */}
        <section aria-labelledby="trades-heading" className="border-y border-border bg-muted/30 py-12">
          <div className="container-wide">
            <h2 id="trades-heading" className="text-2xl font-bold">Built for your trade</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {FEATURED_CARDS.map(([t, r, d, key]) => {
                const Icon = TRADE_ICONS[key as keyof typeof TRADE_ICONS];
                return (
                <Link key={t} to={`/demos/ai-takeoff?trade=${key}`} className="group rounded-2xl border-2 border-foreground bg-card p-6 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />}
                    <h3 className="text-lg font-semibold">{t}</h3>
                  </div>
                  {r && <p className="mt-2 font-mono text-base font-bold">{r}</p>}
                  <p className="mt-2 text-sm text-muted-foreground">{d}</p>
                  <span className="mt-4 inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold">See the demo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
                </Link>
                );
              })}
            </div>
            <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Other trades — book a demo to see yours</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {SUPPORTING_CARDS.map(([t, d, key]) => {
                const Icon = TRADE_ICONS[key as keyof typeof TRADE_ICONS];
                return (
                <a key={t} href={BOOKING_PAGE_URL} className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="flex items-center gap-1.5">
                    {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />}
                    <h4 className="text-sm font-semibold leading-snug">{t}</h4>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{d}</p>
                  <span className="mt-3 inline-flex min-h-[44px] items-center gap-1 text-xs font-medium">Book a demo <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
                </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4 · How it works */}
        <section aria-labelledby="how-heading" className="py-14">
          <div className="container-wide max-w-5xl">
            <h2 id="how-heading" className="text-2xl font-bold">How an AI take-off runs</h2>
            <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <li key={s.title} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                    </div>
                    <h3 className="mt-2 font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* 5 · ROI calculator */}
        <section id="roi-calculator" aria-labelledby="roi-heading" className="scroll-mt-24 border-t border-border py-14">
          <div className="container-wide max-w-6xl">
            <h2 id="roi-heading" className="text-2xl font-bold md:text-3xl">Estimate Faster. Tender More. Grow Smarter.</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">Change any figure and see what freed-up estimating time could mean for your business.</p>
            <div className="mt-8">
              <ErrorBoundary fallback={<div className="rounded-xl border border-border p-6 text-center text-sm">The calculator couldn't load. <a className="underline" href={BOOKING_PAGE_URL}>Book a demo</a> and we'll run the numbers with you, or <a className="underline" href={reportHref}>report it</a>.</div>}>
                <TakeoffRoiCalculator />
              </ErrorBoundary>
            </div>
          </div>
        </section>

        {/* 6 · FAQ */}
        <section aria-labelledby="faq-heading" className="border-t border-border py-14">
          <div className="container-wide max-w-3xl">
            <h2 id="faq-heading" className="text-2xl font-bold md:text-3xl">Frequently Asked Questions About AI Construction Takeoff</h2>
            <div className="mt-6 space-y-3">{PRIMARY_FAQS.map((f) => <FaqItem key={f.question} f={f} />)}</div>
            <h2 className="mt-10 text-lg font-semibold">More questions</h2>
            <div className="mt-3 space-y-3">{MORE_FAQS.map((f) => <FaqItem key={f.question} f={f} />)}</div>
          </div>
        </section>

        {/* 6 · One closing action */}
        <section className="pb-20">
          <div className="container-wide max-w-3xl rounded-2xl border border-border bg-card p-6 text-center md:p-8">
            <h2 className="text-2xl font-bold">Put your drawings to work</h2>
            <p className="mt-2 text-muted-foreground">For Demo, Pricing and Customisation</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="min-h-[48px]"><a href={BOOKING_PAGE_URL}>Book a demo</a></Button>
              <Button asChild size="lg" variant="outline" className="min-h-[48px]"><Link to="/products/use-cases">See all workflows</Link></Button>
            </div>
            <a href={reportHref} className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3.5 w-3.5" /> Something not working? Report an issue</a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
