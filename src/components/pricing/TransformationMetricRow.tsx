import { motion } from "framer-motion";
import { Check } from "lucide-react";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { cn } from "@/lib/utils";

interface TransformationMetricRowProps {
  label: string;
  beforeValue: number;
  afterValue: number;
  unit?: string;
  prefix?: string;
  improvementText: string;
  animationDelay?: number;
  isReduction?: boolean; // True if lower is better (like hours/cost)
}

export function TransformationMetricRow({
  label,
  beforeValue,
  afterValue,
  unit = "",
  prefix = "",
  improvementText,
  animationDelay = 0,
  isReduction = true,
}: TransformationMetricRowProps) {
  // Calculate progress bar widths
  const maxValue = Math.max(beforeValue, afterValue);
  const beforeWidth = (beforeValue / maxValue) * 100;
  const afterWidth = (afterValue / maxValue) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.4, ease: "easeOut" }}
      className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50"
    >
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
        {/* Before */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-amber-600 dark:text-amber-400">
              <AnimatedNumber
                value={beforeValue}
                prefix={prefix}
                suffix={unit}
                duration={1500}
              />
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${beforeWidth}%` }}
              transition={{ delay: animationDelay + 0.3, duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
            />
          </div>
          <span className="text-xs text-muted-foreground">Non-agentic</span>
        </div>

        {/* Arrow */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: animationDelay + 0.8, type: "spring", stiffness: 300 }}
          className="flex items-center justify-center"
        >
          <span className="text-primary text-xl">→</span>
        </motion.div>

        {/* After */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-primary">
              <AnimatedNumber
                value={afterValue}
                prefix={prefix}
                suffix={unit}
                duration={1500}
              />
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${afterWidth}%` }}
              transition={{ delay: animationDelay + 0.5, duration: 0.6, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full relative overflow-hidden",
                "bg-gradient-to-r from-primary to-primary/80"
              )}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
            </motion.div>
          </div>
          <span className="text-xs text-muted-foreground">With alfred ai</span>
        </div>
      </div>

      {/* Improvement Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: animationDelay + 1.2, type: "spring", stiffness: 300 }}
        className="flex justify-center"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary/20 text-secondary border border-secondary/30">
          <Check className="w-3 h-3" />
          {improvementText}
        </span>
      </motion.div>
    </motion.div>
  );
}
