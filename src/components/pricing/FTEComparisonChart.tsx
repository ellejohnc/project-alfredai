import { motion } from "framer-motion";
import { DollarSign, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

interface FTEComparisonChartProps {
  highlightedMetric?: string | null;
}

interface MetricCardProps {
  title: string;
  icon: React.ReactNode;
  fteValue: number;
  agenticValue: number;
  fteLabel: string;
  agenticLabel: string;
  improvement: string;
  unit?: string;
  suffix?: string;
  isHighlighted: boolean;
  invertComparison?: boolean; // For metrics where lower is better (cost, time)
  delay?: number;
}

function MetricCard({
  title,
  icon,
  fteValue,
  agenticValue,
  fteLabel,
  agenticLabel,
  improvement,
  unit = "",
  suffix = "",
  isHighlighted,
  invertComparison = false,
  delay = 0,
}: MetricCardProps) {
  // Calculate bar widths as percentage of max value
  const maxValue = Math.max(fteValue, agenticValue);
  const fteWidth = (fteValue / maxValue) * 100;
  const agenticWidth = (agenticValue / maxValue) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        "p-5 rounded-xl border bg-background transition-all duration-200",
        isHighlighted ? "ring-2 ring-primary/50 shadow-lg scale-[1.02]" : "hover:shadow-md"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-muted">
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-sm">{title}</h4>
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium">
            {improvement}
          </span>
        </div>
      </div>

      {/* Bars */}
      <div className="space-y-3">
        {/* FTE Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Traditional FTE</span>
            <span className="text-sm font-semibold text-amber-600">
              {unit}
              <AnimatedNumber value={fteValue} duration={1200} />
              {suffix}
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-amber-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${fteWidth}%` }}
              transition={{ delay: delay + 0.2, duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Agentic Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Agentic AI</span>
            <span className="text-sm font-semibold text-primary">
              {unit}
              <AnimatedNumber value={agenticValue} duration={1200} />
              {suffix}
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${agenticWidth}%` }}
              transition={{ delay: delay + 0.3, duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed">
        <span className="text-[10px] text-muted-foreground">{fteLabel}</span>
        <span className="text-[10px] text-muted-foreground">{agenticLabel}</span>
      </div>
    </motion.div>
  );
}

export function FTEComparisonChart({ highlightedMetric }: FTEComparisonChartProps) {
  const isHighlighted = (metric: string) => {
    if (!highlightedMetric) return false;
    return metric.toLowerCase().includes(highlightedMetric.toLowerCase().split(" ")[0]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <div className="grid md:grid-cols-3 gap-4">
        {/* Monthly Cost Card */}
        <MetricCard
          title="Monthly Cost"
          icon={<DollarSign className="w-4 h-4 text-amber-600" />}
          fteValue={8500}
          agenticValue={2500}
          fteLabel="Mid-level employee"
          agenticLabel="Full AI deployment"
          improvement="70% lower"
          unit="$"
          suffix="/mo"
          isHighlighted={isHighlighted("monthly") || isHighlighted("cost")}
          invertComparison
          delay={0}
        />

        {/* Productivity Card */}
        <MetricCard
          title="Productivity Hours"
          icon={<Zap className="w-4 h-4 text-primary" />}
          fteValue={160}
          agenticValue={720}
          fteLabel="40hr work weeks"
          agenticLabel="24/7 availability"
          improvement="4.5x capacity"
          suffix=" hrs/mo"
          isHighlighted={isHighlighted("productivity")}
          delay={0.1}
        />

        {/* Time to Productivity Card */}
        <MetricCard
          title="Time to Productivity"
          icon={<Clock className="w-4 h-4 text-secondary" />}
          fteValue={135}
          agenticValue={30}
          fteLabel="Hiring + onboarding"
          agenticLabel="Deploy & train AI"
          improvement="90% faster"
          suffix=" days"
          isHighlighted={isHighlighted("time")}
          invertComparison
          delay={0.2}
        />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Each metric uses its own scale for accurate visual comparison
      </p>
    </motion.div>
  );
}
