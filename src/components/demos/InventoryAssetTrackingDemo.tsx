import { useState, useEffect, useCallback } from "react";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { InlineDemoSpeedControl } from "@/components/demos/shared/InlineDemoSpeedControl";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  Package, QrCode, MapPin, Clock, Database, Brain, CheckCircle, 
  AlertTriangle, Play, Pause, RotateCcw, ChevronRight, ChevronLeft, 
  User, Zap, Shield, Wrench, BarChart3, History, Truck, Camera,
  Building2, Calendar, Hash, FileText, Users, ArrowRight, 
  RefreshCw, XCircle, Forward, ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ProcessingStep = "trigger" | "validation" | "context" | "recommendation" | "decision" | "execution" | "anomaly" | "reporting" | "audit";

interface AssetData {
  name: string;
  assetId: string;
  serialNumber: string;
  category: string;
  project: string;
  location: string;
  assignedTo: string;
  lastMovement: string;
  condition: string;
  maintenanceDue: string;
  value: string;
}

interface AssetHistoryEntry {
  date: string;
  action: string;
  location: string;
  person: string;
}

interface AuditEntry {
  timestamp: string;
  action: string;
  actor: "AI" | "Human" | "System";
  detail: string;
  icon: React.ElementType;
}

const STEPS: { id: ProcessingStep; label: string; icon: React.ElementType; color: string }[] = [
  { id: "trigger", label: "Trigger", icon: Package, color: "sky" },
  { id: "validation", label: "Validation", icon: QrCode, color: "violet" },
  { id: "context", label: "Context", icon: Database, color: "indigo" },
  { id: "recommendation", label: "AI Insight", icon: Brain, color: "amber" },
  { id: "decision", label: "Decision", icon: User, color: "slate" },
  { id: "execution", label: "Execution", icon: Zap, color: "emerald" },
  { id: "anomaly", label: "Anomalies", icon: AlertTriangle, color: "rose" },
  { id: "reporting", label: "Reporting", icon: BarChart3, color: "cyan" },
  { id: "audit", label: "Audit Trail", icon: Shield, color: "blue" },
];

const sampleAsset: AssetData = {
  name: "Hilti TE 60-ATC Rotary Hammer",
  assetId: "AST-2025-00147",
  serialNumber: "SN-HLT-89234",
  category: "Power Tools",
  project: "Lakewood Tower Fitout",
  location: "Site B - Level 3",
  assignedTo: "John Morrison",
  lastMovement: "Checked out: Jan 2, 2025",
  condition: "Good",
  maintenanceDue: "Feb 15, 2025",
  value: "$2,450.00",
};

const assetHistory: AssetHistoryEntry[] = [
  { date: "Jan 2, 2025", action: "Checked Out", location: "Site B - Level 3", person: "John Morrison" },
  { date: "Dec 28, 2024", action: "Returned", location: "Central Warehouse", person: "Jane Smith" },
  { date: "Dec 15, 2024", action: "Maintenance", location: "Service Center", person: "Tech Team" },
  { date: "Dec 10, 2024", action: "Checked Out", location: "Site A - Ground Floor", person: "Jane Smith" },
];

