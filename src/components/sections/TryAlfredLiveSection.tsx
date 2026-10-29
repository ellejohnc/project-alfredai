import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Mic, Clock, CheckCircle, Mail, LayoutGrid, ArrowRight, Users, RotateCcw, Pause, Play, CheckCircle2, AlertCircle, CalendarIcon, ChevronLeft, ChevronRight, Gavel, ClipboardCheck, FileEdit, MessageSquareMore, Receipt, BarChart3, Handshake, TrendingUp, Building2, Sparkles, Search, ChevronDown, FileText, Zap } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, isBefore, startOfToday, isWeekend } from "date-fns";


const samplePrompts = [
  "What are your business hours?",
  "Book a demo for tomorrow",
  "How does pricing work?",
];

const successItems = [
  "Calendar invite sent",
  "SMS reminder scheduled",
  "Email confirmation sent",
];

const workflowSteps = [
  { id: "crm", label: "CRM", description: "Lead captured", icon: Users, color: "from-blue-500 to-blue-600" },
  { id: "tender", label: "Tender & Procurement", description: "Bids submitted", icon: Gavel, color: "from-pink-500 to-rose-500" },
  { id: "email", label: "Email", description: "Outreach sent", icon: Mail, color: "from-emerald-500 to-teal-500" },
  { id: "inspection", label: "Inspection", description: "Site verified", icon: ClipboardCheck, color: "from-violet-500 to-purple-500" },
  { id: "report", label: "Report Writing", description: "Docs generated", icon: FileEdit, color: "from-amber-500 to-orange-500" },
  { id: "rfi", label: "RFI & Project", description: "Queries managed", icon: MessageSquareMore, color: "from-cyan-500 to-sky-500" },
  { id: "arap", label: "AR & AP", description: "Payments tracked", icon: Receipt, color: "from-green-500 to-emerald-600" },
  { id: "bi", label: "Business Intelligence", description: "Insights delivered", icon: BarChart3, color: "from-indigo-500 to-blue-600" },
];

// Import inspection image
import inspectionCrack from "@/assets/inspection-crack.jpg";

