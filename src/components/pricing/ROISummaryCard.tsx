import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Clock, Sparkles } from "lucide-react";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { cn } from "@/lib/utils";
import { ROICalculation } from "@/lib/roiScenarios";

interface ROISummaryCardProps {
  calculations: ROICalculation[];
  animationDelay?: number;
}

const scenarioConfig = {
  conservative: { label: "Guaranteed", icon: Clock, color: "text-amber-500" },
  likely: { label: "Most Likely", icon: TrendingUp, color: "text-primary" },
  best: { label: "Best Case", icon: Sparkles, color: "text-secondary" },
};

export function ROISummaryCard({ calculations, animationDelay = 0 }: ROISummaryCardProps) {
  const [activeScenario, setActiveScenario] = useState<'conservative' | 'likely' | 'best'>('likely');
  
  const activeCalc = calculations.find(c => c.scenario.type === activeScenario);
  
  if (!activeCalc) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.5 }}
      className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 border border-primary/20"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">ROI Summary</span>
      </div>

      {/* Scenario Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg mb-4">
        {(['conservative', 'likely', 'best'] as const).map((scenario) => {
          const config = scenarioConfig[scenario];
          return (
            <button
              key={scenario}
              onClick={() => setActiveScenario(scenario)}
              className={cn(
                "flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all min-h-[44px]",
                activeScenario === scenario
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Annual Savings */}
        <motion.div
          key={`savings-${activeScenario}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-1"
        >
          <p className="text-xs text-muted-foreground">Annual Savings</p>
          <p className="text-2xl font-bold text-primary">
            <AnimatedNumber
              value={activeCalc.annualSavings}
              prefix="$"
              duration={800}
            />
          </p>
        </motion.div>

        {/* Payback */}
        <motion.div
          key={`payback-${activeScenario}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-1"
        >
          <p className="text-xs text-muted-foreground">Payback Period</p>
          <p className="text-2xl font-bold text-foreground">
            <AnimatedNumber
              value={activeCalc.paybackMonths}
              suffix=" mo"
              duration={800}
            />
          </p>
        </motion.div>

        {/* ROI % */}
        <motion.div
          key={`roi-${activeScenario}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-1"
        >
          <p className="text-xs text-muted-foreground">First Year ROI</p>
          <p className={cn("text-2xl font-bold", activeCalc.roiPercentage > 0 ? "text-secondary" : "text-muted-foreground")}>
            <AnimatedNumber
              value={activeCalc.roiPercentage}
              suffix="%"
              duration={800}
            />
          </p>
        </motion.div>

        {/* Net Gain */}
        <motion.div
          key={`net-${activeScenario}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="space-y-1"
        >
          <p className="text-xs text-muted-foreground">Net Gain</p>
          <p className={cn("text-2xl font-bold", activeCalc.netGain > 0 ? "text-secondary" : "text-destructive")}>
            <AnimatedNumber
              value={Math.abs(activeCalc.netGain)}
              prefix={activeCalc.netGain >= 0 ? "$" : "-$"}
              duration={800}
            />
          </p>
        </motion.div>
      </div>

      {/* Scenario Description */}
      <motion.p
        key={`desc-${activeScenario}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-4 text-xs text-muted-foreground text-center"
      >
        {activeCalc.scenario.description}
      </motion.p>
    </motion.div>
  );
}
