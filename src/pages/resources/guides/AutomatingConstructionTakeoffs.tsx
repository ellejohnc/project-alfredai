import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Cpu, Calculator, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const PUBLISHED = "2026-06-11";

const sections = [
  {
    icon: FileText,
    title: "1. Why manual take-offs hold builders back",
    body: [
      "Traditional construction take-offs mean an estimator opening a PDF or paper drawing set and measuring every quantity by hand — counting fixtures, scaling lengths, and transcribing areas into a spreadsheet. A single mid-sized tender can take days, and one mis-scaled drawing can quietly compound into a costly under-quote.",
      "Because the work is slow, teams quote fewer jobs, win-rates suffer, and senior estimators spend their time on data entry instead of strategy. The bottleneck is rarely a lack of skill — it is the manual extraction of quantities from documents.",
    ],
  },
  {
    icon: Cpu,
    title: "2. How AI extracts quantities automatically",
    body: [
      "AI construction estimates start by reading the drawing the way an estimator does — but in seconds. Computer-vision and document-understanding models detect walls, openings, fixtures, and dimension annotations directly from PDF or CAD exports, then map them to measurable quantities.",
      "Instead of clicking every line, the estimator reviews AI-extracted quantities, corrects edge cases, and signs off. The result is the same trusted output — material counts, areas, and lengths by trade — produced up to 90% faster than a manual take-off.",
    ],
  },
  {
    icon: Calculator,
    title: "3. From extracted quantities to a draft estimate",
    body: [
      "Quantities alone are not a quote. alfred ai's agents take the extracted measurements and apply your rate library, wastage factors, and trade breakdowns to assemble a draft estimate automatically — already structured the way your team prices work.",
      "Because the workflow is agentic, it does not stop at one step: it reads the drawings, organises quantities by trade, drafts the estimate, and flags anything ambiguous for human review. Your estimator becomes the approver, not the data-entry clerk.",
    ],
  },
  {
    icon: Clock,
    title: "4. Putting it into practice",
    body: [
      "Start with one trade or one project type so your team can compare AI output against a known manual take-off. Once accuracy is trusted, expand across trades and let the agents handle the full intake-to-draft flow.",
      "Keep a human in the loop on rates and final sign-off, feed corrections back so the system improves, and measure the time saved per tender. Most teams reclaim hours per estimate and quote noticeably more work without adding headcount.",
    ],
  },
];

const faqs = [
  {
    question: "What are AI construction take-offs?",
    answer:
      "AI construction take-offs use computer-vision and document-understanding models to read drawings and automatically extract quantities — counts, lengths, and areas by trade — replacing manual measurement and transcription.",
  },
  {
    question: "How much faster are AI construction estimates?",
    answer:
      "Teams using alfred ai typically produce draft estimates up to 90% faster than manual take-offs, because quantities are extracted automatically and assembled into a structured draft for human review.",
  },
  {
    question: "Do estimators still review the output?",
    answer:
      "Yes. AI handles the slow extraction and drafting, while your estimator reviews edge cases, applies final rates, and signs off — keeping a human in the loop for accuracy and accountability.",
  },
];

const AutomatingConstructionTakeoffs = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="How to Automate Construction Take-offs & Estimating with AI"
        description="A practical guide to automating construction take-offs with AI — from manual PDF measurement to AI-extracted quantities and draft estimates up to 90% faster."
        path="/resources/guides/automating-construction-takeoffs"
        type="article"
        article={{
          publishedTime: PUBLISHED,
          modifiedTime: PUBLISHED,
          section: "Guides",
          tags: ["ai construction estimates", "construction take-offs", "AI estimating", "construction automation"],
        }}
        faqs={faqs}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Resources", url: "/resources" },
          { name: "Guides", url: "/resources/guides" },
          { name: "Automating Construction Take-offs", url: "/resources/guides/automating-construction-takeoffs" },
        ]}
      />
      <Header />

      <main>
        {/* Hero */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent pointer-events-none" />
          <div className="container-wide relative">
            <Link
              to="/resources/guides"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors group min-h-11"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Guides
            </Link>
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-primary mb-3">Guide · Estimating</p>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
                How to Automate Construction Take-offs &amp; Estimating with AI
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground">
                Move from manual PDF take-offs to AI-extracted quantities — and produce draft estimates up to 90% faster.
              </p>
            </div>
          </div>
        </section>

        {/* Body */}
        <section className="pb-16 bg-background">
          <div className="container-wide">
            <div className="max-w-3xl space-y-12">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <article key={s.title}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground">{s.title}</h2>
                    </div>
                    <div className="space-y-4">
                      {s.body.map((p, i) => (
                        <p key={i} className="text-base md:text-lg text-muted-foreground leading-relaxed">
                          {p}
                        </p>
                      ))}
                    </div>
                  </article>
                );
              })}

              {/* Key takeaways */}
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">Key takeaways</h2>
                <ul className="space-y-3">
                  {[
                    "Manual take-offs are the real estimating bottleneck — not estimator skill.",
                    "AI extracts quantities directly from drawings in seconds.",
                    "Agents assemble a draft estimate using your rates and trade breakdowns.",
                    "Estimators review and approve — up to 90% faster end to end.",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* FAQ */}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Frequently asked questions</h2>
                <div className="space-y-6">
                  {faqs.map((f) => (
                    <div key={f.question}>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{f.question}</h3>
                      <p className="text-muted-foreground leading-relaxed">{f.answer}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/5 border border-border p-6 md:p-8 text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  See AI take-offs on your own drawings
                </h2>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  Try the live demo that turns construction drawings into a draft estimate, or book a walkthrough with our team.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild size="lg" className="min-h-11">
                    <Link to="/demos/drawings-to-estimate">
                      Try the Drawings-to-Estimate Demo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="min-h-11">
                    <Link to="https://new.alfredai.bot/book">Book a Call</Link>
                  </Button>
                </div>
                <a
                  href="mailto:sales@alfredai.bot?subject=Question about AI construction take-offs"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mt-6 transition-colors min-h-11"
                >
                  <Mail className="w-4 h-4" />
                  Prefer email? Reach our team
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AutomatingConstructionTakeoffs;
