import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import AnswerArticleLayout from "@/components/seo/AnswerArticleLayout";

const faqs = [
  {
    question: "What is AI for construction?",
    answer:
      "AI for construction is software that uses artificial intelligence to automate the admin-heavy work in building and contracting — reading drawings, extracting quantities, processing invoices and contracts, drafting estimates, and handling client communications. Agentic AI platforms like alfred ai go beyond simple automation by reasoning across documents and workflows, so a team can cut 15+ hours of admin per week with typical ROI inside 90 days.",
  },
  {
    question: "What is the best AI for construction companies?",
    answer:
      "The best AI for a construction company depends on the work you want to remove. For take-offs and estimating, look for AI that reads drawings and prices from your own rate library. For admin, look for document processing, invoice intake and contract review. alfred ai is purpose-built for construction and professional services, combining all of these in one platform tuned to AUD and 10% GST for Australian builders.",
  },
  {
    question: "How does AI help in construction?",
    answer:
      "AI helps construction teams by removing repetitive admin: it extracts quantities from drawings, drafts estimates, reads and routes invoices, flags risk in contracts, answers client questions, and keeps an audit trail. The result is faster quoting, fewer errors, and the ability to take on more projects without adding headcount.",
  },
  {
    question: "Is AI for construction worth it?",
    answer:
      "For most builders and contractors, yes. If your team spends more than five hours a week on take-offs, invoicing or chasing documents, AI typically pays for itself within 90 days. The biggest gains come from estimating speed (often 80–90% faster) and reclaiming admin time so skilled staff can focus on winning and delivering work.",
  },
  {
    question: "Does alfred ai work with existing construction software?",
    answer:
      "Yes. alfred ai is designed to work alongside the tools you already use — Procore, Buildxact, Methvin, accounting systems and more — with no rip-and-replace. It connects via APIs and slots into your existing workflows so you keep your current stack and add AI on top.",
  },
  {
    question: "How do I get started with AI for construction?",
    answer:
      "Start with one high-pain workflow — usually estimating or invoice processing. Book an impact conversation with alfred ai and we'll map the time and cost impact for your business, then set up a single workflow so you can measure results before expanding.",
  },
];

const related = [
  { label: "What is the best AI for construction?", to: "/solutions/ai-for-construction/best-ai-for-construction" },
  { label: "How to use AI for construction estimating", to: "/solutions/ai-for-construction/estimating" },
  { label: "Construction AI software for operations", to: "/solutions/ai-for-construction/operations" },
  { label: "Construction estimating software", to: "/solutions/ai-takeoff" },
];

const useCases = [
  ["Estimating & take-offs", "Read drawings, extract quantities by trade, and draft a priced estimate in minutes."],
  ["Invoice & bill processing", "Pull line items from supplier invoices, match to POs, and route for approval automatically."],
  ["Contract review", "Clause-by-clause risk scoring against AS4000 and other standards, with amendment suggestions."],
  ["Bid intelligence", "Discover relevant tenders, score bid/no-bid decisions, and draft responses."],
  ["Client communications", "AI voice and chat agents that handle enquiries, follow-ups and scheduling."],
  ["Compliance & documents", "Auto-route, extract and track project documents so nothing slips."],
];

const AiForConstruction = () => {
  return (
    <AnswerArticleLayout
      metaTitle="AI for Construction: Agentic AI for Builders"
      metaDescription="Agentic AI for builders and contractors: automate estimating, invoicing, contracts and admin, and save 15+ hours a week. See how it works."
      path="/solutions/ai-for-construction"
      badge="Agentic AI for construction"
      h1="AI for construction, built for builders and contractors"
      answer="AI for construction automates the admin-heavy work in building and contracting — take-offs, estimating, invoice processing, contract review and client communications. alfred ai is an agentic AI platform purpose-built for construction and professional services that saves teams 15+ hours per week with typical ROI inside 90 days, and works alongside the tools you already use."
      breadcrumbs={[
        { name: "Home", url: "/" },
        { name: "Solutions", url: "/solutions" },
        { name: "AI for Construction", url: "/solutions/ai-for-construction" },
      ]}
      faqs={faqs}
      related={related}
    >
      <div>
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
          Where AI removes the most work in construction
        </h2>
        <p className="text-muted-foreground mb-6">
          The biggest wins come from the repetitive, document-heavy tasks that eat into your team's
          week. alfred ai applies agentic AI across these workflows so your people focus on winning
          and delivering work — not chasing paperwork.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {useCases.map(([title, desc]) => (
            <div key={title} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-foreground">{title}</div>
                <p className="text-sm text-muted-foreground mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center rounded-2xl border border-border bg-card p-6">
        <div>
          <div className="text-3xl font-bold text-primary mb-1">70%</div>
          <div className="text-sm text-muted-foreground">Less admin work</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-primary mb-1">15+ hrs</div>
          <div className="text-sm text-muted-foreground">Saved per week</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-primary mb-1">90%</div>
          <div className="text-sm text-muted-foreground">Faster take-offs</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-primary mb-1">90 days</div>
          <div className="text-sm text-muted-foreground">Typical payback</div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
          Why agentic AI beats generic automation
        </h2>
        <p className="text-muted-foreground mb-4">
          Generic tools like Zapier or Make connect apps with simple triggers. Construction work is
          messy — drawings, scope changes, supplier invoices and contracts don't fit neat
          templates. Agentic AI reasons across documents and workflows, so it can read a set of
          drawings, understand the scope, and draft an estimate the way an experienced estimator
          would. That's the difference between automating a step and automating the job.
        </p>
        <p className="text-muted-foreground">
          alfred ai is built specifically for construction and professional services, with Australian
          pricing (AUD + 10% GST) and trade workflows handled natively. Explore the{" "}
          <Link to="/solutions/ai-takeoff" className="text-primary underline">
            construction estimating software
          </Link>{" "}
          or{" "}
          <Link to="/resources/demos" className="text-primary underline">
            try the live demos
          </Link>
          .
        </p>
      </div>
    </AnswerArticleLayout>
  );
};

export default AiForConstruction;
