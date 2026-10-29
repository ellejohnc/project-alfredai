import { useState } from "react";
import DOMPurify from "dompurify";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  FileText, Upload, AlertTriangle, CheckCircle2, 
  Bot, Loader2, Play, RotateCcw, ChevronDown,
  MessageSquare, Send, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { BeforeAfterCompare } from "./BeforeAfterCompare";
import { toast } from "sonner";

interface ContractSimulatorProps {
  company: string;
  industry: string;
  onComplete?: () => void;
}

const SAMPLE_CONTRACT = {
  title: "Construction Services Agreement",
  pages: 47,
  clauses: 142,
  content: `
    <h3>1. PARTIES</h3>
    <p>This Agreement is made between <strong>[Principal Name]</strong> ("Principal") and <strong>[Contractor Name]</strong> ("Contractor").</p>
    
    <h3>14.2 PAYMENT TERMS</h3>
    <p>Payment shall be made within <span class="risk-highlight">sixty (60) days</span> of receipt of a valid tax invoice. The Principal may withhold payment if...</p>
    
    <h3>8.1 LIABILITY LIMITATIONS</h3>
    <p>The Contractor's total aggregate liability under this Agreement shall not exceed the Contract Sum. Neither party shall be liable for any <span class="info-highlight">consequential, indirect or special damages</span>...</p>
    
    <h3>22.1 TERMINATION</h3>
    <p>Either party may terminate this Agreement by giving <span class="warning-highlight">thirty (30) days</span> written notice to the other party...</p>
  `
};

const DISCOVERED_CLAUSES = [
  { id: 1, name: "Payment Terms", section: "14.2", status: "risk", text: "60 days payment (vs standard 30)" },
  { id: 2, name: "Liability Cap", section: "8.1", status: "review", text: "Capped at contract sum" },
  { id: 3, name: "Termination", section: "22.1", status: "warning", text: "30 days notice period" },
  { id: 4, name: "Insurance", section: "9.3", status: "ok", text: "$20M public liability" },
  { id: 5, name: "Variations", section: "20.1", status: "missing", text: "No variation clause found" },
  { id: 6, name: "Dispute Resolution", section: "25.2", status: "ok", text: "Mediation required" },
];

const RISKS_IDENTIFIED = [
  { 
    severity: "high", 
    clause: "Payment Terms (14.2)", 
    issue: "Payment extended to 60 days from standard 30 days",
    impact: "Cash flow impact of ~$120K per month",
    recommendation: "Negotiate back to 30 days or request early payment discount"
  },
  { 
    severity: "high", 
    clause: "Variations (Missing)", 
    issue: "No variation clause present in contract",
    impact: "Unable to claim for scope changes",
    recommendation: "Add standard AS4000 variation provisions"
  },
  { 
    severity: "medium", 
    clause: "Termination (22.1)", 
    issue: "30-day notice is short for project of this scale",
    impact: "Insufficient time to demobilize and reassign resources",
    recommendation: "Extend to 60-day notice period"
  },
];

type SimulationStep = "idle" | "uploading" | "parsing" | "analyzing" | "identifying" | "complete";

