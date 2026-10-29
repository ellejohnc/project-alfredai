import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Workflow,
  Bot,
  LineChart,
  Rocket,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const PUBLISHED = "2026-08-02";

const sections = [
  {
    icon: Workflow,
    title: "1. The real bottleneck in construction project management",
    body: [
      "Most builders and contractors do not lack project management software — they lack the hours to feed it. Site diaries, RFIs, variations, subcontractor follow-ups, compliance packs and progress claims all still depend on a person reading a document, deciding what it means, and typing the outcome into a system.",
      "That admin layer is where your margin quietly leaks. Programme slippage is usually detected late because the information that would have flagged it was sitting unread in an inbox. AI for construction project management targets that gap directly: instead of another dashboard to update, you get agents that do the reading, chasing and drafting for you.",
    ],
  },
  {
    icon: Bot,
    title: "2. What construction AI agents actually do",
    body: [
      "A construction AI agent is not a chatbot bolted onto your PM tool. It is a trained worker that holds context on your projects and completes multi-step tasks end to end: extract the scope from a drawing set, compare a subcontractor quote against the tender, draft the variation, chase the missing insurance certificate, and summarise the week's site reports for your project control group.",
      "Because agents work inside your existing workflow, your programme, cost codes and approval gates stay exactly where they are. The agent prepares the work and hands you a decision — you approve, reject or amend. Every action stays attributable to a person, which is what auditors, principals and insurers care about.",
      "In practice, that means alfred ai trains and delivers the model for your specific project workflows. This is a done-for-you service, not a self-build toolkit you have to configure yourself.",
    ],
  },
  {
    icon: LineChart,
    title: "3. Where the ROI comes from",
    body: [
      "The return is easier to model than most software business cases because the inputs are hours you already pay for. Take the admin load of one project manager or contract administrator — commonly 10 to 15 hours a week on document handling, chasing and reporting — and remove the majority of it. On an AUD $140,000 salary package, reclaiming 10 hours a week is worth roughly $35,000 a year per role, before GST.",
      "The larger prize is capacity, not cost. Teams that shorten tender turnaround price more work with the same headcount, and teams that catch a variation or a compliance gap in the same week it happens avoid the disputes that cost tens of thousands to settle later.",
      "Model it on three lines: admin hours recovered, additional tenders submitted, and disputes or rework avoided. If the first line alone covers the engagement, the rest is upside — and that is the test we apply before recommending an implementation.",
    ],
  },
  {
    icon: Rocket,
    title: "4. Implementing in weeks, not quarters",
    body: [
      "Generic project management platforms fail on the rollout, not the feature list. A migration that touches every process at once stalls, because your team cannot run live projects and a re-platforming exercise in the same month. Agentic AI avoids that by attaching to what you already run.",
      "The sequence that works: pick one high-volume workflow (subcontractor compliance, RFI triage or progress claims), train the agent on your real documents, run it in parallel with your current process for two weeks, then compare output. Once the team trusts it, expand one workflow at a time.",
      "Keep a human approver on anything that leaves your business, feed corrections back so accuracy improves, and measure hours recovered per workflow. Most implementations are live on their first workflow inside a few weeks, and each subsequent one is faster because the project context already exists.",
    ],
  },
];

const faqs = [
  {
    question: "What is AI for construction project management?",
    answer:
      "AI for construction project management uses trained AI agents to complete the document-heavy work around your programme — reading drawings and site reports, triaging RFIs, drafting variations, chasing subcontractor compliance and preparing progress claims — while your project managers stay the decision makers and approvers.",
  },
  {
    question: "How are construction AI agents different from project management software?",
    answer:
      "Project management software gives you a place to record work; construction AI agents do the work. Agents sit on top of the tools you already use, complete multi-step tasks with your project context, and hand a finished draft to a human for approval, so there is no re-platforming exercise.",
  },
  {
    question: "What ROI should we expect, and how fast?",
    answer:
      "Most teams model the return on admin hours recovered — commonly 10 to 15 hours a week per project manager or contract administrator — plus the extra tenders they can price with the same headcount. First workflows are typically live within a few weeks, so the payback window is measured in months, not financial years.",
  },
  {
    question: "Do we have to replace our existing systems?",
    answer:
      "No. alfred ai trains and delivers agents that work with your current programme, cost codes and approval gates. We start with one high-volume workflow, run it alongside your existing process, and only expand once your team is confident in the output.",
  },
];

const AiForConstructionProjectManagement = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="AI for Construction Project Management: A Practical Guide"
        description="How construction AI agents plug into existing project management workflows — the ROI model, the implementation sequence, and how to go live in weeks, not quarters."
        path="/resources/guides/ai-for-construction-project-management"
        type="article"
        article={{
          publishedTime: PUBLISHED,
          modifiedTime: PUBLISHED,
          section: "Guides",
          tags: [
            "ai for construction project management",
            "construction ai agents",
            "construction project management",
            "agentic ai",
          ],
        }}
        faqs={faqs}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Resources", url: "/resources" },
          { name: "Guides", url: "/resources/guides" },
          {
            name: "AI for Construction Project Management",
            url: "/resources/guides/ai-for-construction-project-management",
          },
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
              <p className="text-sm font-semibold text-primary mb-3">Guide · Project Management</p>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
                AI for Construction Project Management
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground">
                How construction AI agents slot into the workflows you already run — with an ROI you
                can model and a first workflow live in weeks.
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
                    "Your bottleneck is the admin layer around the programme, not the programme itself.",
                    "Construction AI agents complete multi-step work and hand you a decision to approve.",
                    "Model ROI on admin hours recovered, extra tenders priced, and disputes avoided.",
                    "Start with one high-volume workflow and run it in parallel for two weeks.",
                    "No re-platforming — agents attach to the systems and approvals you already use.",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Related reading */}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Related reading
                </h2>
                <ul className="space-y-3">
                  <li>
                    <Link
                      to="/resources/guides/automating-construction-takeoffs"
                      className="inline-flex min-h-11 items-center text-primary hover:underline"
                    >
                      How to automate construction take-offs &amp; estimating with AI
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/solutions/ai-for-construction"
                      className="inline-flex min-h-11 items-center text-primary hover:underline"
                    >
                      AI for construction — solutions overview
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/pricing"
                      className="inline-flex min-h-11 items-center text-primary hover:underline"
                    >
                      Pricing &amp; ROI calculator
                    </Link>
                  </li>
                </ul>
              </div>

              {/* FAQ */}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                  Frequently asked questions
                </h2>
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
                  Map the ROI on your own workflows
                </h2>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  Run the numbers on the admin hours you could recover, or book a call and we'll
                  scope your first agent workflow.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild size="lg" className="min-h-11">
                    <Link to="/pricing">
                      Estimate your ROI
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="min-h-11">
                    <Link to="https://new.alfredai.bot/book">Book a Call</Link>
                  </Button>
                </div>
                <a
                  href="mailto:sales@alfredai.bot?subject=Question about AI for construction project management"
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

export default AiForConstructionProjectManagement;