export default function InventoryAssetTrackingDemo() {
  const { applySpeed } = useDemoSpeed();
  const [currentStep, setCurrentStep] = useState<ProcessingStep>("trigger");
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [userDecision, setUserDecision] = useState<"accept" | "delegate" | "reject" | null>(null);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

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
      validation: 3500,
      context: 3000,
      recommendation: 3000,
      decision: 5000,
      execution: 3500,
      anomaly: 3000,
      reporting: 3500,
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

  // Scan animation
  useEffect(() => {
    if (currentStep !== "validation") return;
    
    setScanProgress(0);
    
    const timer = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 3;
      });
    }, 50);

    return () => clearInterval(timer);
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
        timestamp: "09:15:01 AM",
        action: "Asset movement detected",
        actor: "System",
        detail: "QR scan at Site B entrance",
        icon: Package,
      },
      validation: {
        timestamp: "09:15:03 AM",
        action: "AI validation completed",
        actor: "AI",
        detail: "Asset verified with 99% confidence",
        icon: QrCode,
      },
      context: {
        timestamp: "09:15:04 AM",
        action: "Context retrieved",
        actor: "AI",
        detail: "4 data sources referenced",
        icon: Database,
      },
      recommendation: {
        timestamp: "09:15:05 AM",
        action: "AI recommendation generated",
        actor: "AI",
        detail: "Maintenance due in 44 days",
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

  const handleDecision = (decision: "accept" | "delegate" | "reject") => {
    setUserDecision(decision);
    
    const decisionLabels = {
      accept: "Accepted responsibility for asset",
      delegate: "Delegated to Team Lead",
      reject: "Flagged discrepancy for review",
    };
    
    setAuditEntries(prev => [...prev, {
      timestamp: "09:15:15 AM",
      action: decisionLabels[decision],
      actor: "Human",
      detail: "John Morrison (Site Supervisor)",
      icon: User,
    }]);

    if (decision === "accept" || decision === "delegate") {
      setTimeout(() => setCurrentStep("execution"), 500);
    }
  };

  const handleReset = () => {
    setCurrentStep("trigger");
    setIsAutoPlay(false);
    setScanProgress(0);
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

  const renderStepContent = () => {
    switch (currentStep) {
      case "trigger":
        return <TriggerStep asset={sampleAsset} />;
      case "validation":
        return <ValidationStep progress={scanProgress} asset={sampleAsset} />;
      case "context":
        return <ContextStep asset={sampleAsset} history={assetHistory} />;
      case "recommendation":
        return <RecommendationStep asset={sampleAsset} />;
      case "decision":
        return <DecisionStep onDecision={handleDecision} decision={userDecision} asset={sampleAsset} />;
      case "execution":
        return <ExecutionStep progress={executionProgress} asset={sampleAsset} decision={userDecision} />;
      case "anomaly":
        return <AnomalyStep />;
      case "reporting":
        return <ReportingStep />;
      case "audit":
        return <AuditStep entries={auditEntries} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[400px] sm:min-h-[600px] bg-gradient-to-br from-background via-background to-primary/5 rounded-xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border/50 p-2 sm:p-4">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shrink-0">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-semibold text-foreground truncate">Inventory & Asset Tracking</h2>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Real-time Asset Visibility & Control</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-foreground">{formatTime(processingTime)}</span>
            </div>
            <Badge variant="outline" className="font-mono text-xs px-1.5 py-0.5 sm:px-2.5 sm:py-0.5">
              {currentStepIndex + 1}/{STEPS.length}
            </Badge>
          </div>
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center justify-between relative overflow-x-auto pb-1 sm:pb-2 scrollbar-hide">
          {/* Progress Line */}
          <div className="absolute top-3 sm:top-4 left-0 right-0 h-0.5 bg-border" />
          <div 
            className="absolute top-3 sm:top-4 left-0 h-0.5 bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
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
                  "relative z-10 flex flex-col items-center gap-0.5 sm:gap-1 transition-all min-w-[36px] sm:min-w-[60px]",
                  index <= currentStepIndex ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                )}
              >
                <div className={cn(
                  "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300",
                  isActive && "bg-primary text-primary-foreground ring-2 sm:ring-4 ring-primary/20 scale-110",
                  isComplete && "bg-primary text-primary-foreground",
                  !isActive && !isComplete && "bg-muted text-muted-foreground"
                )}>
                  {isComplete ? (
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : (
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] sm:text-xs font-medium transition-colors hidden sm:block",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 sm:p-6 min-h-[250px] sm:min-h-[400px]">
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
      <div className="bg-card/80 backdrop-blur-sm border-t border-border/50 p-2 sm:p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            className="gap-1 sm:gap-2 h-8 px-2 sm:px-3"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1 sm:gap-2 h-8 px-2 sm:px-3"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              disabled={currentStep === "decision" || currentStep === "audit"}
              className="gap-1 sm:gap-2 h-8 px-2 sm:px-3"
            >
              {isAutoPlay ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span className="hidden sm:inline">Auto</span>
                </>
              )}
            </Button>
          </div>

          <Button
            variant="cta"
            size="sm"
            onClick={handleNextStep}
            disabled={currentStepIndex === STEPS.length - 1 || (currentStep === "decision" && !userDecision)}
            className="gap-1 sm:gap-2 h-8 px-2 sm:px-3"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Outcome Message */}
      {currentStep === "audit" && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-t border-emerald-500/20 p-2 sm:p-4 text-center"
        >
          <p className="text-xs sm:text-sm text-emerald-400 font-medium">
            Every asset accounted for — fewer losses, better utilisation.
          </p>
        </motion.div>
      )}
    </div>
  );
}