export function ContractSimulator({ company, industry, onComplete }: ContractSimulatorProps) {
  const [step, setStep] = useState<SimulationStep>("idle");
  const [progress, setProgress] = useState(0);
  const [visibleClauses, setVisibleClauses] = useState<typeof DISCOVERED_CLAUSES>([]);
  const [visibleRisks, setVisibleRisks] = useState<typeof RISKS_IDENTIFIED>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [userQuestion, setUserQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [expandedRisk, setExpandedRisk] = useState<number | null>(null);
  const [loadingAmendment, setLoadingAmendment] = useState<number | null>(null);
  const [amendments, setAmendments] = useState<Record<number, string>>({});

  const handleSuggestAmendment = async (riskIndex: number) => {
    const risk = RISKS_IDENTIFIED[riskIndex];
    if (!risk || loadingAmendment !== null) return;
    
    setLoadingAmendment(riskIndex);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggest-amendment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ 
            clauseName: risk.clause,
            clauseText: risk.issue,
            clauseStatus: risk.severity,
            context: `Impact: ${risk.impact}. Current recommendation: ${risk.recommendation}`
          }),
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Failed to generate amendment");
        return;
      }
      
      setAmendments(prev => ({ ...prev, [riskIndex]: data.suggestion }));
    } catch (error) {
      console.error("Amendment error:", error);
      toast.error("Failed to generate amendment suggestion");
    } finally {
      setLoadingAmendment(null);
    }
  };

  const handleReset = () => {
    setStep("idle");
    setProgress(0);
    setVisibleClauses([]);
    setVisibleRisks([]);
    setShowComparison(false);
    setAiResponse("");
    setExpandedRisk(null);
    setAmendments({});
  };

  const handleStart = async () => {
    setStep("uploading");
    setProgress(0);

    await simulateDelay(800);
    setProgress(15);
    
    setStep("parsing");
    await simulateDelay(600);
    setProgress(30);
    
    setStep("analyzing");
    for (let i = 0; i < DISCOVERED_CLAUSES.length; i++) {
      await simulateDelay(400);
      setVisibleClauses(prev => [...prev, DISCOVERED_CLAUSES[i]]);
      setProgress(30 + ((i + 1) / DISCOVERED_CLAUSES.length) * 40);
    }
    
    setStep("identifying");
    for (let i = 0; i < RISKS_IDENTIFIED.length; i++) {
      await simulateDelay(600);
      setVisibleRisks(prev => [...prev, RISKS_IDENTIFIED[i]]);
      setProgress(70 + ((i + 1) / RISKS_IDENTIFIED.length) * 30);
    }
    
    setStep("complete");
    setShowComparison(true);
    setTimeout(() => onComplete?.(), 100);
  };

  const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleAskQuestion = async () => {
    if (!userQuestion.trim() || isAsking) return;
    
    setIsAsking(true);
    setAiResponse("");
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contract-question`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ 
            question: userQuestion,
            conversationHistory: []
          }),
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Failed to get answer");
        return;
      }
      
      setAiResponse(data.answer);
    } catch (error) {
      console.error("Error asking question:", error);
      toast.error("Failed to connect to AI assistant");
    } finally {
      setIsAsking(false);
      setUserQuestion("");
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "risk": return "border-l-destructive bg-destructive/5";
      case "warning": return "border-l-muted-foreground bg-muted/20";
      case "review": return "border-l-muted-foreground/50 bg-muted/10";
      case "ok": return "border-l-muted-foreground/30 bg-muted/5";
      case "missing": return "border-l-destructive/50 bg-destructive/5";
      default: return "bg-muted/5";
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "high": return "bg-destructive";
      case "medium": return "bg-muted-foreground";
      case "low": return "bg-muted-foreground/50";
      default: return "bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
        <div>
          <h3 className="text-base font-semibold text-foreground">Contract Review</h3>
          <p className="text-sm text-muted-foreground">
            See how {company} contracts get analyzed
          </p>
        </div>
        <div className="flex gap-2">
          {step !== "idle" && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset
            </Button>
          )}
          {step === "idle" && (
            <Button size="sm" onClick={handleStart}>
              <Play className="w-4 h-4 mr-1.5" />
              Run Demo
            </Button>
          )}
        </div>
      </div>


      {/* Main area */}
      <div className="grid md:grid-cols-2 gap-4 min-h-[400px]">
        {/* Document viewer */}
        <Card className="border border-border bg-card">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{SAMPLE_CONTRACT.title}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {SAMPLE_CONTRACT.pages} pages
            </Badge>
          </div>
          <CardContent className="p-4 relative min-h-[280px]">
            {step === "idle" ? (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                <Upload className="w-8 h-8 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">
                  Click "Run Demo" to upload a sample contract
                </p>
              </div>
            ) : (
              <>
                {(step === "parsing" || step === "analyzing") && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="absolute left-0 right-0 h-px bg-primary/40"
                      initial={{ top: 0 }}
                      animate={{ top: "100%" }}
                      transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                    />
                  </motion.div>
                )}
                
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed text-muted-foreground"
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(SAMPLE_CONTRACT.content, {
                      ALLOWED_TAGS: ['h3', 'p', 'strong', 'span', 'mark'],
                      ALLOWED_ATTR: ['class']
                    })
                  }}
                />
                
                <AnimatePresence>
                  {visibleClauses.filter(c => c.status === "risk" || c.status === "warning").map((clause, i) => (
                    <motion.div
                      key={clause.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute"
                      style={{ top: `${20 + i * 25}%`, right: 8 }}
                    >
                      <Badge variant="outline" className="text-xs">
                        {clause.status === "risk" ? <AlertTriangle className="w-3 h-3 mr-1" /> : null}
                        §{clause.section}
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </>
            )}
          </CardContent>
        </Card>

        {/* Analysis panel */}
        <Card className="border border-border bg-card">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">AI Analysis</span>
            </div>
            {step !== "idle" && step !== "complete" && (
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Processing</span>
              </div>
            )}
            {step === "complete" && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <CheckCircle2 className="w-3 h-3" />
                <span className="text-xs">Complete</span>
              </div>
            )}
          </div>
          <CardContent className="p-4 space-y-4 max-h-[360px] overflow-y-auto">
            {step === "idle" ? (
              <p className="text-muted-foreground text-sm text-center py-6">
                Analysis will appear here
              </p>
            ) : (
              <>
                {step !== "complete" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground capitalize">{step}...</span>
                      <span className="font-mono text-foreground">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                )}

                {visibleClauses.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Clauses ({visibleClauses.length}/{DISCOVERED_CLAUSES.length})
                    </h4>
                    <div className="space-y-1">
                      {visibleClauses.map((clause) => (
                        <motion.div
                          key={clause.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={cn(
                            "flex items-center justify-between p-2 rounded text-xs border-l-2 border border-border",
                            getStatusStyle(clause.status)
                          )}
                        >
                          <div className="flex items-center gap-2 text-foreground">
                            <span className="font-mono text-muted-foreground">§{clause.section}</span>
                            <span>{clause.name}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {clause.status}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {visibleRisks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" />
                      Risks
                    </h4>
                    <div className="space-y-1.5">
                      {visibleRisks.map((risk, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded border border-border overflow-hidden"
                        >
                          <button
                            onClick={() => setExpandedRisk(expandedRisk === i ? null : i)}
                            className="w-full p-2.5 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className={cn("w-1.5 h-1.5 rounded-full", getSeverityStyle(risk.severity))} />
                              <span className="text-sm text-foreground">{risk.clause}</span>
                            </div>
                            <ChevronDown className={cn(
                              "w-4 h-4 text-muted-foreground transition-transform",
                              expandedRisk === i && "rotate-180"
                            )} />
                          </button>
                          <AnimatePresence>
                            {expandedRisk === i && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-3 border-t border-border bg-muted/20 space-y-3 text-xs">
                                  <p className="text-foreground">{risk.issue}</p>
                                  <p className="text-muted-foreground">
                                    <strong>Impact:</strong> {risk.impact}
                                  </p>
                                  <p className="text-muted-foreground">
                                    <strong>Action:</strong> {risk.recommendation}
                                  </p>
                                  
                                  {/* Suggest Amendment Button */}
                                  {!amendments[i] && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSuggestAmendment(i);
                                      }}
                                      disabled={loadingAmendment !== null}
                                      className="w-full gap-2 mt-2"
                                    >
                                      {loadingAmendment === i ? (
                                        <>
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                          Generating...
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles className="w-3 h-3" />
                                          Suggest Amendment
                                        </>
                                      )}
                                    </Button>
                                  )}
                                  
                                  {/* AI Amendment Suggestion */}
                                  {amendments[i] && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 8 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="mt-3 p-3 rounded border border-primary/20 bg-primary/5"
                                    >
                                      <div className="flex items-center gap-1.5 mb-2">
                                        <Sparkles className="w-3 h-3 text-primary" />
                                        <span className="text-xs font-medium text-primary">AI Suggested Amendment</span>
                                      </div>
                                      <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                                        {amendments[i]}
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {step === "complete" && (
                  <div className="space-y-3 pt-2">
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Ask about this contract..."
                        value={userQuestion}
                        onChange={(e) => setUserQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
                        className="pl-9 pr-10 text-sm"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleAskQuestion}
                        disabled={isAsking || !userQuestion.trim()}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      >
                        {isAsking ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    {aiResponse && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded border border-border bg-muted/20 text-sm text-foreground"
                      >
                        {aiResponse}
                      </motion.div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparison */}
      {showComparison && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <BeforeAfterCompare
            title="Time Saved"
            items={[
              { label: "Review Time", before: "3+ hours", after: "15 seconds", improvement: "720x faster" },
              { label: "Risk Detection", before: "Manual review", after: "Instant AI", improvement: "100% coverage" },
            ]}
          />
        </motion.div>
      )}
    </div>
  );
}