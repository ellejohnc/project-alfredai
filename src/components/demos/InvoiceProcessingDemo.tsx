import { useState, useEffect, useCallback, useRef } from "react";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { InlineDemoSpeedControl } from "@/components/demos/shared/InlineDemoSpeedControl";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { 
  Mail, FileText, Scan, Database, Brain, CheckCircle, XCircle, 
  Forward, Clock, Building2, Shield, AlertTriangle, Play, Pause,
  RotateCcw, ChevronRight, ChevronLeft, User, Zap, FileCheck,
  Receipt, DollarSign, Calendar, Hash, Percent, Package, Truck,
  HardHat, ShieldCheck, ArrowRight, ExternalLink, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ProcessingStep = "trigger" | "extraction" | "context" | "recommendation" | "decision" | "execution" | "audit";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface ExtractedField {
  field: string;
  value: string;
  confidence: number;
  icon: React.ElementType;
}

interface ContextSource {
  name: string;
  type: "invoice" | "vendor" | "policy";
  icon: React.ElementType;
  summary: string;
  color: string;
}

interface AuditEntry {
  timestamp: string;
  action: string;
  actor: "AI" | "Human" | "System";
  detail: string;
  icon: React.ElementType;
}

const STEPS: { id: ProcessingStep; label: string; icon: React.ElementType; color: string }[] = [
  { id: "trigger", label: "Trigger", icon: Mail, color: "sky" },
  { id: "extraction", label: "AI Extraction", icon: Scan, color: "violet" },
  { id: "context", label: "Context", icon: Database, color: "indigo" },
  { id: "recommendation", label: "Recommendation", icon: Brain, color: "amber" },
  { id: "decision", label: "Decision", icon: User, color: "slate" },
  { id: "execution", label: "Execution", icon: Zap, color: "emerald" },
  { id: "audit", label: "Audit Trail", icon: Shield, color: "blue" },
];

const sampleInvoice = {
  supplier: "ABC Building Supplies Pty Ltd",
  abn: "12 345 678 901",
  invoiceNumber: "INV-2025-00892",
  amount: 12450.00,
  gst: 1245.00,
  total: 13695.00,
  dueDate: "Jan 31, 2025",
  paymentTerms: "Net 30",
  lineItems: [
    { description: "Concrete Mix 40kg bags x 200", quantity: 200, unitPrice: 25.50, amount: 5100.00 },
    { description: "Reinforcing Steel 12mm x 100m", quantity: 50, unitPrice: 89.00, amount: 4450.00 },
    { description: "Safety Equipment Package", quantity: 1, unitPrice: 1650.00, amount: 1650.00 },
    { description: "Delivery & Handling", quantity: 1, unitPrice: 1250.00, amount: 1250.00 },
  ] as LineItem[],
};

const extractedFields: ExtractedField[] = [
  { field: "Supplier", value: "ABC Building Supplies Pty Ltd", confidence: 98, icon: Building2 },
  { field: "ABN", value: "12 345 678 901", confidence: 99, icon: Hash },
  { field: "Invoice Number", value: "INV-2025-00892", confidence: 99, icon: FileText },
  { field: "Subtotal", value: "$12,450.00", confidence: 97, icon: DollarSign },
  { field: "GST (10%)", value: "$1,245.00", confidence: 97, icon: Percent },
  { field: "Total Amount", value: "$13,695.00", confidence: 99, icon: Receipt },
  { field: "Due Date", value: "Jan 31, 2025", confidence: 96, icon: Calendar },
  { field: "Payment Terms", value: "Net 30", confidence: 95, icon: Clock },
];

const contextSources: ContextSource[] = [
  { 
    name: "Invoice PDF", 
    type: "invoice", 
    icon: FileText, 
    summary: "Source document analyzed",
    color: "sky"
  },
  { 
    name: "Vendor Profile", 
    type: "vendor", 
    icon: Building2, 
    summary: "12 previous invoices, avg 28-day payment",
    color: "emerald"
  },
  { 
    name: "Finance Policy", 
    type: "policy", 
    icon: Shield, 
    summary: "Auto-approval threshold: $10,000",
    color: "amber"
  },
];

export default function InvoiceProcessingDemo() {
  const { applySpeed } = useDemoSpeed();
  const [currentStep, setCurrentStep] = useState<ProcessingStep>("trigger");
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [visibleFields, setVisibleFields] = useState(0);
  const [userDecision, setUserDecision] = useState<"approve" | "delegate" | "reject" | null>(null);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const stepsScrollRef = useRef<HTMLDivElement>(null);

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  // Swipe navigation for steps
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeNavigation({
    items: STEPS.map(s => s.id),
    activeItem: currentStep,
    onNavigate: (stepId) => {
      const stepIndex = STEPS.findIndex(s => s.id === stepId);
      // Only allow navigation to completed or current steps
      if (stepIndex <= currentStepIndex) {
        setCurrentStep(stepId);
      }
    },
  });

  // Scroll arrows for steps
  const scrollSteps = (direction: "left" | "right") => {
    if (stepsScrollRef.current) {
      const scrollAmount = 80;
      stepsScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Timer for processing time
  useEffect(() => {
    const timer = setInterval(() => {
      if (currentStep !== "audit") {
        setProcessingTime(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentStep]);

  // Auto-play logic
  useEffect(() => {
    if (!isAutoPlay) return;
    
    const stepDurations: Record<ProcessingStep, number> = {
      trigger: 3000,
      extraction: 4000,
      context: 3500,
      recommendation: 3000,
      decision: 5000,
      execution: 4000,
      audit: 0,
    };

    if (currentStep === "decision" || currentStep === "audit") {
      setIsAutoPlay(false);
      return;
    }

    const timer = setTimeout(() => {
      handleNextStep();
    }, applySpeed(stepDurations[currentStep]));

    return () => clearTimeout(timer);
  }, [isAutoPlay, currentStep]);

  // Extraction animation
  useEffect(() => {
    if (currentStep !== "extraction") return;
    
    setExtractionProgress(0);
    setVisibleFields(0);
    
    const progressTimer = setInterval(() => {
      setExtractionProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    const fieldTimer = setInterval(() => {
      setVisibleFields(prev => {
        if (prev >= extractedFields.length) {
          clearInterval(fieldTimer);
          return extractedFields.length;
        }
        return prev + 1;
      });
    }, 400);

    return () => {
      clearInterval(progressTimer);
      clearInterval(fieldTimer);
    };
  }, [currentStep]);

  // Execution animation
  useEffect(() => {
    if (currentStep !== "execution") return;
    
    setExecutionProgress(0);
    
    const timer = setInterval(() => {
      setExecutionProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 5;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [currentStep]);

  // Add audit entries as steps complete
  useEffect(() => {
    const stepAuditMap: Partial<Record<ProcessingStep, AuditEntry>> = {
      trigger: {
        timestamp: "10:32:01 AM",
        action: "Invoice received via email",
        actor: "System",
        detail: "From: accounts@abcbuilding.com.au",
        icon: Mail,
      },
      extraction: {
        timestamp: "10:32:03 AM",
        action: "AI extraction completed",
        actor: "AI",
        detail: "98% average confidence score",
        icon: Scan,
      },
      context: {
        timestamp: "10:32:04 AM",
        action: "Context retrieved",
        actor: "AI",
        detail: "3 sources referenced",
        icon: Database,
      },
      recommendation: {
        timestamp: "10:32:05 AM",
        action: "Recommendation: Approval required",
        actor: "AI",
        detail: "Amount exceeds auto-approval threshold",
        icon: Brain,
      },
    };

    const entry = stepAuditMap[currentStep];
    if (entry && !auditEntries.find(e => e.action === entry.action)) {
      setAuditEntries(prev => [...prev, entry]);
    }
  }, [currentStep]);

  const handleNextStep = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  }, [currentStepIndex]);

  const handlePrevStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  }, [currentStepIndex]);

  const handleDecision = (decision: "approve" | "delegate" | "reject") => {
    setUserDecision(decision);
    
    const decisionLabels = {
      approve: "Approved by Finance Manager",
      delegate: "Delegated to Senior Finance Officer",
      reject: "Rejected - Query sent to supplier",
    };
    
    setAuditEntries(prev => [...prev, {
      timestamp: "10:32:15 AM",
      action: decisionLabels[decision],
      actor: "Human",
      detail: "Sarah Mitchell (CFO)",
      icon: User,
    }]);

    if (decision === "approve") {
      setTimeout(() => setCurrentStep("execution"), 500);
    }
  };

  const handleReset = () => {
    setCurrentStep("trigger");
    setIsAutoPlay(false);
    setExtractionProgress(0);
    setVisibleFields(0);
    setUserDecision(null);
    setExecutionProgress(0);
    setProcessingTime(0);
    setAuditEntries([]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return "text-emerald-500";
    if (confidence >= 80) return "text-amber-500";
    return "text-rose-500";
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "trigger":
        return <TriggerStep />;
      case "extraction":
        return (
          <ExtractionStep 
            progress={extractionProgress} 
            visibleFields={visibleFields} 
            fields={extractedFields}
            lineItems={sampleInvoice.lineItems}
            getConfidenceColor={getConfidenceColor}
          />
        );
      case "context":
        return <ContextStep sources={contextSources} />;
      case "recommendation":
        return <RecommendationStep invoice={sampleInvoice} />;
      case "decision":
        return (
          <DecisionStep 
            onDecision={handleDecision} 
            decision={userDecision}
          />
        );
      case "execution":
        return (
          <ExecutionStep 
            progress={executionProgress} 
            invoice={sampleInvoice}
          />
        );
      case "audit":
        return (
          <AuditStep 
            entries={auditEntries} 
            executionProgress={executionProgress}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[400px] sm:min-h-[600px] bg-gradient-to-br from-background via-background to-primary/5 rounded-xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border/50 p-2 sm:p-4">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-semibold text-foreground">AI Invoice Processing</h2>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">End-to-End AP Automation</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
              <span className="font-mono text-foreground">{formatTime(processingTime)}</span>
            </div>
            <Badge variant="outline" className="font-mono text-[10px] sm:text-xs px-1.5 sm:px-2">
              {currentStepIndex + 1}/{STEPS.length}
            </Badge>
          </div>
        </div>

        {/* Step Progress Indicator */}
        <div className="relative group">
          {/* Left Arrow */}
          <button
            onClick={() => scrollSteps("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center bg-card/90 border border-border rounded-full shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-muted"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          <div 
            ref={stepsScrollRef}
            className="overflow-x-auto scrollbar-hide px-6 sm:px-0"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex items-center justify-between relative min-w-[480px] sm:min-w-0">
              {/* Progress Line */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
              <div 
                className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
              />
              
              {STEPS.map((step, index) => {
                const isActive = index === currentStepIndex;
                const isComplete = index < currentStepIndex;
                const Icon = step.icon;
                
                return (
                  <button
                    key={step.id}
                    onClick={() => index <= currentStepIndex && setCurrentStep(step.id)}
                    className={cn(
                      "relative z-10 flex flex-col items-center gap-1 transition-all",
                      index <= currentStepIndex ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                      isActive && "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110",
                      isComplete && "bg-primary text-primary-foreground",
                      !isActive && !isComplete && "bg-muted text-muted-foreground"
                    )}>
                      {isComplete ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <span className={cn(
                      "text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scrollSteps("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center bg-card/90 border border-border rounded-full shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-muted"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 sm:p-6 min-h-[280px] sm:min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Controls */}
      <div className="bg-card/80 backdrop-blur-sm border-t border-border/50 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            className="gap-1 sm:gap-2 px-2 sm:px-3"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1 sm:gap-2 px-2 sm:px-3"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              disabled={currentStep === "decision" || currentStep === "audit"}
              className="gap-1 sm:gap-2 px-2 sm:px-3"
            >
              {isAutoPlay ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span className="hidden sm:inline">Auto-Play</span>
                </>
              )}
            </Button>
          </div>

          <Button
            variant="cta"
            size="sm"
            onClick={handleNextStep}
            disabled={currentStepIndex === STEPS.length - 1 || (currentStep === "decision" && !userDecision)}
            className="gap-1 sm:gap-2 px-2 sm:px-3"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Step 1: Trigger
function TriggerStep() {
  return (
    <div className="flex flex-col items-center justify-center py-4 sm:py-8 gap-4 sm:gap-6">
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative"
      >
        <div className="p-4 sm:p-6 bg-gradient-to-br from-sky-500/10 to-blue-500/10 rounded-xl sm:rounded-2xl border border-sky-500/20">
          <Mail className="w-10 h-10 sm:w-16 sm:h-16 text-sky-500" />
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 p-1.5 sm:p-2 bg-emerald-500 rounded-full"
        >
          <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center space-y-1 sm:space-y-2"
      >
        <Badge className="bg-sky-500/10 text-sky-600 border-sky-500/20 text-[10px] sm:text-xs">
          Trigger: New Invoice Received
        </Badge>
        <h3 className="text-base sm:text-xl font-semibold text-foreground">Invoice Received via Email</h3>
        <p className="text-xs sm:text-base text-muted-foreground">From: accounts@abcbuilding.com.au</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card rounded-lg sm:rounded-xl border border-border/50 p-3 sm:p-4 w-full max-w-md"
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm sm:text-base font-medium text-foreground">INV-2025-00892.pdf</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">245 KB • PDF Document</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
            <span className="text-foreground truncate">ABC Building Supplies</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
            <span className="text-foreground font-medium">$13,695.00</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Hash className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
            <span className="text-foreground truncate">INV-2025-00892</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
            <span className="text-foreground truncate">Due: Jan 31</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Step 2: AI Extraction
function ExtractionStep({ 
  progress, 
  visibleFields, 
  fields,
  lineItems,
  getConfidenceColor 
}: { 
  progress: number; 
  visibleFields: number; 
  fields: ExtractedField[];
  lineItems: LineItem[];
  getConfidenceColor: (n: number) => string;
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-3 sm:gap-6">
      {/* Left: Invoice with scanning animation */}
      <div className="relative">
        <div className="bg-card rounded-lg sm:rounded-xl border border-border/50 p-3 sm:p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <h4 className="text-sm sm:text-base font-medium text-foreground flex items-center gap-1.5 sm:gap-2">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Invoice Document
            </h4>
            <Badge variant="outline" className="font-mono text-[10px] sm:text-xs">
              {progress}%
            </Badge>
          </div>
          
          {/* Scanning line animation */}
          <div className="relative bg-muted/30 rounded-lg p-2 sm:p-4 min-h-[160px] sm:min-h-[280px]">
            <motion.div
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent"
              initial={{ top: 0 }}
              animate={{ top: progress < 100 ? `${progress}%` : "100%" }}
              transition={{ duration: 0.1 }}
            />
            
            {/* Simulated invoice content */}
            <div className="space-y-2 sm:space-y-3 text-[10px] sm:text-sm opacity-60">
              <div className="flex justify-between">
                <span className="font-bold truncate">ABC Building Supplies</span>
                <span>TAX INVOICE</span>
              </div>
              <div className="text-[10px] sm:text-xs">ABN: 12 345 678 901</div>
              <div className="border-t border-border/30 pt-1.5 sm:pt-2 mt-1.5 sm:mt-2 hidden sm:block">
                <p className="text-xs">Invoice: INV-2025-00892</p>
                <p className="text-xs">Date: Jan 2, 2025</p>
              </div>
              <div className="border-t border-border/30 pt-1.5 sm:pt-2 space-y-0.5 sm:space-y-1">
                {lineItems.slice(0, 2).map((item, i) => (
                  <div key={i} className="flex justify-between text-[10px] sm:text-xs">
                    <span className="truncate max-w-[60%]">{item.description}</span>
                    <span className="tabular-nums">${item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="text-[10px] sm:text-xs text-muted-foreground sm:hidden">+ {lineItems.length - 2} more items</div>
              </div>
              <div className="border-t border-border/30 pt-1.5 sm:pt-2 space-y-0.5 sm:space-y-1">
                <div className="flex justify-between font-bold text-[10px] sm:text-sm">
                  <span>TOTAL</span>
                  <span className="tabular-nums">$13,695.00</span>
                </div>
              </div>
            </div>
          </div>

          <Progress value={progress} className="mt-2 sm:mt-4 h-1.5 sm:h-2" />
        </div>
      </div>

      {/* Right: Extracted fields */}
      <div className="space-y-2 sm:space-y-4">
        <h4 className="text-sm sm:text-base font-medium text-foreground flex items-center gap-1.5 sm:gap-2">
          <Scan className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-500" />
          AI Extracted Data
        </h4>
        
        <div className="space-y-1.5 sm:space-y-2 max-h-[200px] sm:max-h-none overflow-y-auto">
          {fields.slice(0, 6).map((field, index) => {
            const Icon = field.icon;
            return (
              <motion.div
                key={field.field}
                initial={{ opacity: 0, x: 20 }}
                animate={{ 
                  opacity: index < visibleFields ? 1 : 0,
                  x: index < visibleFields ? 0 : 20
                }}
                className="flex items-center justify-between bg-card rounded-lg border border-border/50 p-2 sm:p-3"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="p-1 sm:p-1.5 bg-violet-500/10 rounded shrink-0">
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-violet-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{field.field}</p>
                    <p className="text-xs sm:text-base font-medium text-foreground truncate">{field.value}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <span className={cn("text-[10px] sm:text-sm font-mono", getConfidenceColor(field.confidence))}>
                    {field.confidence}%
                  </span>
                  <CheckCircle className={cn("w-3 h-3 sm:w-4 sm:h-4", getConfidenceColor(field.confidence))} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Step 3: Context Retrieval
function ContextStep({ sources }: { sources: ContextSource[] }) {
  return (
    <div className="flex flex-col items-center py-3 sm:py-6 gap-3 sm:gap-6">
      <div className="text-center space-y-1 sm:space-y-2">
        <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 text-[10px] sm:text-xs">
          Context Retrieval
        </Badge>
        <h3 className="text-base sm:text-xl font-semibold text-foreground">Sources Referenced</h3>
        <p className="text-xs sm:text-base text-muted-foreground hidden sm:block">alfred ai retrieves relevant context for intelligent processing</p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full max-w-3xl">
        {sources.map((source, index) => {
          const Icon = source.icon;
          return (
            <motion.div
              key={source.name}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.2 }}
            >
              <Card className={cn(
                "relative overflow-hidden border sm:border-2 transition-all hover:shadow-lg",
                source.color === "sky" && "border-sky-500/30 hover:border-sky-500/50",
                source.color === "emerald" && "border-emerald-500/30 hover:border-emerald-500/50",
                source.color === "amber" && "border-amber-500/30 hover:border-amber-500/50"
              )}>
                <div className={cn(
                  "absolute inset-0 opacity-5",
                  source.color === "sky" && "bg-gradient-to-br from-sky-500 to-blue-500",
                  source.color === "emerald" && "bg-gradient-to-br from-emerald-500 to-green-500",
                  source.color === "amber" && "bg-gradient-to-br from-amber-500 to-orange-500"
                )} />
                <CardContent className="p-2 sm:pt-6 sm:p-6 relative">
                  <div className={cn(
                    "w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4",
                    source.color === "sky" && "bg-sky-500/10",
                    source.color === "emerald" && "bg-emerald-500/10",
                    source.color === "amber" && "bg-amber-500/10"
                  )}>
                    <Icon className={cn(
                      "w-4 h-4 sm:w-6 sm:h-6",
                      source.color === "sky" && "text-sky-500",
                      source.color === "emerald" && "text-emerald-500",
                      source.color === "amber" && "text-amber-500"
                    )} />
                  </div>
                  <h4 className="text-xs sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1 truncate">{source.name}</h4>
                  <p className="text-[10px] sm:text-sm text-muted-foreground line-clamp-2">{source.summary}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Connection lines visual */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm text-muted-foreground"
      >
        <Database className="w-3 h-3 sm:w-4 sm:h-4" />
        <span>3 sources combined</span>
      </motion.div>
    </div>
  );
}

// Step 4: AI Recommendation
function RecommendationStep({ invoice }: { invoice: typeof sampleInvoice }) {
  const exceedsThreshold = invoice.total > 10000;
  
  return (
    <div className="flex flex-col items-center py-3 sm:py-6 gap-3 sm:gap-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          "p-4 sm:p-6 rounded-xl sm:rounded-2xl border sm:border-2",
          exceedsThreshold 
            ? "bg-amber-500/10 border-amber-500/30" 
            : "bg-emerald-500/10 border-emerald-500/30"
        )}
      >
        <Brain className={cn(
          "w-8 h-8 sm:w-12 sm:h-12",
          exceedsThreshold ? "text-amber-500" : "text-emerald-500"
        )} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center space-y-1 sm:space-y-2"
      >
        <Badge className={cn(
          "text-[10px] sm:text-xs",
          exceedsThreshold
            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
        )}>
          AI Recommendation
        </Badge>
        <h3 className="text-base sm:text-xl font-semibold text-foreground">
          {exceedsThreshold 
            ? "Approval Required"
            : "Auto-Approve Recommended"
          }
        </h3>
        <p className="text-xs sm:text-base text-muted-foreground max-w-md px-2">
          {exceedsThreshold
            ? `Invoice ($${invoice.total.toLocaleString()}) exceeds threshold ($10,000)`
            : "Invoice meets all criteria for automatic approval"
          }
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card rounded-lg sm:rounded-xl border border-border/50 p-3 sm:p-4 w-full max-w-lg"
      >
        <h4 className="text-sm sm:text-base font-medium text-foreground mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          AI Analysis
        </h4>
        <div className="space-y-1.5 sm:space-y-2">
          {[
            { text: `Total ($${invoice.total.toLocaleString()}) ${exceedsThreshold ? "exceeds" : "within"} limit`, status: !exceedsThreshold },
            { text: "Clean payment history (12 invoices)", status: true },
            { text: "No duplicate invoice detected", status: true },
            { text: "ABN verified with ATO database", status: true },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm"
            >
              <CheckCircle className={cn(
                "w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 shrink-0",
                item.status ? "text-emerald-500" : "text-amber-500"
              )} />
              <span className="text-foreground">{item.text}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Step 5: Human Decision
function DecisionStep({ 
  onDecision, 
  decision 
}: { 
  onDecision: (d: "approve" | "delegate" | "reject") => void;
  decision: "approve" | "delegate" | "reject" | null;
}) {
  return (
    <div className="flex flex-col items-center py-3 sm:py-6 gap-3 sm:gap-6">
      <div className="text-center space-y-1 sm:space-y-2">
        <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20 text-[10px] sm:text-xs">
          Human-in-the-Loop
        </Badge>
        <h3 className="text-base sm:text-xl font-semibold text-foreground">Your Decision Required</h3>
        <p className="text-xs sm:text-base text-muted-foreground max-w-md px-2">
          AI recommends, <span className="font-medium text-foreground">humans decide</span>.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 w-full max-w-xl">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            size="lg"
            onClick={() => onDecision("approve")}
            disabled={decision !== null}
            className={cn(
              "gap-2 sm:gap-3 h-auto py-2 sm:py-4 px-3 sm:px-6 flex-col items-start min-w-[100px] sm:min-w-[180px]",
              decision === "approve" 
                ? "bg-emerald-500 hover:bg-emerald-500 text-white"
                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 border border-emerald-500/30"
            )}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-base font-semibold">Approve</span>
            </div>
            <span className="text-[10px] sm:text-xs opacity-80 font-normal hidden sm:block">Post to accounting</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            size="lg"
            onClick={() => onDecision("delegate")}
            disabled={decision !== null}
            className={cn(
              "gap-2 sm:gap-3 h-auto py-2 sm:py-4 px-3 sm:px-6 flex-col items-start min-w-[100px] sm:min-w-[180px]",
              decision === "delegate"
                ? "bg-blue-500 hover:bg-blue-500 text-white"
                : "bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 border border-blue-500/30"
            )}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Forward className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-base font-semibold">Delegate</span>
            </div>
            <span className="text-[10px] sm:text-xs opacity-80 font-normal hidden sm:block">Send to finance</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            size="lg"
            onClick={() => onDecision("reject")}
            disabled={decision !== null}
            className={cn(
              "gap-2 sm:gap-3 h-auto py-2 sm:py-4 px-3 sm:px-6 flex-col items-start min-w-[100px] sm:min-w-[180px]",
              decision === "reject"
                ? "bg-rose-500 hover:bg-rose-500 text-white"
                : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 border border-rose-500/30"
            )}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-base font-semibold">Reject</span>
            </div>
            <span className="text-[10px] sm:text-xs opacity-80 font-normal hidden sm:block">Query supplier</span>
          </Button>
        </motion.div>
      </div>

      {decision && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm text-muted-foreground"
        >
          <User className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Decision by Sarah Mitchell</span>
          {decision === "approve" && (
            <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px] sm:text-xs">
              Executing...
            </Badge>
          )}
        </motion.div>
      )}
    </div>
  );
}

// Step 6: Execution
function ExecutionStep({ 
  progress, 
  invoice 
}: { 
  progress: number;
  invoice: typeof sampleInvoice;
}) {
  const isComplete = progress >= 100;
  
  return (
    <div className="flex flex-col items-center py-3 sm:py-6 gap-3 sm:gap-6">
      <div className="text-center space-y-1 sm:space-y-2">
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] sm:text-xs">
          Execution
        </Badge>
        <h3 className="text-base sm:text-xl font-semibold text-foreground">
          {isComplete ? "Invoice Posted" : "Posting to Accounting"}
        </h3>
      </div>

      {/* Accounting system visual */}
      <div className="bg-card rounded-lg sm:rounded-xl border border-border/50 p-3 sm:p-6 w-full max-w-md">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <img 
            src="/src/assets/logos/xero.png" 
            alt="Xero" 
            className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div>
            <p className="text-sm sm:text-base font-medium text-foreground">Xero Accounting</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Connected via API</p>
          </div>
        </div>

        <Progress value={progress} className="h-2 sm:h-3 mb-3 sm:mb-4" />

        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2 sm:space-y-3"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-500 mb-2 sm:mb-4">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base font-medium">Posted Successfully</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                <div>
                  <p className="text-muted-foreground text-[10px] sm:text-xs">Reference</p>
                  <p className="font-mono text-foreground text-xs sm:text-sm">AP-2025-001234</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] sm:text-xs">Amount</p>
                  <p className="font-medium text-foreground text-xs sm:text-sm">${invoice.total.toLocaleString()}</p>
                </div>
              </div>

              <div className="pt-2 sm:pt-3 border-t border-border/50">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2">GL Codes</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-[10px] sm:text-xs font-mono px-1.5">5010</Badge>
                  <Badge variant="outline" className="text-[10px] sm:text-xs font-mono px-1.5">5020</Badge>
                  <Badge variant="outline" className="text-[10px] sm:text-xs font-mono px-1.5">6010</Badge>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Step 7: Audit Trail
function AuditStep({ 
  entries, 
  executionProgress 
}: { 
  entries: AuditEntry[];
  executionProgress: number;
}) {
  const allEntries = [
    ...entries,
    ...(executionProgress >= 100 ? [{
      timestamp: "10:32:18 AM",
      action: "Posted to Xero",
      actor: "System" as const,
      detail: "Ref: AP-2025-001234",
      icon: FileCheck,
    }] : [])
  ];

  return (
    <div className="py-3 sm:py-6 space-y-3 sm:space-y-6">
      <div className="text-center space-y-1 sm:space-y-2">
        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] sm:text-xs">
          Complete Audit Trail
        </Badge>
        <h3 className="text-base sm:text-xl font-semibold text-foreground">Full Traceability</h3>
        <p className="text-xs sm:text-base text-muted-foreground hidden sm:block">Every action logged for governance</p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-2.5 sm:left-4 top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-2 sm:space-y-4 max-h-[180px] sm:max-h-none overflow-y-auto">
            {allEntries.map((entry, index) => {
              const Icon = entry.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex gap-2 sm:gap-4 pl-7 sm:pl-10"
                >
                  <div className={cn(
                    "absolute left-0.5 sm:left-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center",
                    entry.actor === "AI" && "bg-violet-500",
                    entry.actor === "Human" && "bg-emerald-500",
                    entry.actor === "System" && "bg-sky-500"
                  )}>
                    <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                  </div>
                  
                  <div className="flex-1 bg-card rounded-lg border border-border/50 p-2 sm:p-3">
                    <div className="flex items-start justify-between gap-1 sm:gap-2">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-base font-medium text-foreground truncate">{entry.action}</p>
                        <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{entry.detail}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] sm:text-xs text-muted-foreground font-mono">{entry.timestamp}</p>
                        <Badge variant="outline" className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 px-1 sm:px-2">
                          {entry.actor}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Governance badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 sm:mt-8 flex flex-wrap justify-center gap-2 sm:gap-3"
        >
          <Badge className="bg-blue-500/10 text-blue-600 gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs">
            <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4" />
            Traceable
          </Badge>
          <Badge className="bg-emerald-500/10 text-emerald-600 gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs">
            <FileCheck className="w-3 h-3 sm:w-4 sm:h-4" />
            Auditable
          </Badge>
          <Badge className="bg-violet-500/10 text-violet-600 gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs">
            <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
            Compliant
          </Badge>
        </motion.div>

        {/* Summary message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 sm:mt-8 text-center p-3 sm:p-6 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-lg sm:rounded-xl border border-primary/20"
        >
          <p className="text-sm sm:text-lg font-medium text-foreground">
            Processed in <span className="text-primary">minutes</span>, not days
          </p>
          <p className="text-xs sm:text-base text-muted-foreground mt-0.5 sm:mt-1">
            AI speed, human control, full auditability.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
