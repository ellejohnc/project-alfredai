import { motion } from "framer-motion";
import { TrendingUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OutcomeMetric {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  tone?: "primary" | "emerald" | "amber" | "destructive";
}

const toneClass: Record<NonNullable<OutcomeMetric["tone"]>, string> = {
  primary: "text-primary",
  emerald: "text-emerald-600",
  amber: "text-amber-600",
  destructive: "text-destructive",
};

interface OutcomeSummaryCardProps {
  title?: string;
  metrics: OutcomeMetric[];
  note?: string;
  className?: string;
}

/**
 * Shared outcome / ROI summary panel shown at the end of construction demos.
 * Quantifies the value the workflow just delivered.
 */
export function OutcomeSummaryCard({
  title = "Outcome",
  metrics,
  note,
  className,
}: OutcomeSummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 p-4",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className="rounded-lg border border-border/60 bg-card/60 p-3"
            >
              <div className="flex items-center gap-1.5 mb-1">
                {Icon && <Icon className={cn("w-3.5 h-3.5", toneClass[m.tone ?? "primary"])} />}
                <p className="text-[11px] text-muted-foreground leading-tight">{m.label}</p>
              </div>
              <p className={cn("text-lg sm:text-xl font-bold leading-tight tabular-nums", toneClass[m.tone ?? "primary"])}>
                {m.value}
              </p>
              {m.sub && <p className="text-[11px] text-muted-foreground mt-0.5">{m.sub}</p>}
            </motion.div>
          );
        })}
      </div>
      {note && <p className="mt-3 text-xs text-muted-foreground">{note}</p>}
    </motion.div>
  );
}
