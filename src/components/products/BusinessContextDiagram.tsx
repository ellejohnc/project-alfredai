import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Building2, ArrowRight, X, Check, Info, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

type Item = { label: string; tip: string };

const generic: Item[] = [
  {
    label: "Knows how you price work?",
    tip: "Your pricing isn't just numbers — it's your margins, rates and the judgement calls your estimators make. Generic AI has never seen any of it.",
  },
  {
    label: "Knows how your team reviews risk?",
    tip: "How your team spots a dodgy clause or a risky job is unique to your business. Off-the-shelf AI guesses; it doesn't follow your process.",
  },
  {
    label: "Knows how your projects are delivered?",
    tip: "Your sequence of approvals, site steps and handovers is your own way of working. Generic AI has no idea how you actually deliver a job.",
  },
  {
    label: "Knows your drawings, contracts & SOPs?",
    tip: "Your documents, templates and standard procedures live in your business. Generic AI can't read what it's never been given.",
  },
];

const context: Item[] = [
  {
    label: "Tenders & drawings",
    tip: "The bids you submit and the plans you build from — Axiom learns to read and reason over them like your team does.",
  },
  {
    label: "Variations & contracts",
    tip: "Changes to scope and the agreements behind them. Axiom learns your terms so it can flag risk and price changes correctly.",
  },
  {
    label: "Safety procedures",
    tip: "Your site safety rules and compliance steps, so anything Axiom produces respects how you keep people safe.",
  },
  {
    label: "Commercial judgement",
    tip: "The instinct your best people use to make money calls — when to push back, when to absorb a cost. Axiom learns this from your real decisions.",
  },
  {
    label: "Company SOPs & policies",
    tip: "Standard Operating Procedures: your written 'this is how we do it here' guides. Axiom follows them instead of generic best-practice.",
  },
  {
    label: "Approvals & decision logic",
    tip: "Who signs off on what, and the rules behind each decision. Axiom learns your chain of command and thresholds.",
  },
];

const deeperWork: Item[] = [
  { label: "Reviewing tenders", tip: "Reading a bid and surfacing what matters — scope, exclusions and risk — the way an experienced estimator would." },
  { label: "Assessing project risk", tip: "Spotting where a job could go wrong (cost, time or safety) before it becomes a problem." },
  { label: "Comparing contracts", tip: "Putting two agreements side by side and flagging the clauses that differ or expose you." },
  { label: "Understanding drawings", tip: "Making sense of plans and specs — not just viewing them, but reasoning about what they require." },
  { label: "Following internal SOPs", tip: "Doing tasks the way your business does them, step by step, using your own procedures." },
  { label: "Applying commercial judgement", tip: "Making sensible money and scope calls in line with how your team would decide." },
  { label: "Preparing client-specific reports", tip: "Producing updates and documents tailored to each client's expectations and format." },
  { label: "Identifying delay risks", tip: "Catching early signs that a project might slip behind schedule." },
  { label: "Supporting staff onboarding", tip: "Helping new team members get up to speed using your knowledge and procedures." },
  { label: "Coordinating workflows across systems", tip: "Keeping tasks moving and information consistent across the tools you already use." },
];

const InfoTip = ({ tip, dark = false }: { tip: string; dark?: boolean }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button
        type="button"
        aria-label="More information"
        onClick={(e) => e.stopPropagation()}
        className={`flex-shrink-0 rounded-full p-1 -m-1 transition-colors touch-manipulation ${
          dark
            ? "text-background/60 hover:text-background"
            : "text-muted-foreground/60 hover:text-primary"
        }`}
      >
        <Info className="w-3.5 h-3.5" />
      </button>
    </PopoverTrigger>
    <PopoverContent
      side="top"
      align="start"
      className="w-64 text-sm leading-relaxed text-foreground"
    >
      {tip}
    </PopoverContent>
  </Popover>
);

const GenericCard = () => (
  <div className="rounded-2xl border border-border bg-card p-5 flex flex-col h-full">
    <div className="flex items-center gap-2 mb-4">
      <span className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
        <Brain className="w-5 h-5 text-muted-foreground" />
      </span>
      <div>
        <p className="text-sm font-bold text-foreground">Generic AI</p>
        <p className="text-xs text-muted-foreground">Shallow — no context</p>
      </div>
    </div>
    <ul className="space-y-2.5">
      {generic.map((g) => (
        <li key={g.label} className="flex items-start gap-2 text-sm text-muted-foreground">
          <X className="w-4 h-4 text-destructive/70 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{g.label}</span>
          <InfoTip tip={g.tip} />
        </li>
      ))}
    </ul>
  </div>
);