const SiteInspectionWidget = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleScan = useCallback(() => {
    if (isScanning) return;
    
    setIsScanning(true);
    setShowAnalysis(false);

    setTimeout(() => {
      setIsScanning(false);
      setShowAnalysis(true);

      // Reset after 6 seconds
      setTimeout(() => {
        setShowAnalysis(false);
      }, 6000);
    }, 2000);
  }, [isScanning]);

  // Autoplay: Start demo automatically after 1.5 seconds
  useEffect(() => {
    const autoplayTimer = setTimeout(() => {
      handleScan();
    }, 1500);

    return () => clearTimeout(autoplayTimer);
  }, []);

  // Loop the demo
  useEffect(() => {
    if (!showAnalysis && !isScanning) {
      const loopTimer = setTimeout(() => {
        handleScan();
      }, 2000);
      return () => clearTimeout(loopTimer);
    }
  }, [showAnalysis, isScanning, handleScan]);

  return (
    <motion.div
      className="glassmorphism-dark rounded-2xl p-6 h-[460px] border border-white/10 hover:border-primary/30 transition-colors flex flex-col relative overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.01 }}
    >
      {/* LIVE Dot */}
      <div className="absolute top-4 right-4 w-3 h-3 bg-emerald-500 rounded-full glow-mint animate-pulse" />

      <h2 className="text-2xl font-semibold text-white mb-2">
        📋 Site Inspection
      </h2>
      <p className="text-sm text-slate-400 mb-4">
        AI-powered defect detection
      </p>

      <div className="flex-1 flex flex-col space-y-4">
        {/* Image with scanning overlay */}
        <div className="relative rounded-lg overflow-hidden aspect-video bg-slate-800">
          <img 
            src={inspectionCrack} 
            alt="Wall crack inspection" 
            className="w-full h-full object-cover"
          />
          
          {/* Scanning overlay */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-primary/20 flex items-center justify-center"
              >
                <motion.div
                  className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
                  animate={{ y: ["0%", "100%", "0%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  style={{ height: "100%" }}
                />
                <div className="bg-slate-900/90 rounded-lg px-4 py-2 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-primary animate-pulse" />
                  <span className="text-sm text-white">Analyzing...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Location badge */}
          <div className="absolute bottom-2 left-2 bg-slate-900/80 rounded px-2 py-1 text-xs text-slate-300 flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            Level 2 - Bathroom
          </div>
        </div>

        {/* Analysis Result */}
        <AnimatePresence mode="wait">
          {showAnalysis ? (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-800 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-red-400 bg-red-400/10 px-2 py-1 rounded">
                  HIGH SEVERITY
                </span>
                <span className="text-xs text-slate-400">94% confidence</span>
              </div>
              <p className="text-sm text-white font-medium">Structural crack in concrete wall</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hairline crack detected. Potential water ingress point and may indicate foundation movement.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="cta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-slate-800 rounded-lg p-4"
            >
              <button
                onClick={handleScan}
                disabled={isScanning}
                className="w-full py-2 px-4 bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-lg text-sm font-medium text-primary-foreground transition-colors flex items-center justify-center gap-2"
              >
                <ClipboardCheck className="w-4 h-4" />
                {isScanning ? "Scanning..." : "Scan for Defects"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const timeSlots = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
];

const complianceItems = [
  { id: "ins", label: "Public Liability Insurance", standard: "AS/NZS", status: "pass" as const, detail: "Coverage verified to $20M" },
  { id: "lic", label: "Builder's Licence", standard: "NSW Fair Trading", status: "pass" as const, detail: "Class A - expires Dec 2026" },
  { id: "swms", label: "SWMS Documentation", standard: "WHS Act 2011", status: "fail" as const, detail: "Missing risk assessment for height work" },
  { id: "wc", label: "Workers Compensation", standard: "iCare NSW", status: "pass" as const, detail: "Active policy verified" },
  { id: "env", label: "Environmental Permit", standard: "EPA", status: "review" as const, detail: "Pending council approval" },
];

const ComplianceCheckWidget = () => {
  const [phase, setPhase] = useState<"idle" | "scanning" | "results">("idle");
  const [checkedCount, setCheckedCount] = useState(0);

  const runCheck = useCallback(() => {
    setPhase("scanning");
    setCheckedCount(0);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setCheckedCount(count);
      if (count >= complianceItems.length) {
        clearInterval(interval);
        setTimeout(() => setPhase("results"), 400);
      }
    }, 500);
  }, []);

  // Autoplay
  useEffect(() => {
    const t = setTimeout(runCheck, 1200);
    return () => clearTimeout(t);
  }, []);

  // Loop
  useEffect(() => {
    if (phase === "results") {
      const t = setTimeout(() => {
        setPhase("idle");
        setTimeout(runCheck, 1500);
      }, 6000);
      return () => clearTimeout(t);
    }
  }, [phase, runCheck]);

  const passCount = complianceItems.filter(c => c.status === "pass").length;
  const failCount = complianceItems.filter(c => c.status === "fail").length;
  const reviewCount = complianceItems.filter(c => c.status === "review").length;

  const getStatusIcon = (status: string) => {
    if (status === "pass") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    if (status === "fail") return <AlertCircle className="w-4 h-4 text-rose-400" />;
    return <Clock className="w-4 h-4 text-amber-400" />;
  };

  const getStatusBadge = (status: string) => {
    if (status === "pass") return "bg-emerald-400/10 text-emerald-400 border-emerald-400/20";
    if (status === "fail") return "bg-rose-400/10 text-rose-400 border-rose-400/20";
    return "bg-amber-400/10 text-amber-400 border-amber-400/20";
  };

  return (
    <motion.div
      className="glassmorphism-dark rounded-2xl p-6 h-[460px] border border-white/10 hover:border-primary/30 transition-colors flex flex-col relative overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="absolute top-4 right-4 w-3 h-3 bg-emerald-500 rounded-full glow-mint animate-pulse" />

      <h2 className="text-2xl font-semibold text-white mb-1">🛡️ Compliance Check</h2>
      <p className="text-sm text-slate-400 mb-4">AI-powered vendor document verification</p>

      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center space-y-4"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30"
              >
                <ClipboardCheck className="w-10 h-10 text-primary" />
              </motion.div>
              <motion.button
                onClick={runCheck}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(45, 212, 191, 0)",
                    "0 0 25px 8px rgba(45, 212, 191, 0.4)",
                    "0 0 0 0 rgba(45, 212, 191, 0)"
                  ],
                }}
                transition={{ boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
                className="relative w-full bg-gradient-to-r from-teal-400 to-emerald-500 text-white py-3.5 rounded-xl font-semibold min-h-[52px] overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                <span className="relative flex items-center justify-center gap-2">
                  <ClipboardCheck className="w-4 h-4" />
                  Run Compliance Check
                  <ArrowRight className="w-4 h-4" />
                </span>
              </motion.button>
            </motion.div>
          )}

          {phase === "scanning" && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col space-y-3"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Verifying documents...</span>
                <span>{checkedCount}/{complianceItems.length}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                  style={{ width: `${(checkedCount / complianceItems.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="space-y-2 mt-2">
                {complianceItems.slice(0, checkedCount).map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 bg-slate-800/80 rounded-lg px-3 py-2"
                  >
                    {getStatusIcon(item.status)}
                    <span className="text-sm text-white flex-1 truncate">{item.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-medium ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {phase === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col space-y-3"
            >
              {/* Summary */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-lg font-bold text-emerald-400">{passCount}</p>
                  <p className="text-[10px] text-slate-400">Passed</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <p className="text-lg font-bold text-rose-400">{failCount}</p>
                  <p className="text-[10px] text-slate-400">Failed</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-lg font-bold text-amber-400">{reviewCount}</p>
                  <p className="text-[10px] text-slate-400">Review</p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5 flex-1 overflow-y-auto">
                {complianceItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{item.label}</p>
                        <p className="text-[10px] text-slate-500 truncate">{item.detail}</p>
                      </div>
                      <span className="text-[9px] text-slate-500 shrink-0">{item.standard}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => { setPhase("idle"); }}
                  className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1 min-h-[44px] px-2"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
                <Link
                  to="/demos/vendor-compliance"
                  className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 min-h-[44px] px-2"
                >
                  Full Demo <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const WorkflowWidget = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => {
        const next = prev + 1;
        if (next >= workflowSteps.length) {
          setTimeout(() => {
            setCompletedSteps([]);
            setActiveStep(0);
          }, 1500);
          return prev;
        }
        setCompletedSteps((completed) => [...completed, prev]);
        return next;
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleReplay = () => {
    setActiveStep(0);
    setCompletedSteps([]);
    setIsPlaying(true);
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const currentStep = workflowSteps[activeStep];
  const CurrentIcon = currentStep.icon;

  return (
    <motion.div
      className="glassmorphism-dark rounded-2xl p-6 md:p-8 border border-white/10 hover:border-primary/30 transition-colors relative overflow-visible"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-white">
              ⚡ Watch how Alfred's AI agent runs a construction workflow end-to-end.
            </h2>
            {isPlaying && (
              <div className="bg-emerald-500 rounded-full px-3 py-1 text-xs font-bold glow-mint animate-pulse">
                LIVE
              </div>
            )}
          </div>
        </div>
        
        {/* Step counter */}
        <span className="text-sm text-slate-400">
          Step {activeStep + 1}/{workflowSteps.length}
        </span>
      </div>

      {/* Horizontal steps with connectors */}
      <div className="relative pt-6 overflow-visible">
        {/* Progress bar background */}
        <div className="absolute top-14 left-0 right-0 h-1 bg-slate-700 rounded-full hidden md:block" />
        <motion.div
          className="absolute top-14 left-0 h-1 bg-gradient-to-r from-primary to-pink-500 rounded-full hidden md:block"
          initial={{ width: 0 }}
          animate={{ width: `${(activeStep / (workflowSteps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5 }}
        />

        {/* Steps */}
        <div className="flex items-start justify-between gap-2 md:gap-0 overflow-x-auto overflow-y-visible pt-2 pb-4 md:pb-0 scrollbar-hide">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = activeStep === index;
            const isCompleted = completedSteps.includes(index);

            return (
              <motion.button
                key={step.id}
                onClick={() => {
                  setActiveStep(index);
                  setCompletedSteps(Array.from({ length: index }, (_, i) => i));
                }}
                className="flex flex-col items-center flex-1 min-w-[80px] md:min-w-0 relative z-10"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Icon */}
                <motion.div
                  className={`relative w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-br ${step.color} shadow-lg shadow-primary/20`
                      : isCompleted
                      ? `bg-gradient-to-br ${step.color}`
                      : "bg-slate-800 border border-slate-700"
                  }`}
                  animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
                >
                  <Icon className={`w-6 h-6 md:w-7 md:h-7 ${isActive || isCompleted ? "text-white" : "text-slate-400"}`} />
                  
                  {/* Completion check */}
                  <AnimatePresence>
                    {isCompleted && !isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute top-1 right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-900"
                      >
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Active ring */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-primary"
                      animate={{ scale: [1, 1.15], opacity: [0.8, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>

                {/* Label */}
                <div className="mt-3 text-center">
                  <p className={`text-xs md:text-sm font-medium transition-colors ${isActive ? "text-white" : "text-slate-400"}`}>
                    {step.label}
                  </p>
                  <p className={`text-[10px] md:text-xs mt-0.5 transition-colors ${isActive ? "text-slate-300" : "text-slate-600"}`}>
                    {step.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Active step detail bar */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="mt-6 bg-slate-800/80 rounded-xl p-4 flex items-center gap-4 border border-slate-700/50"
        >
          <motion.div
            className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${currentStep.color} shrink-0`}
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <CurrentIcon className="w-6 h-6 text-white" />
          </motion.div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <p className="text-white font-semibold">{currentStep.label}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${currentStep.color} text-white`}>
                Active
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              {currentStep.description} • Processing automatically...
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Auto-synced</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

const PdfTakeOffWidget = () => {
  const [phase, setPhase] = useState<"uploading" | "scanning" | "extracting" | "done">("uploading");
  const [extractedItems, setExtractedItems] = useState<number>(0);
  const [scanProgress, setScanProgress] = useState(0);

  const lineItems = [
    { trade: "Concrete", item: "Slab on grade 150mm", qty: "342 m²", confidence: "high" },
    { trade: "Steel", item: "RHS 100x50x3 columns", qty: "28 ea", confidence: "high" },
    { trade: "Glazing", item: "Double-glazed panels", qty: "86 m²", confidence: "medium" },
    { trade: "Roofing", item: "Colorbond sheeting", qty: "410 m²", confidence: "high" },
    { trade: "Electrical", item: "Power points GPO", qty: "64 ea", confidence: "low" },
  ];

  const confidenceColor = (c: string) => {
    if (c === "high") return "bg-emerald-500";
    if (c === "medium") return "bg-amber-500";
    return "bg-rose-500";
  };

  useEffect(() => {
    // Phase 1: uploading -> scanning
    const t1 = setTimeout(() => setPhase("scanning"), 1500);
    // Phase 2: scan progress
    const t2 = setTimeout(() => {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) { clearInterval(interval); return 100; }
          return prev + 4;
        });
      }, 60);
      return () => clearInterval(interval);
    }, 1500);
    // Phase 3: extracting
    const t3 = setTimeout(() => setPhase("extracting"), 4200);
    // Phase 4: reveal items one by one
    const t4 = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setExtractedItems(i);
        if (i >= lineItems.length) {
          clearInterval(interval);
          setTimeout(() => setPhase("done"), 600);
        }
      }, 500);
    }, 4500);
    // Reset loop
    const t5 = setTimeout(() => {
      setPhase("uploading");
      setExtractedItems(0);
      setScanProgress(0);
    }, 10000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [phase === "uploading" && extractedItems === 0 ? "reset" : "running"]);

  return (
    <motion.div
      className="glassmorphism-dark rounded-2xl p-6 h-[460px] border border-white/10 hover:border-primary/30 transition-colors flex flex-col overflow-hidden relative"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.3 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="absolute top-4 right-4 w-3 h-3 bg-emerald-500 rounded-full glow-mint animate-pulse" />

      <h2 className="text-2xl font-semibold text-white mb-1">
        📐 AI PDF Take-Off
      </h2>
      <p className="text-sm text-slate-400 mb-4">
        From 3 days to 3 mins — quantities extracted automatically
      </p>

      {/* Upload / Scan Phase */}
      {(phase === "uploading" || phase === "scanning") && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-16 h-20 bg-slate-700/80 rounded-lg border border-slate-600 flex flex-col items-center justify-center gap-1"
          >
            <FileText className="w-7 h-7 text-slate-400" />
            <span className="text-[8px] text-slate-500 font-medium">PDF</span>
          </motion.div>
          <p className="text-xs text-slate-400">
            {phase === "uploading" ? "Uploading floor plan..." : "Scanning drawing sheets..."}
          </p>
          {phase === "scanning" && (
            <div className="w-48 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Extraction Phase */}
      {(phase === "extracting" || phase === "done") && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Status bar */}
          <div className="flex items-center gap-2 mb-3 p-2 bg-primary/15 border border-primary/25 rounded-lg">
            {phase === "done" ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Zap className="w-4 h-4 text-primary" />
              </motion.div>
            )}
            <span className="text-xs text-white">
              {phase === "done" 
                ? `${lineItems.length} line items extracted — ready for review`
                : `Extracting quantities... ${extractedItems}/${lineItems.length}`
              }
            </span>
          </div>

          {/* Line items table */}
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-[1fr_2fr_auto_auto] gap-x-2 mb-1.5 px-2">
              <span className="text-[9px] text-slate-500 font-semibold uppercase">Trade</span>
              <span className="text-[9px] text-slate-500 font-semibold uppercase">Item</span>
              <span className="text-[9px] text-slate-500 font-semibold uppercase">Qty</span>
              <span className="text-[9px] text-slate-500 font-semibold uppercase">Conf</span>
            </div>
            <div className="space-y-1">
              {lineItems.slice(0, extractedItems).map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="grid grid-cols-[1fr_2fr_auto_auto] gap-x-2 items-center bg-slate-800/60 rounded-md px-2 py-1.5 border border-slate-700/50"
                >
                  <span className="text-[10px] text-primary font-medium truncate">{item.trade}</span>
                  <span className="text-[10px] text-slate-300 truncate">{item.item}</span>
                  <span className="text-[10px] text-white font-mono">{item.qty}</span>
                  <div className={`w-2 h-2 rounded-full ${confidenceColor(item.confidence)}`} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> High
        </span>
        <span className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Medium
        </span>
        <span className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> Low
        </span>
      </div>
    </motion.div>
  );
};

const TryAlfredLiveSection = () => {

  return (
    <section
      id="try-alfred-live"
      className="relative text-white pt-32 pb-24 overflow-hidden"
    >
      {/* Merged background — same tone as hero end and page background for seamless transition */}
      <div className="absolute inset-0 bg-[hsl(222_47%_7%)] z-0" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold mb-4 text-white">Put Your Data to Work</h2>
          <p className="text-xl text-slate-400">
            Done-for-you, Secured, Self-improved
          </p>
        </motion.div>

        {/* Workflow Demo - Full Width Top */}
        <div className="mb-6">
          <WorkflowWidget />
        </div>

        {/* Other Demos - 3 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SiteInspectionWidget />
          <ComplianceCheckWidget />
          <PdfTakeOffWidget />
        </div>

        {/* Explore More Demos CTA */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-slate-400 mb-6">
            Want to see more? Explore our full library of interactive demos
          </p>
          <Link
            to="/resources/demos"
            className="inline-flex items-center gap-2 bg-cta text-cta-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:bg-cta-hover transition-all duration-300 hover:gap-3 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
          >
            Explore All Demos
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

      </div>
    </section>
  );
};

// Wrap in error boundary for stability
import SectionErrorBoundary from "@/components/ui/section-error-boundary";

const TryAlfredLiveSectionWithBoundary = () => (
  <SectionErrorBoundary title="Interactive Demos" compact={false}>
    <TryAlfredLiveSection />
  </SectionErrorBoundary>
);

export default TryAlfredLiveSectionWithBoundary;
