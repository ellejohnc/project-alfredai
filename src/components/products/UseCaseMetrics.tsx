import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UseCase } from "@/data/useCases";

const MAX_ICONS = 10;

const iconCount = (value: number, max: number) => {
  if (!value || !max) return 1;
  return Math.max(1, Math.min(MAX_ICONS, Math.round((value / max) * MAX_ICONS)));
};

const IconRow = ({
  Icon,
  count,
  active,
  money,
  delay,
}: {
  Icon: LucideIcon;
  count: number;
  active: boolean;
  money?: boolean;
  delay: number;
}) => (
  <div className="flex flex-wrap gap-1">
    {Array.from({ length: count }).map((_, i) => (
      <motion.span
        key={i}
        initial={{ opacity: 0, scale: 0.4 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.25, delay: delay + i * 0.04 }}
        className={`flex items-center justify-center rounded-md w-6 h-6 border ${
          active
            ? money
              ? "bg-status-ontrack-surface border-status-ontrack/40 text-status-ontrack"
              : "bg-primary/15 border-primary/30 text-primary"
            : "bg-muted border-border text-muted-foreground/50"
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
      </motion.span>
    ))}
  </div>
);


const UseCaseMetrics = ({ useCase }: { useCase: UseCase }) => {
  if (!useCase.metrics || useCase.metrics.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-elevation-1">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center border bg-muted border-border">
            <TrendingUp className="w-4 h-4 text-foreground" />
          </span>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Before and after
          </h3>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-3 h-3 rounded-sm bg-muted border border-border" />
            Before
          </span>
          <span className="flex items-center gap-1.5 text-foreground">
            <span className="w-3 h-3 rounded-sm bg-primary/20 border border-primary/40" />
            With alfred ai
          </span>
        </div>
      </div>

      <div className="space-y-7">
        {useCase.metrics.map((m, i) => {
          const Icon: LucideIcon = m.icon ?? TrendingUp;
          const before = m.beforeValue ?? 1;
          const after = m.afterValue ?? 1;
          const max = Math.max(before, after) || 1;
          const beforeCount = iconCount(before, max);
          const afterCount = iconCount(after, max);
          const money = m.betterIsLower;
          return (
            <div
              key={m.label}
              className="grid grid-cols-1 sm:grid-cols-[minmax(0,200px)_1fr] gap-3 sm:gap-5 items-start pb-7 border-b border-border last:border-0 last:pb-0"
            >
              {/* Label */}
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${
                    money
                      ? "bg-status-ontrack-surface border-status-ontrack/40"
                      : "bg-primary/10 border-primary/30"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${money ? "text-status-ontrack" : "text-primary"}`} />
                </span>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {m.label}
                </p>
              </div>


              {/* Pictograms */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <IconRow Icon={Icon} count={beforeCount} active={false} delay={i * 0.05} />
                  <span className="text-sm font-medium text-muted-foreground tabular-nums">{m.before}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <IconRow Icon={Icon} count={afterCount} active money={money} delay={0.1 + i * 0.05} />
                  <span className={`text-base font-bold tabular-nums ${money ? "text-status-ontrack" : "text-foreground"}`}>{m.after}</span>
                  {m.delta && (
                    <span
                      className={`text-sm font-bold px-2 py-0.5 rounded-full tabular-nums ${
                        money
                          ? "bg-status-ontrack-surface text-status-ontrack"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {m.delta}
                    </span>
                  )}
                </div>

              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UseCaseMetrics;
