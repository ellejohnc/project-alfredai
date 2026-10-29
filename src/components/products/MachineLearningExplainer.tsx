import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Database, Cpu, Boxes, Sparkles, RefreshCw, ArrowRight } from "lucide-react";

/**
 * MachineLearningExplainer
 * A plain-English, animated diagram explaining what machine learning is —
 * framed around how Axiom learns from your business.
 * Mobile-first, touch-friendly, en-AU copy.
 */

const stages = [
  {
    icon: Database,
    title: "1. Data",
    plain: "Examples from your business",
    detail:
      "Drawings, tenders, contracts, SOPs, emails and past decisions. The raw experience the system learns from.",
  },
  {
    icon: Cpu,
    title: "2. Training",
    plain: "Finding the patterns",
    detail:
      "Instead of being hand-coded with rules, the system studies thousands of examples and works out the patterns on its own.",
  },
  {
    icon: Boxes,
    title: "3. Model",
    plain: "The learned know-how",
    detail:
      "Those patterns are captured in a model — a compact version of your institutional knowledge it can reuse.",
  },
  {
    icon: Sparkles,
    title: "4. Prediction",
    plain: "Useful output",
    detail:
      "Given something new — a fresh tender or contract — the model applies what it learned to draft, flag risk or decide.",
  },
];

const StageCard = ({
  stage,
  index,
  active,
}: {
  stage: (typeof stages)[number];
  index: number;
  active: boolean;
}) => {
  const Icon = stage.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.12, 0.4) }}
      className={`relative flex flex-col rounded-2xl border bg-card p-5 transition-colors duration-500 ${
        active ? "border-primary shadow-lg" : "border-border"
      }`}
    >
      <div
        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-500 ${
          active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {stage.title}
      </span>
      <h3 className="mt-1 text-base font-bold text-foreground">{stage.plain}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{stage.detail}</p>
    </motion.div>
  );
};

const MachineLearningExplainer = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [active, setActive] = useState(0);

  // Auto-advance the highlighted stage once the diagram is on screen.
  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      setActive((p) => (p + 1) % stages.length);
    }, 1800);
    return () => clearInterval(id);
  }, [inView]);

  return (
    <section className="border-y border-border bg-background py-14 md:py-20" ref={ref}>
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-10 max-w-2xl text-center md:mb-14"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            First principles
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            What is machine learning?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
            Traditional software follows rules a person writes by hand. Machine learning flips that:
            instead of being told every rule, the system <span className="font-semibold text-foreground">learns the
            rules from examples</span>. The more relevant examples it sees, the sharper it gets — which is exactly
            how Axiom learns the logic of your business.
          </p>
        </motion.div>

        {/* Animated pipeline diagram */}
        <div className="relative">
          <div className="grid gap-4 md:grid-cols-4 md:gap-5">
            {stages.map((stage, i) => (
              <div key={stage.title} className="relative">
                <StageCard stage={stage} index={i} active={inView && active === i} />
                {/* Connector arrow (desktop) */}
                {i < stages.length - 1 && (
                  <div className="pointer-events-none absolute -right-3.5 top-1/2 z-10 hidden -translate-y-1/2 md:block">
                    <motion.div
                      animate={{ opacity: inView && active === i ? 1 : 0.3, x: inView && active === i ? 3 : 0 }}
                      transition={{ duration: 0.4 }}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-primary"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </motion.div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Animated progress track */}
          <div className="mt-6 hidden h-1 w-full overflow-hidden rounded-full bg-muted md:block">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: inView ? `${((active + 1) / stages.length) * 100}%` : "0%" }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* The learning loop */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mt-10 flex max-w-3xl flex-col items-center gap-4 rounded-2xl border border-border bg-muted/30 p-6 text-center sm:flex-row sm:text-left md:mt-14"
        >
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <RefreshCw className="h-6 w-6 animate-[spin_6s_linear_infinite]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">It keeps learning</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Every correction and new example feeds back into training. The model improves over time — so your AI
              stays aligned with how your business actually operates today, not how it worked last year.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MachineLearningExplainer;
