import { motion } from "framer-motion";
import { 
  Bot, 
  Cog, 
  Brain, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AgenticAIComparisonProps {
  variant?: "compact" | "full";
  className?: string;
}

const comparisonData = [
  {
    feature: "Execution Style",
    traditional: "Rule-based, static workflows",
    agentic: "Reasoning and adaptation",
    traditionalIcon: Cog,
    agenticIcon: Brain,
  },
  {
    feature: "Exception Handling",
    traditional: "Breaks on edge cases",
    agentic: "Handles exceptions autonomously",
    traditionalIcon: AlertTriangle,
    agenticIcon: CheckCircle2,
  },
  {
    feature: "Learning",
    traditional: "Static efficiency",
    agentic: "Compound learning effect",
    traditionalIcon: XCircle,
    agenticIcon: TrendingUp,
  },
  {
    feature: "Intelligence",
    traditional: "Tool integration only",
    agentic: "Orchestrated multi-agent intelligence",
    traditionalIcon: Cog,
    agenticIcon: Lightbulb,
  },
  {
    feature: "Time Savings",
    traditional: "40-50% efficiency",
    agentic: "70-85%+ with growth trajectory",
    traditionalIcon: RefreshCw,
    agenticIcon: Zap,
  },
];

export function AgenticAIComparison({ variant = "full", className }: AgenticAIComparisonProps) {
  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-4 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent",
          className
        )}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground">Agentic AI Advantage</span>
            <p className="text-xs text-muted-foreground">Beyond traditional automation</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <XCircle className="w-3 h-3 text-destructive/60" />
            <span>Static rules</span>
          </div>
          <div className="flex items-center gap-1.5 text-primary">
            <CheckCircle2 className="w-3 h-3" />
            <span>Adaptive learning</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <XCircle className="w-3 h-3 text-destructive/60" />
            <span>40-50% savings</span>
          </div>
          <div className="flex items-center gap-1.5 text-primary">
            <CheckCircle2 className="w-3 h-3" />
            <span>70-85%+ savings</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border border-border bg-card overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-border bg-gradient-to-r from-muted/50 to-transparent">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Why Agentic AI is Different</h3>
            <p className="text-sm text-muted-foreground">
              Unlike traditional automation, alfred ai agents learn, reason, and adapt
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm font-medium">
          <div className="text-muted-foreground">Capability</div>
          <div className="text-center text-muted-foreground">Traditional Automation</div>
          <div className="text-center text-primary">Agentic AI (alfred ai)</div>
        </div>
        
        <div className="space-y-3">
          {comparisonData.map((item, index) => {
            const TraditionalIcon = item.traditionalIcon;
            const AgenticIcon = item.agenticIcon;
            
            return (
              <motion.div
                key={item.feature}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="grid grid-cols-3 gap-4 py-3 border-b border-border last:border-0"
              >
                <div className="text-sm font-medium text-foreground">{item.feature}</div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <TraditionalIcon className="w-4 h-4 text-muted-foreground/60" />
                  <span>{item.traditional}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium">
                  <AgenticIcon className="w-4 h-4" />
                  <span>{item.agentic}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent border-t border-border">
        <p className="text-sm text-center text-muted-foreground">
          <span className="text-primary font-medium">Compounding returns:</span> Your AI workforce gets smarter every quarter
        </p>
      </div>
    </motion.div>
  );
}

export default AgenticAIComparison;
