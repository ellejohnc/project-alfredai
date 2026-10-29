import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  Users, 
  Mail, 
  Gavel,
  ClipboardCheck,
  FileEdit,
  MessageSquareMore,
  Receipt,
  BarChart3,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
  RotateCcw,
  ArrowRight,
  DollarSign,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const workflowSteps = [
  {
    id: "crm",
    label: "CRM",
    description: "Lead captured",
    icon: Users,
    color: "from-blue-500 to-blue-600",
    lightBg: "bg-blue-500/10",
    details: "New prospect from referral • Lead score: 92 • Project: Commercial Build",
    stat: "Auto-synced"
  },
  {
    id: "tender",
    label: "Tender & Procurement",
    description: "Bids submitted",
    icon: Gavel,
    color: "from-pink-500 to-rose-500",
    lightBg: "bg-pink-500/10",
    details: "RFP analyzed • 3 vendor quotes compared • Best value selected",
    stat: "Won bid"
  },
  {
    id: "email",
    label: "Email",
    description: "Outreach sent",
    icon: Mail,
    color: "from-emerald-500 to-teal-500",
    lightBg: "bg-emerald-500/10",
    details: "Contract docs sent • Subcontractor follow-ups • Client updates",
    stat: "Opened ✓"
  },
  {
    id: "inspection",
    label: "Inspection",
    description: "Site verified",
    icon: ClipboardCheck,
    color: "from-violet-500 to-purple-500",
    lightBg: "bg-violet-500/10",
    details: "Safety checklist completed • Photos uploaded • Issues flagged",
    stat: "Passed ✓"
  },
  {
    id: "report",
    label: "Report Writing",
    description: "Docs generated",
    icon: FileEdit,
    color: "from-amber-500 to-orange-500",
    lightBg: "bg-amber-500/10",
    details: "Daily log auto-generated • Progress photos attached • Sent to PM",
    stat: "Auto-sent"
  },
  {
    id: "rfi",
    label: "RFI & Project",
    description: "Queries managed",
    icon: MessageSquareMore,
    color: "from-cyan-500 to-sky-500",
    lightBg: "bg-cyan-500/10",
    details: "5 RFIs processed • Submittals tracked • Change orders logged",
    stat: "3 pending"
  },
  {
    id: "arap",
    label: "AR & AP",
    description: "Payments tracked",
    icon: Receipt,
    color: "from-green-500 to-emerald-600",
    lightBg: "bg-green-500/10",
    details: "Invoice #INV-2024-089 sent • Lien waivers collected • Draw #4 approved",
    stat: "$124,500"
  },
  {
    id: "bi",
    label: "Business Intelligence",
    description: "Insights delivered",
    icon: BarChart3,
    color: "from-indigo-500 to-blue-600",
    lightBg: "bg-indigo-500/10",
    details: "Profit margin: 18% • Cash flow forecast • Resource utilization: 87%",
    stat: "Live data"
  },
];

const metrics = [
  { label: "Operational Costs", value: "20-30%", icon: Clock, description: "Reduction in 90 days" },
  { label: "ROI", value: "5x", icon: DollarSign, description: "Within 12 months" },
  { label: "EBITDA", value: "15-30%", icon: TrendingUp, description: "Improvement in Year 1" },
  { label: "Revenue per Head", value: "5-10x", icon: Zap, description: "Increase over time" },
];

