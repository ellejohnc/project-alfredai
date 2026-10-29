import { useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, Clock, DollarSign, Users } from "lucide-react";
import { TransformationMetricRow } from "./TransformationMetricRow";
import { ROISummaryCard } from "./ROISummaryCard";
import { calculateROIScenarios, ClientInputs } from "@/lib/roiScenarios";
import { calculateInvestment, industryMultipliers } from "@/lib/pricingEngine";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ChatbotBeforeAfterProps {
  teamSize: number;
  averageAnnualSalary: number;
  hoursPerWeekOnAdmin: number;
  workflowCount: number;
  industry: string;
  showROISummary?: boolean;
  onComplete?: () => void;
  className?: string;
}

export function ChatbotBeforeAfter({
  teamSize,
  averageAnnualSalary,
  hoursPerWeekOnAdmin,
  workflowCount,
  industry,
  showROISummary = true,
  onComplete,
  className,
}: ChatbotBeforeAfterProps) {
  const isMobile = useIsMobile();
  const efficiencyRate = 0.70; // Most Likely scenario

  // Calculate before/after metrics
  const metrics = useMemo(() => {
    const hourlyRate = averageAnnualSalary / 2080;
    const weeklyHoursBefore = hoursPerWeekOnAdmin * teamSize;
    const annualHoursBefore = hoursPerWeekOnAdmin * 52 * teamSize;
    const annualCostBefore = Math.round(annualHoursBefore * hourlyRate);

    // After state with 70% efficiency
    const weeklyHoursAfter = Math.round(weeklyHoursBefore * (1 - efficiencyRate));
    const annualCostAfter = Math.round(annualCostBefore * (1 - efficiencyRate));
    const hoursFreedPerYear = Math.round(annualHoursBefore * efficiencyRate);

    // Strategic capacity (hours available for high-value work)
    const strategicHoursBefore = (40 - hoursPerWeekOnAdmin) * 52 * teamSize;
    const strategicHoursAfter = strategicHoursBefore + hoursFreedPerYear;

    return {
      weeklyHours: {
        before: weeklyHoursBefore,
        after: weeklyHoursAfter,
        reduction: Math.round(efficiencyRate * 100),
      },
      annualCost: {
        before: annualCostBefore,
        after: annualCostAfter,
        saved: annualCostBefore - annualCostAfter,
      },
      strategicCapacity: {
        before: Math.round(strategicHoursBefore),
        after: Math.round(strategicHoursAfter),
        multiplier: (strategicHoursAfter / strategicHoursBefore).toFixed(1),
      },
    };
  }, [teamSize, averageAnnualSalary, hoursPerWeekOnAdmin]);

  // Calculate ROI using existing functions
  const roiCalculations = useMemo(() => {
    const industryKey = Object.keys(industryMultipliers).find(
      key => key.toLowerCase().includes(industry.toLowerCase())
    ) || 'general';

    const pricing = calculateInvestment({
      workflowCount,
      teamSize,
      opsComplexity: 'standard',
      industry: industryKey,
    });

    const clientInputs: ClientInputs = {
      adminStaffCount: teamSize,
      averageHourlyCost: averageAnnualSalary,
      hoursPerWeekOnAdmin,
      workflowCount,
      teamSize,
    };

    return calculateROIScenarios(pricing, clientInputs);
  }, [teamSize, averageAnnualSalary, hoursPerWeekOnAdmin, workflowCount, industry]);

  // Trigger onComplete after animations finish
  useMemo(() => {
    if (onComplete) {
      const timer = setTimeout(onComplete, 4500);
      return () => clearTimeout(timer);
    }
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("space-y-4", className)}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 mb-2"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
          className="p-2 rounded-full bg-primary/10"
        >
          <Zap className="w-4 h-4 text-primary" />
        </motion.div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            Your Transformation Snapshot
          </h4>
          <p className="text-xs text-muted-foreground">
            Based on your {teamSize} team members at ${(averageAnnualSalary / 1000).toFixed(0)}k avg. salary
          </p>
        </div>
      </motion.div>

      {/* Column Headers */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 gap-4 text-center"
      >
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
            Non-Agentic (Manual)
          </span>
        </div>
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
          <span className="text-xs font-medium text-primary relative z-10">
            With alfred ai
          </span>
        </div>
      </motion.div>

      {/* Metric Rows */}
      <div className="space-y-3">
        {/* Weekly Hours */}
        <TransformationMetricRow
          label="Weekly Hours on Manual Tasks"
          beforeValue={metrics.weeklyHours.before}
          afterValue={metrics.weeklyHours.after}
          unit=" hrs/wk"
          improvementText={`${metrics.weeklyHours.reduction}% reduction`}
          animationDelay={0.5}
          isReduction={true}
        />

        {/* Annual Cost */}
        <TransformationMetricRow
          label="Annual Cost of Non-Agentic Work"
          beforeValue={metrics.annualCost.before}
          afterValue={metrics.annualCost.after}
          prefix="$"
          improvementText={`$${(metrics.annualCost.saved / 1000).toFixed(0)}k saved annually`}
          animationDelay={0.8}
          isReduction={true}
        />

        {/* Strategic Capacity */}
        <TransformationMetricRow
          label="Hours Freed for Strategic Work"
          beforeValue={metrics.strategicCapacity.before}
          afterValue={metrics.strategicCapacity.after}
          unit=" hrs/yr"
          improvementText={`${metrics.strategicCapacity.multiplier}x more capacity`}
          animationDelay={1.1}
          isReduction={false}
        />
      </div>

      {/* ROI Summary */}
      {showROISummary && (
        <ROISummaryCard
          calculations={roiCalculations}
          animationDelay={1.8}
        />
      )}

      {/* "While They're Still..." Callout */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2.5, duration: 0.4 }}
        className="mt-4 border-l-4 border-primary pl-4 py-3 bg-primary/5 rounded-r-lg"
      >
        <p className="text-sm font-medium text-primary flex items-center gap-2">
          <Clock className="w-4 h-4" />
          While a new hire is still onboarding...
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Your AI agents have already processed{" "}
          <span className="font-semibold text-foreground">
            {Math.round(metrics.weeklyHours.before * efficiencyRate * 8)} tasks
          </span>{" "}
          and saved{" "}
          <span className="font-semibold text-foreground">
            {Math.round(metrics.weeklyHours.before * efficiencyRate * 8)} hours
          </span>
        </p>
      </motion.div>
    </motion.div>
  );
}

export default ChatbotBeforeAfter;