// Step 1: Trigger
function TriggerStep({ asset }: { asset: AssetData }) {
  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
        <div className="p-1.5 sm:p-2 bg-sky-500/20 rounded-lg shrink-0">
          <Package className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">Asset Movement Detected</h3>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">New event triggered at Site B entrance</p>
        </div>
        <Badge className="ml-auto bg-sky-500/20 text-sky-400 border-sky-500/30 text-xs px-1.5 py-0.5 shrink-0">
          Trigger
        </Badge>
      </div>

      <Card className="border-sky-500/30 bg-gradient-to-br from-sky-500/5 to-transparent">
        <CardContent className="p-3 sm:pt-6 sm:p-6">
          <div className="flex items-start gap-2 sm:gap-4">
            <div className="w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500/20 to-amber-500/10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 sm:w-8 sm:h-8 text-orange-400" />
            </div>
            <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
              <div>
                <h4 className="text-sm sm:text-lg font-semibold text-foreground truncate">Hilti TE 60-ATC Hammer</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">{asset.category}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <Hash className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground shrink-0">ID:</span>
                  <span className="font-mono text-foreground truncate">{asset.assetId}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground shrink-0">Loc:</span>
                  <span className="text-foreground truncate">{asset.location}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 hidden sm:flex">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Serial:</span>
                  <span className="font-mono text-foreground truncate">{asset.serialNumber}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground shrink-0">To:</span>
                  <span className="text-foreground truncate">{asset.assignedTo}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 p-2 sm:p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
        <span className="text-xs sm:text-sm text-amber-300 truncate">
          <strong>Checked Out</strong> — awaiting validation
        </span>
      </div>
    </div>
  );
}