export default function WorkflowDemoSection() {
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
          }, 2000);
          return prev;
        }
        setCompletedSteps((completed) => [...completed, prev]);
        return next;
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleStepClick = (index: number) => {
    setIsPlaying(false);
    setActiveStep(index);
    setCompletedSteps(Array.from({ length: index }, (_, i) => i));
  };

  const handleReplay = () => {
    setActiveStep(0);
    setCompletedSteps([]);
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const currentStep = workflowSteps[activeStep];
  const CurrentIcon = currentStep.icon;

  return (
    <section className="py-28 md:py-36 relative overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-3xl" />
        <motion.div 
          className="absolute top-1/4 right-[10%] w-2 h-2 bg-primary rounded-full"
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-1/3 left-[15%] w-3 h-3 bg-pink-500 rounded-full"
          animate={{ y: [0, 15, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />
      </div>

      <div className="container-wide relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-pink-500/10 border border-primary/20 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">End-to-End Automation</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
            One Platform.{" "}
            <span className="bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
              Complete Control.
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            From first contact to final payment — watch how alfred ai automates your entire business workflow
          </p>
        </motion.div>

        {/* Main workflow visualization */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          {/* Progress indicator */}
          <div className="mb-8 flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-pink-500 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{activeStep + 1}</span>
                </div>
                {isPlaying && (
                  <motion.div 
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{ scale: [1, 1.4], opacity: [0.8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Step {activeStep + 1} of {workflowSteps.length}</p>
                <p className="text-xs text-muted-foreground">{Math.round(((activeStep + 1) / workflowSteps.length) * 100)}% complete</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isPlaying ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePause}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <div className="w-3 h-3 flex gap-0.5">
                    <div className="w-1 h-3 bg-current rounded-sm" />
                    <div className="w-1 h-3 bg-current rounded-sm" />
                  </div>
                  Pause
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReplay}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="w-4 h-4" />
                  Replay
                </Button>
              )}
            </div>
          </div>

          {/* Workflow card */}
          <div className="relative bg-card rounded-3xl border border-border shadow-2xl shadow-primary/5 overflow-hidden">
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-pink-500/20 opacity-50" />
            
            <div className="relative p-6 md:p-10">
              {/* Steps timeline */}
              <div className="overflow-x-auto pb-6 -mx-2 px-2 scrollbar-hide">
                <div className="flex items-center gap-2 md:gap-0 min-w-max md:justify-between">
                  {workflowSteps.map((step, index) => {
                    const isActive = activeStep === index;
                    const isCompleted = completedSteps.includes(index);
                    const Icon = step.icon;

                    return (
                      <div key={step.id} className="flex items-center">
                        <motion.button
                          onClick={() => handleStepClick(index)}
                          className={cn(
                            "relative flex flex-col items-center p-2 md:p-3 rounded-2xl transition-all duration-300 min-w-[80px] md:min-w-[90px]",
                            isActive
                              ? "bg-gradient-to-b from-background to-muted/50"
                              : "hover:bg-muted/30"
                          )}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {/* Icon */}
                          <motion.div 
                            className={cn(
                              "relative w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-2 transition-all duration-300",
                              isActive || isCompleted
                                ? `bg-gradient-to-br ${step.color} shadow-lg`
                                : "bg-muted"
                            )}
                            animate={isActive ? { 
                              scale: [1, 1.05, 1],
                              boxShadow: ["0 4px 20px rgba(0,0,0,0.1)", "0 8px 30px rgba(0,0,0,0.2)", "0 4px 20px rgba(0,0,0,0.1)"]
                            } : {}}
                            transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
                          >
                            <Icon className={cn(
                              "w-5 h-5 md:w-6 md:h-6 transition-colors",
                              isActive || isCompleted ? "text-white" : "text-muted-foreground"
                            )} />
                            
                            {/* Completion check */}
                            <AnimatePresence>
                              {isCompleted && !isActive && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-card glow-mint"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-white" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>

                          {/* Label */}
                          <span className={cn(
                            "text-xs md:text-sm font-medium text-center transition-colors",
                            isActive ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {step.label}
                          </span>

                          {/* Active indicator line */}
                          {isActive && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-primary to-pink-500"
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                        </motion.button>

                        {/* Connector line */}
                        {index < workflowSteps.length - 1 && (
                          <div className="hidden md:flex items-center w-8 lg:w-12">
                            <motion.div
                              className={cn(
                                "h-0.5 w-full rounded-full transition-colors duration-500",
                                isCompleted ? "bg-gradient-to-r from-primary to-pink-500" : "bg-border"
                              )}
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                              style={{ originX: 0 }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active step details */}
              <div className="min-h-[120px] mt-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "p-6 rounded-2xl border",
                      currentStep.lightBg,
                      "border-border/50"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <motion.div 
                        className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br",
                          currentStep.color
                        )}
                        animate={{ rotate: [0, 3, -3, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      >
                        <CurrentIcon className="w-7 h-7 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-foreground">
                            {currentStep.label}
                          </h3>
                          <span className={cn(
                            "text-xs font-medium px-3 py-1 rounded-full bg-gradient-to-r",
                            currentStep.color,
                            "text-white"
                          )}>
                            {currentStep.stat}
                          </span>
                          {isPlaying && (
                            <motion.div 
                              className="flex items-center gap-1.5 text-xs text-primary font-medium"
                              animate={{ opacity: [1, 0.5, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <span className="w-2 h-2 bg-primary rounded-full" />
                              Live
                            </motion.div>
                          )}
                        </div>
                        <p className="text-muted-foreground">
                          {currentStep.details}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Metrics grid */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={metric.label}
                  className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ y: -6, boxShadow: "0 20px 40px -15px rgba(0,0,0,0.15)" }}
                >
                  {/* Hover gradient */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-pink-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-1">
                      {metric.value}
                    </div>
                    <div className="text-sm font-semibold text-foreground mb-1">
                      {metric.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {metric.description}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-14 text-center"
          >
            <Link to="/resources/demos">
              <motion.div
                className="inline-block"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  size="lg" 
                  className="relative px-8 py-6 text-base font-semibold rounded-full bg-gradient-to-r from-primary via-pink-500 to-primary bg-[length:200%_100%] hover:bg-right transition-all duration-500 shadow-xl shadow-primary/20 group"
                >
                  <span>Try Interactive Demo Now</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