const ContextCard = () => (
  <div className="rounded-2xl border-2 border-primary/30 bg-card p-5 flex flex-col h-full">
    <div className="flex items-center gap-2 mb-4">
      <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
        <Building2 className="w-5 h-5 text-primary" />
      </span>
      <div>
        <p className="text-sm font-bold text-foreground">Your business context</p>
        <p className="text-xs text-muted-foreground">Trained into Axiom</p>
      </div>
    </div>
    <ul className="grid grid-cols-1 gap-2">
      {context.map((c) => (
        <li key={c.label} className="flex items-start gap-2 text-sm text-foreground">
          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <span className="flex-1">{c.label}</span>
          <InfoTip tip={c.tip} />
        </li>
      ))}
    </ul>
  </div>
);

const AxiomCard = () => (
  <div className="rounded-2xl border border-border bg-foreground text-background p-5 flex flex-col h-full">
    <p className="text-sm font-bold mb-1">Axiom does the deeper work</p>
    <p className="text-xs text-background/70 mb-4">
      Working with the same context as your best people
    </p>
    <div className="grid grid-cols-2 gap-2">
      {deeperWork.map((d) => (
        <span
          key={d.label}
          className="rounded-lg bg-background/10 px-3 py-2 text-xs font-medium leading-snug flex items-start gap-1.5"
        >
          <span className="flex-1">{d.label}</span>
          <InfoTip tip={d.tip} dark />
        </span>
      ))}
    </div>
  </div>
);

const stages = [
  { id: 0, title: "Generic AI", render: () => <GenericCard /> },
  { id: 1, title: "Your business context", render: () => <ContextCard /> },
  { id: 2, title: "Axiom does the work", render: () => <AxiomCard /> },
];

const MobileStepper = () => {
  const [active, setActive] = useState(0);
  const indices = stages.map((s) => s.id);
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeNavigation<number>({
    items: indices,
    activeItem: active,
    onNavigate: setActive,
  });

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {stages.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Go to step ${i + 1}: ${s.title}`}
            className={`h-2 rounded-full transition-all touch-manipulation ${
              active === i ? "w-7 bg-primary" : "w-2 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* Swipeable card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative overflow-hidden touch-pan-y"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            {stages[active].render()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Prev / Next controls */}
      <div className="flex items-center justify-between mt-4">
        <button
          type="button"
          onClick={() => setActive((i) => Math.max(0, i - 1))}
          disabled={active === 0}
          className="flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground disabled:opacity-40 touch-manipulation"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <span className="text-xs text-muted-foreground">
          Step {active + 1} of {stages.length}
        </span>
        <button
          type="button"
          onClick={() => setActive((i) => Math.min(stages.length - 1, i + 1))}
          disabled={active === stages.length - 1}
          className="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40 touch-manipulation"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-center text-muted-foreground mt-3">
        Swipe left or right to move through the steps.
      </p>
    </div>
  );
};

const BusinessContextDiagram = () => {
  const isMobile = useIsMobile();

  return (
    <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
      <div className="container-wide">
        <motion.div {...fadeUp} className="max-w-3xl mb-10 md:mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-4">
            Generic AI can answer questions. But it does not understand your business.
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Generic AI may write a decent email or summarise a meeting. But it will struggle with the work that
            actually moves a construction business forward. Axiom is the machine learning engine that trains your AI on
            the context your experienced site and office staff already carry.
          </p>
          <p className="text-sm md:text-base font-semibold text-foreground mt-4">
            Before AI can do the work, it needs to understand the work.
          </p>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Tap the info icons to see what each step means in plain English.
          </p>
        </motion.div>

        {isMobile ? (
          <MobileStepper />
        ) : (
          /* Diagram: Generic AI (shallow)  +  Business context  →  Axiom (does the work) */
          <div className="grid lg:grid-cols-[1fr_auto_1fr_auto_1.4fr] gap-6 lg:gap-4 items-stretch">
            <motion.div {...fadeUp}>
              <GenericCard />
            </motion.div>

            {/* plus */}
            <div className="hidden lg:flex items-center justify-center">
              <span className="text-2xl font-bold text-muted-foreground">+</span>
            </div>

            <motion.div {...fadeUp}>
              <ContextCard />
            </motion.div>

            {/* arrow */}
            <div className="hidden lg:flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-primary" />
            </div>

            <motion.div {...fadeUp}>
              <AxiomCard />
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
};

export default BusinessContextDiagram;
