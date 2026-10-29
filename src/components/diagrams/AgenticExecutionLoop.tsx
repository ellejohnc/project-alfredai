import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  MessageSquare, HelpCircle, CheckCircle, Zap, Shield, User, Bot,
  RotateCcw, ChevronLeft, ChevronRight, ChevronRight as ArrowIcon,
  Lightbulb, BookOpen, Link2,
  Database, Cloud, MessageCircle, FileText, Calculator, Server,
  Mail, Building2, Users, HardDrive, Headphones, Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AgenticExecutionLoopProps {
  variant?: "full" | "compact";
  className?: string;
}

interface Integration {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}

interface Step {
  id: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  detailedDescription: string;
  owner: "human" | "ai" | "both";
  isHighlighted?: boolean;
  examples: string[];
  tips: string[];
  relatedSteps: number[];
  integrations: Integration[];
}

// Integration icons for tech stack display
const integrations: Record<string, Integration[]> = {
  prompt: [
    { name: "Gmail", icon: MessageCircle, category: "Communication" },
    { name: "Slack", icon: MessageCircle, category: "Communication" },
  ],
  clarify: [
    { name: "Notion", icon: FileText, category: "Knowledge" },
    { name: "Confluence", icon: FileText, category: "Knowledge" },
  ],
  approve: [
    { name: "Teams", icon: MessageCircle, category: "Notifications" },
    { name: "Slack", icon: MessageCircle, category: "Notifications" },
  ],
  execute: [
    { name: "Salesforce", icon: Database, category: "CRM" },
    { name: "Xero", icon: Calculator, category: "Accounting" },
    { name: "AWS", icon: Cloud, category: "Cloud" },
  ],
  validate: [
    { name: "Jira", icon: Server, category: "Project Mgmt" },
    { name: "Asana", icon: Server, category: "Project Mgmt" },
  ],
};

const steps: Step[] = [
  {
    id: 1,
    label: "PROMPT",
    icon: MessageSquare,
    description: "Human initiates the task",
    detailedDescription: "The human user describes what they want to accomplish using natural language. No technical syntax required — just explain the goal, context, and any constraints. alfred ai understands intent and translates it into actionable steps.",
    owner: "human",
    examples: [
      "Schedule a meeting with the engineering team for next Tuesday at 2pm",
      "Generate a quarterly sales report from our CRM data",
      "Update all customer records with the new pricing tiers",
    ],
    tips: [
      "Be specific about desired outcomes",
      "Include relevant context upfront",
      "Mention approval requirements",
    ],
    relatedSteps: [2, 3],
    integrations: integrations.prompt,
  },
  {
    id: 2,
    label: "CLARIFY",
    icon: HelpCircle,
    description: "AI asks clarifying questions",
    detailedDescription: "Before proceeding, alfred ai identifies ambiguities or missing information. It asks targeted questions to ensure the task is understood correctly, reducing errors and rework.",
    owner: "ai",
    examples: [
      "Should I include team members from both US and EU?",
      "Which date range — fiscal or calendar quarter?",
      "Do you want to notify customers via email?",
    ],
    tips: [
      "Answer questions thoroughly",
      "Provide examples for edge cases",
      "Reference past decisions",
    ],
    relatedSteps: [1, 3],
    integrations: integrations.clarify,
  },
  {
    id: 3,
    label: "APPROVE",
    icon: CheckCircle,
    description: "Human reviews the plan",
    detailedDescription: "alfred ai presents a detailed action plan showing exactly what it intends to do. The human reviews, modifies if needed, and explicitly approves before any actions are taken.",
    owner: "human",
    examples: [
      "Plan: Send invite to 12 attendees, book room, attach agenda",
      "Plan: Query CRM, generate charts, compile PDF report",
      "Plan: Update 2,847 records, apply adjustments, log changes",
    ],
    tips: [
      "Review each action carefully",
      "Request modifications if needed",
      "Ask for dry-run on high-impact ops",
    ],
    relatedSteps: [2, 4],
    integrations: integrations.approve,
  },
  {
    id: 4,
    label: "EXECUTE",
    icon: Zap,
    description: "AI executes approved actions",
    detailedDescription: "With approval granted, alfred ai autonomously executes the planned actions across your connected systems. It handles complexity and adapts to real-time conditions.",
    owner: "ai",
    isHighlighted: true,
    examples: [
      "Sent 12 invites, booked room, 8 confirmed, 2 pending",
      "Queried 15K records, generated 6 charts, sent report",
      "Updated 2,847 records in 3.2 min, all logged",
    ],
    tips: [
      "Monitor long-running operations",
      "Check real-time status updates",
      "All actions are logged",
    ],
    relatedSteps: [3, 5],
    integrations: integrations.execute,
  },
  {
    id: 5,
    label: "VALIDATE",
    icon: Shield,
    description: "Human validates; AI learns",
    detailedDescription: "The human reviews results and confirms success. Feedback is captured to improve future performance. The loop can restart with refined parameters if needed.",
    owner: "both",
    examples: [
      "Meeting scheduled — attendance meets quorum",
      "Report approved for board presentation",
      "Spot-checked 20 records — all correct",
    ],
    tips: [
      "Provide feedback even when things go well",
      "Flag unexpected outcomes",
      "Request adjustments for next time",
    ],
    relatedSteps: [4, 1],
    integrations: integrations.validate,
  },
];

