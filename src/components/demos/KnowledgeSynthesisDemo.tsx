import { useState, useEffect } from "react";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { InlineDemoSpeedControl } from "@/components/demos/shared/InlineDemoSpeedControl";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  FileText, 
  Brain, 
  Sparkles, 
  Link2, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Document = {
  id: string;
  title: string;
  type: string;
  connected: boolean;
};

type Insight = {
  id: string;
  type: "trend" | "risk" | "opportunity";
  title: string;
  description: string;
  confidence: number;
  sources: string[];
};

const documents: Document[] = [
  { id: "1", title: "Q3 Financial Report", type: "Excel", connected: false },
  { id: "2", title: "Market Analysis 2024", type: "PDF", connected: false },
  { id: "3", title: "Customer Feedback Survey", type: "Doc", connected: false },
  { id: "4", title: "Competitor Intelligence", type: "PDF", connected: false },
  { id: "5", title: "Sales Pipeline Review", type: "Slides", connected: false },
];

const insights: Insight[] = [
  {
    id: "1",
    type: "trend",
    title: "Revenue Growth Pattern",
    description: "23% YoY growth correlates with enterprise contract expansion in APAC region",
    confidence: 94,
    sources: ["Q3 Financial Report", "Sales Pipeline Review"]
  },
  {
    id: "2",
    type: "risk",
    title: "Market Saturation Warning",
    description: "Competitor analysis shows 3 new entrants targeting our mid-market segment",
    confidence: 87,
    sources: ["Competitor Intelligence", "Market Analysis 2024"]
  },
  {
    id: "3",
    type: "opportunity",
    title: "Customer Expansion Opportunity",
    description: "78% of surveyed customers interested in premium tier upgrade",
    confidence: 91,
    sources: ["Customer Feedback Survey", "Sales Pipeline Review"]
  },
];

const insightIcons = {
  trend: TrendingUp,
  risk: AlertCircle,
  opportunity: Lightbulb,
};

const insightColors = {
  trend: "text-blue-500 bg-blue-500/10",
  risk: "text-amber-500 bg-amber-500/10",
  opportunity: "text-green-500 bg-green-500/10",
};

export default function KnowledgeSynthesisDemo() {
  const { applySpeed } = useDemoSpeed();
  const [stage, setStage] = useState<"idle" | "connecting" | "analyzing" | "complete">("idle");
  const [connectedDocs, setConnectedDocs] = useState<string[]>([]);
  const [visibleInsights, setVisibleInsights] = useState<string[]>([]);
  const [showExecutiveSummary, setShowExecutiveSummary] = useState(false);

  const startSynthesis = () => {
    setStage("connecting");
    setConnectedDocs([]);
    setVisibleInsights([]);
    setShowExecutiveSummary(false);

    // Animate document connections
    documents.forEach((doc, index) => {
      setTimeout(() => {
        setConnectedDocs(prev => [...prev, doc.id]);
      }, applySpeed(index * 400));
    });

    // Move to analyzing stage
    setTimeout(() => {
      setStage("analyzing");
    }, applySpeed(documents.length * 400 + 500));

    // Reveal insights one by one
    setTimeout(() => {
      insights.forEach((insight, index) => {
        setTimeout(() => {
          setVisibleInsights(prev => [...prev, insight.id]);
        }, applySpeed(index * 800));
      });
    }, applySpeed(documents.length * 400 + 1500));

    // Complete and show summary
    setTimeout(() => {
      setStage("complete");
      setShowExecutiveSummary(true);
    }, applySpeed(documents.length * 400 + 1500 + insights.length * 800 + 500));
  };

  const reset = () => {
    setStage("idle");
    setConnectedDocs([]);
    setVisibleInsights([]);
    setShowExecutiveSummary(false);
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Knowledge Synthesis</h3>
              <p className="text-xs text-muted-foreground">AI-powered insight generation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <InlineDemoSpeedControl compact className="hidden sm:flex" />
            {stage !== "idle" && (
              <Button variant="ghost" size="sm" onClick={reset}>
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Documents Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Source Documents</span>
            <span className="text-xs text-muted-foreground">
              {connectedDocs.length}/{documents.length} connected
            </span>
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            {documents.map((doc) => {
              const isConnected = connectedDocs.includes(doc.id);
              
              return (
                <motion.div
                  key={doc.id}
                  animate={{
                    scale: isConnected ? [1, 1.1, 1] : 1,
                    borderColor: isConnected ? "hsl(var(--primary))" : "hsl(var(--border))"
                  }}
                  className={cn(
                    "p-3 rounded-lg border-2 text-center transition-all",
                    isConnected ? "bg-primary/5" : "bg-muted/30"
                  )}
                >
                  <FileText className={cn(
                    "w-5 h-5 mx-auto mb-1",
                    isConnected ? "text-primary" : "text-muted-foreground"
                  )} />
                  <p className="text-[10px] text-muted-foreground truncate">{doc.type}</p>
                  {isConnected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-1"
                    >
                      <Link2 className="w-3 h-3 text-primary mx-auto" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Processing Indicator */}
        <AnimatePresence>
          {stage === "analyzing" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Synthesizing insights...</p>
                  <p className="text-xs text-muted-foreground">Analyzing patterns across documents</p>
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-indigo-500"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Insights */}
        <AnimatePresence>
          {visibleInsights.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3 mb-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Generated Insights</span>
              </div>
              
              {insights.filter(i => visibleInsights.includes(i.id)).map((insight, index) => {
                const Icon = insightIcons[insight.type as keyof typeof insightIcons] || Lightbulb;
                const colorClass = insightColors[insight.type as keyof typeof insightColors] || 'bg-muted text-muted-foreground';
                
                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl bg-muted/50 border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg", colorClass)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm text-foreground">{insight.title}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium tabular-nums">
                            {insight.confidence}% confidence
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span>Sources:</span>
                          {insight.sources.map((source, i) => (
                            <span key={source} className="px-1.5 py-0.5 bg-background rounded">
                              {source}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Executive Summary */}
        <AnimatePresence>
          {showExecutiveSummary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="font-semibold text-foreground">Executive Summary Generated</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Analysis of 5 documents reveals strong revenue momentum (23% YoY) driven by enterprise expansion, 
                with emerging competitive threats in mid-market. Customer sentiment indicates high upgrade potential (78%).
              </p>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-green-600">
                  <BarChart3 className="w-3 h-3" />
                  3 key insights
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <FileText className="w-3 h-3" />
                  5 sources analyzed
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Button */}
        {stage === "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Button onClick={startSynthesis} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Start Synthesis Demo
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Watch AI connect insights across multiple documents
            </p>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-muted/30 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>Powered by Knowledge Intelligence Engine</span>
        <span className="flex items-center gap-1">
          <Brain className="w-3 h-3" />
          Multi-document analysis
        </span>
      </div>
    </div>
  );
}
