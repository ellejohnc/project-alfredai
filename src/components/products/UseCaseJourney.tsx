import { motion } from "framer-motion";
import { User2, Bot } from "lucide-react";
import type { UseCase, JourneyActor } from "@/data/useCases";

const ActorPill = ({ actor }: { actor: JourneyActor }) => {
  const isHuman = actor === "human";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${
        isHuman
          ? "bg-muted text-foreground border-border"
          : "bg-primary/10 text-primary border-primary/30"
      }`}
    >
      {isHuman ? <User2 className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
      {isHuman ? "Your team" : "Agent"}
    </span>
  );
};

const UseCaseJourney = ({ useCase }: { useCase: UseCase }) => {
  return (
    <div className="space-y-10 md:space-y-14">
      {/* Stage timeline */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-2">
          How it runs
        </h2>
        <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-2xl leading-relaxed">
          Every step is either handled by an agent or kept in your team's hands — a
          done-for-you workflow with humans in the loop where it matters.
        </p>

        <ol className="relative border-l border-border ml-3 md:ml-4 space-y-6">
          {useCase.stages.map((stage, i) => (
            <motion.li
              key={stage.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3) }}
              className="ml-6 md:ml-8"
            >
              <span className="absolute -left-[13px] md:-left-[15px] flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-background border border-border text-[11px] md:text-xs font-bold tabular-nums text-muted-foreground">
                {stage.n}
              </span>
              <div className="rounded-2xl border border-border bg-card p-5 hover:border-foreground/20 transition-colors duration-300">
                <div className="flex flex-wrap items-center gap-3 mb-1.5">
                  <h3 className="text-base font-bold text-foreground">{stage.title}</h3>
                  <ActorPill actor={stage.actor} />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{stage.text}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default UseCaseJourney;