// Animated connector arrow component
const ConnectorArrow = ({ 
  isActive, 
  inView,
  index,
}: { 
  isActive: boolean; 
  inView: boolean;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5 }}
    animate={inView ? { opacity: 1, scale: 1 } : {}}
    transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
    className="hidden lg:flex items-center justify-center flex-shrink-0"
  >
    <motion.div
      animate={{
        scale: isActive ? 1.3 : 1,
      }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <ArrowIcon className={cn(
        "w-4 h-4 transition-colors duration-300",
        isActive ? "text-primary" : "text-muted-foreground/40"
      )} />
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute inset-0 blur-sm"
        >
          <ArrowIcon className="w-4 h-4 text-primary" />
        </motion.div>
      )}
    </motion.div>
  </motion.div>
);

// Step detail modal component with tabs
const StepDetailModal = ({
  step,
  isOpen,
  onClose,
  onNavigate,
  allSteps,
}: {
  step: Step | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (stepId: number) => void;
  allSteps: Step[];
}) => {
  if (!step) return null;

  const Icon = step.icon;
  const currentIndex = allSteps.findIndex(s => s.id === step.id);
  const prevStep = currentIndex > 0 ? allSteps[currentIndex - 1] : null;
  const nextStep = currentIndex < allSteps.length - 1 ? allSteps[currentIndex + 1] : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-card border-border text-foreground max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              step.isHighlighted ? "bg-primary/20" : "bg-muted"
            )}>
              <Icon className={cn(
                "w-5 h-5",
                step.isHighlighted ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                  step.isHighlighted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {step.id}
                </span>
                <DialogTitle className="text-lg font-semibold">
                  {step.label}
                </DialogTitle>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {(step.owner === "human" || step.owner === "both") && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20">
                    <User className="w-3 h-3 text-blue-500" />
                    <span className="text-xs text-blue-500">Human</span>
                  </div>
                )}
                {(step.owner === "ai" || step.owner === "both") && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-secondary/20">
                    <Bot className="w-3 h-3 text-secondary" />
                    <span className="text-xs text-secondary">AI</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <p className="text-sm text-muted-foreground leading-relaxed mt-3">
          {step.detailedDescription}
        </p>

        {/* Tabbed content for focus */}
        <Tabs defaultValue="examples" className="mt-4">
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="examples" className="text-xs">What Happens</TabsTrigger>
            <TabsTrigger value="tips" className="text-xs">Best Practices</TabsTrigger>
            <TabsTrigger value="connected" className="text-xs">Connected</TabsTrigger>
          </TabsList>
          
          <TabsContent value="examples" className="mt-3 space-y-2">
            {step.examples.map((example, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-0.5">→</span>
                <span>{example}</span>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="tips" className="mt-3 space-y-2">
            {step.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Lightbulb className="w-3.5 h-3.5 text-warning mt-0.5 flex-shrink-0" />
                <span>{tip}</span>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="connected" className="mt-3 space-y-3">
            {/* Related steps */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Link2 className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium">Connected Steps</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {step.relatedSteps.map((relatedId) => {
                  const relatedStep = allSteps.find(s => s.id === relatedId);
                  if (!relatedStep) return null;
                  const RelatedIcon = relatedStep.icon;
                  return (
                    <button
                      key={relatedId}
                      onClick={() => onNavigate(relatedId)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted hover:bg-primary/10 border border-border hover:border-primary/30 transition-colors text-xs"
                    >
                      <span className="w-4 h-4 rounded-full bg-muted-foreground/20 flex items-center justify-center text-[10px] font-bold">
                        {relatedStep.id}
                      </span>
                      <RelatedIcon className="w-3 h-3 text-muted-foreground" />
                      <span>{relatedStep.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Integrations */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Database className="w-3.5 h-3.5 text-secondary" />
                <span className="text-xs font-medium">Systems</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {step.integrations.map((integration, i) => {
                  const IntegrationIcon = integration.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-xs"
                    >
                      <IntegrationIcon className="w-3 h-3 text-secondary" />
                      <span className="text-muted-foreground">{integration.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => prevStep && onNavigate(prevStep.id)}
            disabled={!prevStep}
            className="h-8 text-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            {prevStep?.label || "Prev"}
          </Button>
          <span className="text-xs text-muted-foreground">
            {step.id} / {allSteps.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => nextStep && onNavigate(nextStep.id)}
            disabled={!nextStep}
            className="h-8 text-xs"
          >
            {nextStep?.label || "Next"}
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Step card component
const StepCard = ({
  step,
  isActive,
  onStepClick,
  inView,
  index,
}: {
  step: Step;
  isActive: boolean;
  onStepClick: (step: Step) => void;
  inView: boolean;
  index: number;
}) => {
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.08 }}
      onClick={() => onStepClick(step)}
      className={cn(
        "relative p-3 rounded-lg border cursor-pointer transition-all group flex-1 min-w-0",
        isActive
          ? "bg-primary/10 border-primary/50 shadow-md shadow-primary/10"
          : step.isHighlighted
            ? "bg-primary/5 border-primary/30"
            : "bg-card border-border hover:border-muted-foreground/30"
      )}
    >
      {/* Step number badge */}
      <div className={cn(
        "absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm",
        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}>
        {step.id}
      </div>

      {/* Icon and label row */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className={cn(
          "w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0",
          isActive ? "bg-primary/20" : "bg-muted"
        )}>
          <Icon className={cn(
            "w-3.5 h-3.5",
            isActive ? "text-primary" : "text-muted-foreground"
          )} />
        </div>
        <span className={cn(
          "text-[11px] font-semibold tracking-wide truncate",
          isActive ? "text-primary" : "text-muted-foreground"
        )}>
          {step.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-[10px] text-muted-foreground/80 leading-relaxed line-clamp-2">
        {step.description}
      </p>

      {/* Owner badges */}
      <div className="flex items-center gap-1 mt-2">
        {(step.owner === "human" || step.owner === "both") && (
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-500/10">
            <User className="w-2.5 h-2.5 text-blue-500" />
            <span className="text-[8px] text-blue-500 font-medium">Human</span>
          </div>
        )}
        {(step.owner === "ai" || step.owner === "both") && (
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-secondary/10">
            <Bot className="w-2.5 h-2.5 text-secondary" />
            <span className="text-[8px] text-secondary font-medium">AI</span>
          </div>
        )}
      </div>

      {/* Active pulse indicator */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full"
          >
            <span className="absolute inset-0 bg-primary rounded-full animate-ping" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover hint */}
      <div className="absolute inset-x-0 -bottom-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="text-[8px] text-center text-muted-foreground">Click for details</div>
      </div>
    </motion.div>
  );
};

const AgenticExecutionLoop = ({ variant = "full", className }: AgenticExecutionLoopProps) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [activeStep, setActiveStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);

  // Autoplay once through all steps when in view
  useEffect(() => {
    if (inView && !hasCompleted && activeStep < steps.length) {
      const timeout = setTimeout(() => {
        if (activeStep === 0) {
          setActiveStep(1);
        } else if (activeStep < steps.length) {
          setActiveStep(prev => prev + 1);
        }
        
        if (activeStep === steps.length - 1) {
          setTimeout(() => setHasCompleted(true), 1500);
        }
      }, activeStep === 0 ? 300 : 1500);
      
      return () => clearTimeout(timeout);
    }
  }, [inView, activeStep, hasCompleted]);

  const handleStepClick = useCallback((step: Step) => {
    setSelectedStep(step);
  }, []);

  const handleNavigateStep = useCallback((stepId: number) => {
    const step = steps.find(s => s.id === stepId);
    if (step) setSelectedStep(step);
  }, []);

  const handleReplay = useCallback(() => {
    setActiveStep(0);
    setHasCompleted(false);
  }, []);

  // Compact variant - static, visually rich presentation
  if (variant === "compact") {
    return (
      <div ref={ref} className={cn("w-full", className)}>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Steps Grid */}
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isHuman = step.owner === "human";
                const isAI = step.owner === "ai";
                const isBoth = step.owner === "both";
                
                return (
                  <div key={step.id} className="relative">
                    {/* Connector line (desktop only, between cards) */}
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-1.5 w-3 h-px bg-border z-10">
                        <ChevronRight className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
                      </div>
                    )}
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={inView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.4, delay: index * 0.08 }}
                      onClick={() => handleStepClick(step)}
                      className={cn(
                        "relative p-4 rounded-xl border cursor-pointer transition-all group h-full",
                        "hover:shadow-md hover:border-primary/30",
                        step.isHighlighted 
                          ? "bg-primary/5 border-primary/20" 
                          : "bg-muted/30 border-border"
                      )}
                    >
                      {/* Step number badge */}
                      <div className={cn(
                        "absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm",
                        step.isHighlighted 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted-foreground/80 text-background"
                      )}>
                        {step.id}
                      </div>

                      {/* Icon and label */}
                      <div className="flex items-center gap-2 mb-2 mt-1">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          step.isHighlighted ? "bg-primary/20" : "bg-muted"
                        )}>
                          <Icon className={cn(
                            "w-4 h-4",
                            step.isHighlighted ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <span className={cn(
                          "text-sm font-semibold tracking-wide",
                          step.isHighlighted ? "text-primary" : "text-foreground"
                        )}>
                          {step.label}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                        {step.description}
                      </p>

                      {/* Owner badge */}
                      <div className="flex items-center gap-1.5">
                        {isHuman && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                            <User className="w-3 h-3 text-amber-600" />
                            <span className="text-[10px] font-medium text-amber-700">Human</span>
                          </div>
                        )}
                        {isAI && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                            <Bot className="w-3 h-3 text-cyan-600" />
                            <span className="text-[10px] font-medium text-cyan-700">AI</span>
                          </div>
                        )}
                        {isBoth && (
                          <>
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-cyan-500/10 border border-amber-500/20">
                              <User className="w-3 h-3 text-amber-600" />
                              <span className="text-[10px] font-medium text-amber-700">Human</span>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-cyan-500/10 to-amber-500/10 border border-cyan-500/20">
                              <Bot className="w-3 h-3 text-cyan-600" />
                              <span className="text-[10px] font-medium text-cyan-700">AI</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Click hint on hover */}
                      <div className="absolute bottom-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[9px] text-muted-foreground">Click for details</span>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Integrated Reassurance Footer */}
          <div className="px-4 md:px-6 py-3 bg-primary/5 border-t border-primary/10">
            <p className="text-xs md:text-sm text-center text-foreground/80">
              <span className="font-medium text-primary">No system replacement required.</span>
              {" "}alfred ai integrates with your existing tools and workflows.
            </p>
          </div>
        </div>

        <StepDetailModal
          step={selectedStep}
          isOpen={!!selectedStep}
          onClose={() => setSelectedStep(null)}
          onNavigate={handleNavigateStep}
          allSteps={steps}
        />
      </div>
    );
  }

  // Full variant
  return (
    <div ref={ref} className={cn("w-full", className)}>
      <div className="bg-card rounded-xl p-4 md:p-6 border border-border relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-primary/5 rounded-full blur-[60px] pointer-events-none" />
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="text-center mb-5"
        >
          <h3 className="text-lg md:text-xl font-semibold mb-1">
            The Agentic Execution Loop
          </h3>
          <p className="text-xs text-muted-foreground">
            Human-AI collaboration that keeps you in control
          </p>
        </motion.div>

        {/* Step cards grid with arrows */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-2 mb-5">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-1.5">
              <StepCard
                step={step}
                isActive={activeStep === step.id}
                onStepClick={handleStepClick}
                inView={inView}
                index={index}
              />
              {index < steps.length - 1 && (
                <ConnectorArrow
                  isActive={activeStep === step.id}
                  inView={inView}
                  index={index}
                />
              )}
            </div>
          ))}
        </div>

        {/* Replay button */}
        {hasCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-4"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleReplay}
              className="h-8 text-xs border-border"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Replay Animation
            </Button>
          </motion.div>
        )}

        {/* Categorized integration examples */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="pt-4 border-t border-border"
        >
          <p className="text-center text-[10px] text-muted-foreground/60 mb-3">
            Connects to your existing tools
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { category: "Email", icon: Mail, examples: ["Gmail", "Outlook", "M365"] },
              { category: "CRM", icon: Users, examples: ["Salesforce", "HubSpot", "Dynamics"] },
              { category: "ERP", icon: Building2, examples: ["SAP", "Oracle", "NetSuite"] },
              { category: "Cloud", icon: Cloud, examples: ["AWS", "Azure", "GCP"] },
              { category: "Storage", icon: HardDrive, examples: ["SharePoint", "Drive", "Dropbox"] },
              { category: "Support", icon: Headphones, examples: ["Zendesk", "Freshdesk", "Intercom"] },
              { category: "Accounting", icon: Calculator, examples: ["Xero", "QuickBooks", "MYOB"] },
              { category: "Warehouse", icon: Package, examples: ["SAP WM", "Oracle WMS", "Fishbowl"] },
            ].map((category, i) => {
              const CategoryIcon = category.icon;
              return (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.2, delay: 0.6 + i * 0.04 }}
                  className="flex flex-col gap-1 p-2 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex items-center gap-1.5">
                    <CategoryIcon className="w-3.5 h-3.5 text-primary/70" />
                    <span className="text-[10px] font-medium text-foreground/80">{category.category}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground/70 leading-tight">
                    {category.examples.join(" • ")}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <StepDetailModal
        step={selectedStep}
        isOpen={!!selectedStep}
        onClose={() => setSelectedStep(null)}
        onNavigate={handleNavigateStep}
        allSteps={steps}
      />
    </div>
  );
};

export default AgenticExecutionLoop;
