import { Link } from "react-router-dom";
import AnswerArticleLayout from "@/components/seo/AnswerArticleLayout";

const faqs = [
  {
    question: "How do you use AI for construction estimating?",
    answer:
      "You upload your drawings and scope, the AI extracts quantities by trade, applies your rate library to price each item, and produces a draft estimate you review and adjust. With alfred ai, a take-off that used to take 8–14 hours can be reviewed in 20–40 minutes, with an audit trail kept on every line item.",
  },
  {
    question: "Can AI do construction take-offs from drawings?",
    answer:
      "Yes. Modern AI reads PDF architectural and engineering drawings, identifies elements, and extracts quantities by trade. You stay in control — the AI produces the take-off and you review and confirm before it's priced, so accuracy and accountability stay with your estimator.",
  },
  {
    question: "Is AI estimating accurate enough to quote real jobs?",
    answer:
      "AI estimating is designed to do the heavy lifting while your estimator reviews the output. Because it prices from your own rate library and keeps a line-item audit trail, you get speed without losing control. Most builders use it to produce a draft fast, then refine margins and assumptions before sending.",
  },
  {
    question: "How much time does AI save on estimating?",
    answer:
      "Builders typically see take-offs drop by 80–90% and pricing largely automated. That often means 15+ hours saved per estimator per week and the ability to quote 2–3x more tenders — usually paying for itself within 90 days.",
  },
];

const steps = [
  ["Upload drawings", "Drop in PDF drawings and scope notes — residential or commercial."],
  ["Confirm scope", "alfred ai summarises the scope so you can correct anything before extraction."],
  ["AI take-off & pricing", "Quantities extracted by trade and auto-priced from your rate library in AUD."],
  ["Review & send", "Adjust margins, export a client-ready estimate, keep the audit trail."],
];

const AiConstructionEstimating = () => {
  return (
    <AnswerArticleLayout
      metaTitle="How to Use AI for Construction Estimating (Step by Step)"
      metaDescription="Learn how to use AI for construction estimating — from drawings to a priced, trade-grouped estimate in minutes. A practical step-by-step for builders and estimators."
      path="/solutions/ai-for-construction/estimating"
      badge="How-to guide"
      h1="How to use AI for construction estimating"
      answer="To use AI for construction estimating, you upload your drawings and scope, the AI extracts quantities by trade and prices them from your own rate library, then you review and adjust the draft estimate. With alfred ai, take-offs that took 8–14 hours can be reviewed in 20–40 minutes, with a full audit trail on every line item — so you quote faster without losing control."
      breadcrumbs={[
        { name: "Home", url: "/" },
        { name: "Solutions", url: "/solutions" },
        { name: "AI for Construction", url: "/solutions/ai-for-construction" },
        { name: "AI for Estimating", url: "/solutions/ai-for-construction/estimating" },
      ]}
      faqs={faqs}
      related={[
        { label: "AI for construction (overview)", to: "/solutions/ai-for-construction" },
        { label: "What is the best AI for construction?", to: "/solutions/ai-for-construction/best-ai-for-construction" },
        { label: "Construction estimating software", to: "/solutions/ai-takeoff" },
      ]}
    >
      <div>
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
          The four steps, from drawings to estimate
        </h2>
        <div className="space-y-4">
          {steps.map(([title, desc], i) => (
            <div key={title} className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border">
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </div>
              <div>
                <div className="font-medium text-foreground">{title}</div>
                <p className="text-sm text-muted-foreground mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground mt-6">
          Want to see it on a real set of drawings?{" "}
          <Link to="/demos/drawings-to-estimate" className="text-primary underline">
            Try the live Drawings-to-Estimate demo
          </Link>
          .
        </p>
      </div>
    </AnswerArticleLayout>
  );
};

export default AiConstructionEstimating;