// Step 2: Validation
function ValidationStep({ progress, asset }: { progress: number; asset: AssetData }) {
  const validationMethods = [
    { method: "QR Code Scan", shortMethod: "QR Scan", confidence: 99, icon: QrCode, status: progress > 30 },
    { method: "Photo Verification", shortMethod: "Photo", confidence: 94, icon: Camera, status: progress > 60 },
    { method: "Manual Confirmation", shortMethod: "Manual", confidence: 100, icon: CheckCircle, status: progress > 90 },
  ];

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
        <div className="p-1.5 sm:p-2 bg-violet-500/20 rounded-lg shrink-0">
          <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-semibold text-foreground">AI Recognition</h3>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Verifying asset identity and condition</p>
        </div>
        <Badge className="ml-auto bg-violet-500/20 text-violet-400 border-violet-500/30 text-xs px-1.5 py-0.5 shrink-0">
          Validating
        </Badge>
      </div>

      {/* Scanning Animation */}
      <Card className="border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-transparent">
        <CardContent className="p-3 sm:pt-6 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="relative w-16 h-16 sm:w-24 sm:h-24 bg-black/50 rounded-lg sm:rounded-xl overflow-hidden shrink-0">
              <div className="absolute inset-0 flex items-center justify-center">
                <QrCode className="w-8 h-8 sm:w-12 sm:h-12 text-violet-400/50" />
              </div>
              <motion.div 
                className="absolute left-0 right-0 h-0.5 sm:h-1 bg-violet-500 shadow-lg shadow-violet-500/50"
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-xs sm:text-sm font-medium text-foreground">Scanning...</span>
                <span className="text-xs sm:text-sm font-mono text-violet-400">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5 sm:h-2" />
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {validationMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <motion.div
                  key={method.method}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: method.status ? 1 : 0.4, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="flex items-center justify-between p-2 sm:p-3 bg-background/50 rounded-lg"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", method.status ? "text-violet-400" : "text-muted-foreground")} />
                    <span className="text-xs sm:text-sm text-foreground">
                      <span className="sm:hidden">{method.shortMethod}</span>
                      <span className="hidden sm:inline">{method.method}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {method.status && (
                      <>
                        <span className="text-[10px] sm:text-xs text-emerald-400">{method.confidence}%</span>
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {progress >= 100 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-2 sm:p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
        >
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm text-emerald-300 truncate">
            <strong>Verified</strong> — ready for context
          </span>
        </motion.div>
      )}
    </div>
  );
}

// Step 3: Context
function ContextStep({ asset, history }: { asset: AssetData; history: AssetHistoryEntry[] }) {
  const contextSources = [
    { name: "Asset History", shortName: "History", icon: History, summary: `${history.length} movements`, color: "emerald" },
    { name: "Maintenance Records", shortName: "Maintenance", icon: Wrench, summary: "Dec 15, 2024", color: "amber" },
    { name: "Project Allocation", shortName: "Project", icon: Building2, summary: "Lakewood Fitout", color: "blue" },
    { name: "Assigned Personnel", shortName: "Assigned", icon: Users, summary: asset.assignedTo, color: "violet" },
  ];

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
        <div className="p-1.5 sm:p-2 bg-indigo-500/20 rounded-lg shrink-0">
          <Database className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-foreground">Context Retrieved</h3>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Gathering info from connected systems</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {contextSources.map((source, index) => {
          const Icon = source.icon;
          return (
            <motion.div
              key={source.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
            >
              <Card className={cn("border-border/50 hover:border-primary/30 transition-colors")}>
                <CardContent className="p-2 sm:pt-4 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className={cn("p-1.5 sm:p-2 rounded-lg shrink-0", `bg-${source.color}-500/20`)}>
                      <Icon className={cn("w-3 h-3 sm:w-5 sm:h-5", `text-${source.color}-400`)} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-medium text-foreground truncate">
                        <span className="sm:hidden">{source.shortName}</span>
                        <span className="hidden sm:inline">{source.name}</span>
                      </h4>
                      <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{source.summary}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="border-indigo-500/30">
        <CardHeader className="p-2 sm:p-4 pb-1 sm:pb-2">
          <CardTitle className="text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
            <History className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400" />
            <span className="sm:hidden">History</span>
            <span className="hidden sm:inline">Recent Movement History</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 pt-0 sm:pt-0">
          <div className="space-y-1.5 sm:space-y-2 max-h-[120px] sm:max-h-none overflow-y-auto">
            {history.slice(0, 3).map((entry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center justify-between p-1.5 sm:p-2 bg-background/50 rounded-lg text-xs sm:text-sm"
              >
                <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                  <span className="text-muted-foreground text-[10px] sm:text-sm shrink-0">{entry.date.replace(", 2024", "").replace(", 2025", "")}</span>
                  <Badge variant="outline" className="text-[10px] sm:text-xs px-1 py-0">{entry.action}</Badge>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground hidden sm:flex">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate max-w-[100px]">{entry.location}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Step 4: Recommendation
function RecommendationStep({ asset }: { asset: AssetData }) {
  const recommendations = [
    { title: "Available for Assignment", shortTitle: "Available", icon: CheckCircle, type: "success", detail: "Good condition, ready for use", shortDetail: "Ready for use" },
    { title: "Maintenance Due Soon", shortTitle: "Maintenance", icon: Wrench, type: "warning", detail: `Due ${asset.maintenanceDue} — 44 days`, shortDetail: "44 days remaining" },
    { title: "Utilisation Optimal", shortTitle: "Utilisation", icon: BarChart3, type: "info", detail: "78% utilisation rate — above average", shortDetail: "78% rate" },
  ];

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
        <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg shrink-0">
          <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-foreground">AI Recommendations</h3>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Intelligent insights based on context</p>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-4">
        {recommendations.map((rec, index) => {
          const Icon = rec.icon;
          const colorMap = {
            success: "emerald",
            warning: "amber",
            info: "blue",
          };
          const color = colorMap[rec.type as keyof typeof colorMap];
          
          return (
            <motion.div
              key={rec.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <Card className={cn(`border-${color}-500/30 bg-gradient-to-r from-${color}-500/5 to-transparent`)}>
                <CardContent className="p-2 sm:pt-4 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className={cn("p-1.5 sm:p-2 rounded-lg shrink-0", `bg-${color}-500/20`)}>
                      <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", `text-${color}-400`)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-medium text-foreground">
                        <span className="sm:hidden">{rec.shortTitle}</span>
                        <span className="hidden sm:inline">{rec.title}</span>
                      </h4>
                      <p className="text-[10px] sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                        <span className="sm:hidden">{rec.shortDetail}</span>
                        <span className="hidden sm:inline">{rec.detail}</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="p-2 sm:p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <p className="text-[10px] sm:text-sm text-muted-foreground text-center">
          <Brain className="w-3 h-3 sm:w-4 sm:h-4 inline-block mr-1 sm:mr-2 text-primary" />
          AI recommends. Humans confirm.
        </p>
      </div>
    </div>
  );
}

// Step 5: Decision
function DecisionStep({ 
  onDecision, 
  decision,
  asset 
}: { 
  onDecision: (d: "accept" | "delegate" | "reject") => void; 
  decision: "accept" | "delegate" | "reject" | null;
  asset: AssetData;
}) {
  const options = [
    { 
      id: "accept" as const, 
      label: "Accept", 
      fullLabel: "Accept Responsibility",
      description: "Take ownership of this asset",
      icon: CheckCircle, 
      color: "emerald" 
    },
    { 
      id: "delegate" as const, 
      label: "Delegate", 
      fullLabel: "Delegate",
      description: "Assign to team member",
      icon: Forward, 
      color: "blue" 
    },
    { 
      id: "reject" as const, 
      label: "Flag", 
      fullLabel: "Flag Discrepancy",
      description: "Report an issue",
      icon: XCircle, 
      color: "rose" 
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
        <div className="p-1.5 sm:p-2 bg-slate-500/20 rounded-lg shrink-0">
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-semibold text-foreground">Accountability</h3>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Human-in-the-Loop — Choose action</p>
        </div>
        <Badge className="ml-auto bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs px-1.5 py-0.5 shrink-0">
          Action
        </Badge>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-2 sm:pt-4 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500/20 to-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4 sm:w-6 sm:h-6 text-orange-400" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-medium text-foreground truncate">Hilti TE 60-ATC</h4>
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">To: {asset.location}</p>
            </div>
          </div>

          <div className="grid gap-2 sm:gap-3">
            {options.map((option) => {
              const Icon = option.icon;
              const isSelected = decision === option.id;
              
              return (
                <motion.button
                  key={option.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onDecision(option.id)}
                  disabled={decision !== null}
                  className={cn(
                    "w-full p-2 sm:p-4 rounded-lg border text-left transition-all",
                    isSelected 
                      ? `border-${option.color}-500 bg-${option.color}-500/10` 
                      : "border-border hover:border-primary/50",
                    decision !== null && !isSelected && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={cn("p-1.5 sm:p-2 rounded-lg shrink-0", `bg-${option.color}-500/20`)}>
                      <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", `text-${option.color}-400`)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-medium text-foreground">
                        <span className="sm:hidden">{option.label}</span>
                        <span className="hidden sm:inline">{option.fullLabel}</span>
                      </h4>
                      <p className="text-[10px] sm:text-sm text-muted-foreground hidden sm:block">{option.description}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle className={cn("w-4 h-4 sm:w-5 sm:h-5 shrink-0", `text-${option.color}-400`)} />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Step 6: Execution
function ExecutionStep({ 
  progress, 
  asset,
  decision 
}: { 
  progress: number; 
  asset: AssetData;
  decision: "accept" | "delegate" | "reject" | null;
}) {
  const actions = [
    { label: "Asset location updated", shortLabel: "Location updated", done: progress > 20 },
    { label: "Usage logged against project", shortLabel: "Usage logged", done: progress > 40 },
    { label: "Inventory counts updated", shortLabel: "Inventory updated", done: progress > 60 },
    { label: "Maintenance schedule checked", shortLabel: "Maintenance checked", done: progress > 80 },
    { label: "Notifications sent", shortLabel: "Notified", done: progress >= 100 },
  ];

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
        <div className="p-1.5 sm:p-2 bg-emerald-500/20 rounded-lg shrink-0">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-foreground">Executing Updates</h3>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Updating connected systems</p>
        </div>
      </div>

      <Card className="border-emerald-500/30">
        <CardContent className="p-3 sm:pt-6 sm:p-6">
          <div className="space-y-2 sm:space-y-4">
            {actions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: action.done ? 1 : 0.4, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 sm:gap-3"
              >
                <div className={cn(
                  "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0",
                  action.done ? "bg-emerald-500" : "bg-muted"
                )}>
                  {action.done ? (
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  ) : (
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-muted-foreground/50" />
                  )}
                </div>
                <span className={cn(
                  "text-xs sm:text-sm",
                  action.done ? "text-foreground" : "text-muted-foreground"
                )}>
                  <span className="sm:hidden">{action.shortLabel}</span>
                  <span className="hidden sm:inline">{action.label}</span>
                </span>
              </motion.div>
            ))}
          </div>

          <div className="mt-3 sm:mt-6 pt-3 sm:pt-4 border-t border-border">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Status</p>
                <p className="text-[10px] sm:text-sm font-medium text-emerald-400">Checked Out</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Time</p>
                <p className="text-[10px] sm:text-sm font-mono text-foreground">09:15 AM</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Owner</p>
                <p className="text-[10px] sm:text-sm text-foreground truncate">J. Morrison</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Step 7: Anomaly Detection
function AnomalyStep() {
  const anomalies = [
    { title: "Overdue Return", shortTitle: "Overdue", severity: "warning", detail: "Excavator EXC-001 not returned — 2 days", shortDetail: "EXC-001 — 2 days late", icon: Clock },
    { title: "Inventory Discrepancy", shortTitle: "Discrepancy", severity: "error", detail: "Harness count: Expected 24, Found 22", shortDetail: "Expected 24, Found 22", icon: AlertTriangle },
    { title: "Duplicate Record", shortTitle: "Duplicate", severity: "info", detail: "AST-089 in two projects — verify", shortDetail: "AST-089 needs verify", icon: RefreshCw },
  ];

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
        <div className="p-1.5 sm:p-2 bg-rose-500/20 rounded-lg shrink-0">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-semibold text-foreground">Anomaly Detection</h3>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">AI-detected issues</p>
        </div>
        <Badge className="ml-auto bg-rose-500/20 text-rose-400 border-rose-500/30 text-xs px-1.5 py-0.5 shrink-0">
          3
        </Badge>
      </div>

      <div className="space-y-2 sm:space-y-4">
        {anomalies.map((anomaly, index) => {
          const Icon = anomaly.icon;
          const colorMap = {
            error: "rose",
            warning: "amber",
            info: "blue",
          };
          const color = colorMap[anomaly.severity as keyof typeof colorMap];
          
          return (
            <motion.div
              key={anomaly.title}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <Card className={cn(`border-${color}-500/30`)}>
                <CardContent className="p-2 sm:pt-4 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className={cn("p-1.5 sm:p-2 rounded-lg shrink-0", `bg-${color}-500/20`)}>
                      <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", `text-${color}-400`)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-medium text-foreground">
                          <span className="sm:hidden">{anomaly.shortTitle}</span>
                          <span className="hidden sm:inline">{anomaly.title}</span>
                        </h4>
                        <Badge variant="outline" className={cn("text-[10px] sm:text-xs px-1 py-0", `text-${color}-400 border-${color}-500/30`)}>
                          {anomaly.severity}
                        </Badge>
                      </div>
                      <p className="text-[10px] sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate">
                        <span className="sm:hidden">{anomaly.shortDetail}</span>
                        <span className="hidden sm:inline">{anomaly.detail}</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Step 8: Reporting
function ReportingStep() {
  const metrics = [
    { label: "Total Assets", shortLabel: "Assets", value: "1,247", change: "+12", icon: Package },
    { label: "Utilisation Rate", shortLabel: "Util.", value: "76%", change: "+4%", icon: BarChart3 },
    { label: "Overdue Items", shortLabel: "Overdue", value: "3", change: "-2", icon: Clock },
    { label: "Maintenance Due", shortLabel: "Maint.", value: "8", change: "", icon: Wrench },
  ];

  const locations = [
    { location: "Central Warehouse", shortLoc: "Warehouse", count: 423, percent: 34 },
    { location: "Site A - Tower", shortLoc: "Site A", count: 312, percent: 25 },
    { location: "Site B - Lakewood", shortLoc: "Site B", count: 287, percent: 23 },
    { location: "Other Locations", shortLoc: "Other", count: 225, percent: 18 },
  ];

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
        <div className="p-1.5 sm:p-2 bg-cyan-500/20 rounded-lg shrink-0">
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-foreground">Reporting</h3>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Executive-level insights</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-2 sm:pt-4 sm:p-4">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      <span className="sm:hidden">{metric.shortLabel}</span>
                      <span className="hidden sm:inline">{metric.label}</span>
                    </span>
                  </div>
                  <div className="flex items-end gap-1 sm:gap-2">
                    <span className="text-lg sm:text-2xl font-bold text-foreground tabular-nums">{metric.value}</span>
                    {metric.change && (
                      <span className={cn(
                        "text-[10px] sm:text-xs",
                        metric.change.startsWith("+") ? "text-emerald-400" : metric.change.startsWith("-") ? "text-rose-400" : "text-muted-foreground"
                      )}>
                        {metric.change}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="border-cyan-500/30">
        <CardHeader className="p-2 sm:p-4 pb-1 sm:pb-2">
          <CardTitle className="text-xs sm:text-sm">
            <span className="sm:hidden">Locations</span>
            <span className="hidden sm:inline">Asset Location Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 pt-0">
          <div className="space-y-2 sm:space-y-3 max-h-[140px] sm:max-h-none overflow-y-auto">
            {locations.map((loc) => (
              <div key={loc.location} className="space-y-0.5 sm:space-y-1">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-foreground truncate">
                    <span className="sm:hidden">{loc.shortLoc}</span>
                    <span className="hidden sm:inline">{loc.location}</span>
                  </span>
                  <span className="text-muted-foreground text-[10px] sm:text-sm shrink-0">{loc.count}</span>
                </div>
                <Progress value={loc.percent} className="h-1.5 sm:h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Step 9: Audit Trail
function AuditStep({ entries }: { entries: AuditEntry[] }) {
  const fullEntries = [
    ...entries,
    {
      timestamp: "09:15:20",
      action: "Location updated",
      actor: "System" as const,
      detail: "Site B - Level 3",
      icon: MapPin,
    },
    {
      timestamp: "09:15:21",
      action: "Project logged",
      actor: "System" as const,
      detail: "Lakewood Fitout",
      icon: Building2,
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
        <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg shrink-0">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-foreground">Audit Trail</h3>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Complete traceability</p>
        </div>
      </div>

      <Card className="border-blue-500/30">
        <CardContent className="p-2 sm:pt-6 sm:p-6">
          <div className="space-y-2 sm:space-y-4 max-h-[200px] sm:max-h-none overflow-y-auto">
            {fullEntries.map((entry, index) => {
              const Icon = entry.icon;
              const actorColors = {
                AI: "violet",
                Human: "amber",
                System: "slate",
              };
              const color = actorColors[entry.actor];
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2 sm:gap-4 p-2 sm:p-3 bg-background/50 rounded-lg"
                >
                  <div className="flex flex-col items-center shrink-0">
                    <div className={cn("p-1.5 sm:p-2 rounded-lg", `bg-${color}-500/20`)}>
                      <Icon className={cn("w-3 h-3 sm:w-4 sm:h-4", `text-${color}-400`)} />
                    </div>
                    {index < fullEntries.length - 1 && (
                      <div className="w-px h-4 sm:h-8 bg-border mt-1 sm:mt-2" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
                      <span className="text-xs sm:text-sm font-medium text-foreground truncate">{entry.action}</span>
                      <Badge variant="outline" className={cn("text-[10px] sm:text-xs px-1 py-0", `text-${color}-400 border-${color}-500/30`)}>
                        {entry.actor}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
                      <span className="font-mono shrink-0">{entry.timestamp}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="truncate hidden sm:inline">{entry.detail}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 p-2 sm:p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
        <span className="text-[10px] sm:text-sm text-emerald-300 truncate">
          Full traceability — all actions recorded
        </span>
      </div>
    </div>
  );
}
