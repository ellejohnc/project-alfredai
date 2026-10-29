import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Zap, TrendingUp, DollarSign, ArrowRight, BarChart3, Table } from "lucide-react";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FTEComparisonChart } from "./FTEComparisonChart";
import { Toggle } from "@/components/ui/toggle";

// Reusable FTE tooltip component
const FTETooltip = ({ children }: { children: React.ReactNode }) => (
  <TooltipProvider delayDuration={100}>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center cursor-help border-b border-dotted border-muted-foreground/50">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px]">
        <p className="font-medium">Full Time Employee</p>
        <p className="text-xs text-muted-foreground">
          A traditional employee hired at ~160 hrs/month
        </p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface ComparisonRow {
  metric: string;
  fte: string | number;
  agentic: string | number;
  improvement: string;
  isNumeric?: boolean;
  prefix?: string;
  suffix?: string;
}

const comparisonData: ComparisonRow[] = [
  {
    metric: "Monthly Cost (Mid-level)",
    fte: 8500,
    agentic: 2500,
    improvement: "70% lower",
    isNumeric: true,
    prefix: "$",
    suffix: "/mo",
  },
  {
    metric: "Productivity Hours",
    fte: 160,
    agentic: 720,
    improvement: "4.5x capacity",
    isNumeric: true,
    suffix: " hrs/mo",
  },
  {
    metric: "Time to Productivity",
    fte: "3-6 months",
    agentic: "14-45 days",
    improvement: "90% faster",
  },
  {
    metric: "Scaling Speed",
    fte: "Weeks per hire",
    agentic: "Instant",
    improvement: "On-demand",
  },
  {
    metric: "Error Rate",
    fte: "Human variance",
    agentic: "<2%",
    improvement: "Consistent",
  },
  {
    metric: "Availability",
    fte: "40 hrs/week",
    agentic: "24/7/365",
    improvement: "Always on",
  },
];

type ViewMode = "table" | "chart";

export function FTEComparisonTable() {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<ViewMode>("chart");
  const [highlightedMetric, setHighlightedMetric] = useState<string | null>(null);

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20 mb-4">
            <DollarSign className="w-3 h-3" />
            Cost Comparison
          </span>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            <FTETooltip>FTE</FTETooltip> vs. Agentic AI: The Numbers
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See why businesses are choosing AI agents over traditional hires for operational efficiency.
          </p>
        </motion.div>

        {/* View Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center mb-6"
        >
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-muted/50 border">
            <Toggle
              pressed={viewMode === "table"}
              onPressedChange={() => setViewMode("table")}
              className={cn(
                "px-4 py-2 rounded-md transition-all",
                "min-h-[44px] min-w-[44px]",
                viewMode === "table" 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Table view"
            >
              <Table className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Table</span>
            </Toggle>
            <Toggle
              pressed={viewMode === "chart"}
              onPressedChange={() => setViewMode("chart")}
              className={cn(
                "px-4 py-2 rounded-md transition-all",
                "min-h-[44px] min-w-[44px]",
                viewMode === "chart" 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Chart view"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Chart</span>
            </Toggle>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {viewMode === "table" ? (
            <motion.div
              key="table"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Table Header */}
              <div className={cn(
                "grid gap-4 mb-4",
                isMobile ? "grid-cols-3" : "grid-cols-4"
              )}>
                <div className="text-sm font-medium text-muted-foreground">Metric</div>
                <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
                  <Users className="w-4 h-4" />
                  <span>Traditional <FTETooltip>FTE</FTETooltip></span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Zap className="w-4 h-4" />
                  <span>Agentic AI</span>
                </div>
                {!isMobile && (
                  <div className="flex items-center gap-2 text-sm font-medium text-secondary">
                    <TrendingUp className="w-4 h-4" />
                    <span>Improvement</span>
                  </div>
                )}
              </div>

              {/* Table Rows */}
              <div className="space-y-3">
                {comparisonData.map((row, idx) => (
                  <motion.div
                    key={row.metric}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "grid gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer",
                      "bg-muted/30",
                      highlightedMetric === row.metric 
                        ? "ring-2 ring-primary/50 bg-primary/5 scale-[1.02]" 
                        : "hover:bg-muted/50",
                      isMobile ? "grid-cols-3" : "grid-cols-4"
                    )}
                    onMouseEnter={() => setHighlightedMetric(row.metric)}
                    onMouseLeave={() => setHighlightedMetric(null)}
                    onTouchStart={() => setHighlightedMetric(row.metric)}
                    onTouchEnd={() => setHighlightedMetric(null)}
                  >
                    {/* Metric Name */}
                    <div className="flex items-center">
                      <span className="text-sm font-medium">{row.metric}</span>
                    </div>

                    {/* FTE Value */}
                    <div className="flex items-center">
                      <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                        {row.isNumeric && typeof row.fte === "number" ? (
                          <AnimatedNumber
                            value={row.fte}
                            prefix={row.prefix}
                            suffix={row.suffix}
                            duration={1500}
                          />
                        ) : (
                          row.fte
                        )}
                      </span>
                    </div>

                    {/* Agentic Value */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-primary font-semibold">
                        {row.isNumeric && typeof row.agentic === "number" ? (
                          <AnimatedNumber
                            value={row.agentic}
                            prefix={row.prefix}
                            suffix={row.suffix}
                            duration={1500}
                          />
                        ) : (
                          row.agentic
                        )}
                      </span>
                      {isMobile && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/20 text-secondary font-medium">
                          {row.improvement}
                        </span>
                      )}
                    </div>

                    {/* Improvement Badge (Desktop) */}
                    {!isMobile && (
                      <div className="flex items-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20">
                          <ArrowRight className="w-3 h-3" />
                          {row.improvement}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chart"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <FTEComparisonChart highlightedMetric={highlightedMetric} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hover hint for table view */}
        {viewMode === "table" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground text-center mt-4"
          >
            💡 Hover over rows to highlight in chart view
          </motion.p>
        )}

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-6 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20"
        >
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">
                <AnimatedNumber value={7} suffix="x" duration={1500} />
              </p>
              <p className="text-sm text-muted-foreground">Productivity increase</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-secondary">
                <AnimatedNumber value={70} suffix="%" duration={1500} />
              </p>
              <p className="text-sm text-muted-foreground">Cost reduction</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">
                <AnimatedNumber value={90} suffix="%" duration={1500} />
              </p>
              <p className="text-sm text-muted-foreground">Faster deployment</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
