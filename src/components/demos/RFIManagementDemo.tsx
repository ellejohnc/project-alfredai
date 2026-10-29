import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { InlineDemoSpeedControl } from "@/components/demos/shared/InlineDemoSpeedControl";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import {
  Mail,
  FileText,
  Brain,
  Search,
  Edit3,
  Users,
  Send,
  Bell,
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  RotateCcw,
  Building2,
  FileCheck,
  Link,
  Calendar,
  User,
  Paperclip,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  HardHat,
  Layers,
} from "lucide-react";

type ProcessingStep =
  | "trigger"
  | "ingestion"
  | "classification"
  | "context"
  | "draft"
  | "accountability"
  | "review"
  | "execution"
  | "tracking"
  | "audit";

type ExtractedField = {
  field: string;
  value: string;
  confidence: number;
};

type ClassificationResult = {
  category: string;
  value: string;
  confidence: number;
  icon: React.ElementType;
};

type ContextSource = {
  name: string;
  type: "drawing" | "specification" | "rfi" | "correspondence";
  revision?: string;
  icon: React.ElementType;
};

type AuditEntry = {
  timestamp: string;
  action: string;
  actor: "AI" | "Human" | "System" | "Platform";
  detail: string;
};

const STEPS: { key: ProcessingStep; label: string; icon: React.ElementType }[] = [
  { key: "trigger", label: "Trigger", icon: Mail },
  { key: "ingestion", label: "Ingestion", icon: FileText },
  { key: "classification", label: "Classification", icon: Brain },
  { key: "context", label: "Context", icon: Search },
  { key: "draft", label: "Draft", icon: Edit3 },
  { key: "accountability", label: "Accountability", icon: Users },
  { key: "review", label: "Review", icon: FileCheck },
  { key: "execution", label: "Execution", icon: Send },
  { key: "tracking", label: "Tracking", icon: Bell },
  { key: "audit", label: "Audit", icon: Shield },
];

const sampleRFI = {
  rfiNumber: "RFI-027",
  subject: "Concrete Foundation Reinforcement Query",
  project: "Lakewood Tower Development",
  issuer: "Turner Building Group",
  issuerContact: "John Mitchell",
  discipline: "Structural",
  priority: "High",
  programmeRisk: "Medium",
  dueDate: "Jan 15, 2025",
  question: "Please clarify the reinforcement requirements for the Level 2 transfer slab at Grid Lines C-D/4-6. The structural drawings show N16 bars at 200mm centres, but the specification calls for N20 bars at 150mm centres. Which requirement takes precedence?",
  attachments: ["SK-STR-027.pdf", "Marked-up Drawing S-401.pdf"],
};

const extractedFields: ExtractedField[] = [
  { field: "Project", value: "Lakewood Tower Development", confidence: 98 },
  { field: "Discipline", value: "Structural Engineering", confidence: 96 },
  { field: "Issuing Party", value: "Turner Building Group", confidence: 99 },
  { field: "Due Date", value: "January 15, 2025", confidence: 99 },
  { field: "Attachments", value: "2 files detected", confidence: 100 },
];

const classificationResults: ClassificationResult[] = [
  { category: "Discipline", value: "Structural", confidence: 94, icon: Building2 },
  { category: "Priority", value: "High", confidence: 91, icon: AlertTriangle },
  { category: "Programme Risk", value: "Medium", confidence: 88, icon: Clock },
  { category: "Suggested Owner", value: "Jane Smith, PE", confidence: 92, icon: User },
];

const contextSources: (ContextSource & { shortName: string })[] = [
  { name: "Drawing S-401", shortName: "S-401", type: "drawing", revision: "Rev C", icon: FileText },
  { name: "Spec Section 03 30 00", shortName: "Spec 03 30", type: "specification", revision: "Issue 4", icon: Layers },
  { name: "RFI-019 (Related)", shortName: "RFI-019", type: "rfi", icon: MessageSquare },
  { name: "Design Team Email Thread", shortName: "Email Thread", type: "correspondence", icon: Mail },
];

const draftResponse = {
  answer: `The structural drawings (S-401 Rev C) shall take precedence for the reinforcement requirements at the Level 2 transfer slab.

The specified reinforcement is N16 bars at 200mm centres (top and bottom) with additional N20 lapping bars at beam intersections as shown in Detail 4/S-401.

The specification reference to N20 bars at 150mm centres applies to the podium slab only (refer Spec Section 03 30 00.3.4), not the transfer structure.`,
  references: [
    "Drawing S-401 Rev C - Transfer Slab Reinforcement",
    "Drawing S-402 Rev B - Typical Slab Details",
    "Specification 03 30 00.3.4 - Podium Structure",
    "AS 3600-2018 Section 9 - Design for Strength and Serviceability",
  ],
  assumptions: [
    "Applied loads as per Structural Design Statement Rev 2",
    "Concrete grade f'c = 40 MPa as specified",
    "No changes to architectural floor levels",
  ],
  suggestedAttachments: ["Marked-up S-401 Rev C", "Specification extract"],
};

export default function RFIManagementDemo() {
  const { applySpeed } = useDemoSpeed();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);
  const [editedResponse, setEditedResponse] = useState(draftResponse.answer);
  const [hasEdited, setHasEdited] = useState(false);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [animationProgress, setAnimationProgress] = useState(0);
  const progressContainerRef = useRef<HTMLDivElement>(null);

  const stepKey = STEPS[currentStep]?.key || "trigger";

  // Navigation functions
  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const goToNextStep = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  // Swipe navigation for mobile
  const stepIndices = STEPS.map((_, i) => i);
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeNavigation({
    items: stepIndices,
    activeItem: currentStep,
    onNavigate: setCurrentStep,
    threshold: 50,
  });

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      if (currentStep > 0 && currentStep < STEPS.length) {
        setProcessingTime((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentStep]);

  // Auto-play effect
  useEffect(() => {
    if (!isAutoPlaying) return;

    // Pause at decision points
    if (stepKey === "accountability" || stepKey === "review") {
      setIsAutoPlaying(false);
      return;
    }

    const timeout = setTimeout(() => {
      if (currentStep < STEPS.length - 1) {
        handleNextStep();
      } else {
        setIsAutoPlaying(false);
      }
    }, applySpeed(4000));

    return () => clearTimeout(timeout);
  }, [isAutoPlaying, currentStep, stepKey]);

  // Animation progress
  useEffect(() => {
    setAnimationProgress(0);
    const interval = setInterval(() => {
      setAnimationProgress((prev) => Math.min(prev + 2, 100));
    }, 50);
    return () => clearInterval(interval);
  }, [currentStep]);

  // Add audit entries as steps progress
  useEffect(() => {
    const newEntries: AuditEntry[] = [];
    const time = new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });

    switch (stepKey) {
      case "trigger":
        if (auditLog.length === 0) {
          newEntries.push({
            timestamp: time,
            action: "RFI Received",
            actor: "Platform",
            detail: "Email notification from Procore - RFI-027",
          });
        }
        break;
      case "ingestion":
        if (!auditLog.find((e) => e.action === "Ingestion Complete")) {
          newEntries.push({
            timestamp: time,
            action: "Ingestion Complete",
            actor: "AI",
            detail: "Email parsed, metadata extracted (98% confidence)",
          });
        }
        break;
      case "classification":
        if (!auditLog.find((e) => e.action === "Classification Complete")) {
          newEntries.push({
            timestamp: time,
            action: "Classification Complete",
            actor: "AI",
            detail: "Discipline: Structural, Priority: High, Risk: Medium",
          });
        }
        break;
      case "context":
        if (!auditLog.find((e) => e.action === "Context Retrieved")) {
          newEntries.push({
            timestamp: time,
            action: "Context Retrieved",
            actor: "AI",
            detail: "4 source documents referenced",
          });
        }
        break;
      case "draft":
        if (!auditLog.find((e) => e.action === "Draft Generated")) {
          newEntries.push({
            timestamp: time,
            action: "Draft Generated",
            actor: "AI",
            detail: "Response drafted with 4 references",
          });
        }
        break;
      case "accountability":
        if (selectedDecision && !auditLog.find((e) => e.action === "Accountability Assigned")) {
          newEntries.push({
            timestamp: time,
            action: "Accountability Assigned",
            actor: "Human",
            detail: `Decision: ${selectedDecision}`,
          });
        }
        break;
      case "review":
        if (hasEdited && !auditLog.find((e) => e.action === "Response Edited")) {
          newEntries.push({
            timestamp: time,
            action: "Response Edited",
            actor: "Human",
            detail: "Human modifications applied to draft",
          });
        }
        break;
      case "execution":
        if (!auditLog.find((e) => e.action === "Response Sent")) {
          newEntries.push({
            timestamp: time,
            action: "Response Sent",
            actor: "System",
            detail: "Email dispatched to Procore, status updated",
          });
        }
        break;
      case "tracking":
        if (!auditLog.find((e) => e.action === "Tracking Active")) {
          newEntries.push({
            timestamp: time,
            action: "Tracking Active",
            actor: "System",
            detail: "RFI-027 moved to Answered, reminders scheduled",
          });
        }
        break;
    }

    if (newEntries.length > 0) {
      setAuditLog((prev) => [...prev, ...newEntries]);
    }
  }, [stepKey, selectedDecision, hasEdited]);

  const handleNextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setProcessingTime(0);
    setSelectedDecision(null);
    setEditedResponse(draftResponse.answer);
    setHasEdited(false);
    setAuditLog([]);
    setIsAutoPlaying(false);
  };

  const handleDecision = (decision: string) => {
    setSelectedDecision(decision);
  };

  const handleEditChange = (value: string) => {
    setEditedResponse(value);
    if (value !== draftResponse.answer) {
      setHasEdited(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return "text-emerald-400";
    if (confidence >= 85) return "text-amber-400";
    return "text-rose-400";
  };

  const renderStepContent = () => {
    switch (stepKey) {
      case "trigger":
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-3 sm:space-y-6"
          >
            {/* Email notification */}
            <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30 rounded-xl p-3 sm:p-6">
              <div className="flex items-start gap-2 sm:gap-4">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                    <span className="text-orange-400 font-medium text-xs sm:text-base">Procore</span>
                    <Badge variant="outline" className="border-orange-500/50 text-orange-400 text-[9px] sm:text-xs px-1 sm:px-2">
                      <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                      External
                    </Badge>
                  </div>
                  <h3 className="text-sm sm:text-lg font-semibold text-foreground mb-1.5 sm:mb-2">
                    New RFI – {sampleRFI.rfiNumber}
                  </h3>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-3 text-[10px] sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                      <Building2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{sampleRFI.project}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">Due: {sampleRFI.dueDate}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{sampleRFI.issuer}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Paperclip className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{sampleRFI.attachments.length} files</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-2 sm:mt-4 p-2 sm:p-4 bg-background/50 rounded-lg border border-border/50">
                <p className="text-[10px] sm:text-sm text-foreground/90 italic line-clamp-3 sm:line-clamp-none">"{sampleRFI.question}"</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-orange-400 text-xs sm:text-base">
              <HardHat className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-center">RFI Received via Email</span>
            </div>
          </motion.div>
        );

      case "ingestion":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3 sm:space-y-6"
          >
            {/* Parsing animation */}
            <div className="bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/30 rounded-xl p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">AI Ingestion</h3>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Extracting metadata...</p>
                </div>
              </div>

              <Progress value={animationProgress} className="h-1.5 sm:h-2 mb-3 sm:mb-6" />

              {/* Extracted fields */}
              <div className="space-y-1.5 sm:space-y-3 max-h-[180px] sm:max-h-none overflow-y-auto">
                {extractedFields.slice(0, 4).map((field, index) => (
                  <motion.div
                    key={field.field}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.15 }}
                    className="flex items-center justify-between p-2 sm:p-3 bg-background/50 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400 flex-shrink-0" />
                      <span className="font-medium text-foreground text-[10px] sm:text-sm truncate">{field.field}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                      <span className="text-muted-foreground text-[10px] sm:text-sm hidden sm:block">{field.value}</span>
                      <Badge className={`${getConfidenceColor(field.confidence)} bg-transparent border-current text-[9px] sm:text-xs px-1 sm:px-2`}>
                        {field.confidence}%
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Structured record preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-card border border-border rounded-xl p-2.5 sm:p-4"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span className="font-medium text-foreground text-xs sm:text-base">RFI Record Created</span>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">RFI:</span>
                  <span className="text-foreground font-mono">{sampleRFI.rfiNumber}</span>
                </div>
                <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-[9px] sm:text-xs">Pending</Badge>
                <Badge variant="outline" className="border-rose-500/50 text-rose-400 text-[9px] sm:text-xs">{sampleRFI.priority}</Badge>
              </div>
            </motion.div>
          </motion.div>
        );

      case "classification":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3 sm:space-y-6"
          >
            <div className="bg-gradient-to-br from-indigo-500/20 to-blue-500/10 border border-indigo-500/30 rounded-xl p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">AI Classification</h3>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Routing & prioritisation</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {classificationResults.map((result, index) => (
                  <motion.div
                    key={result.category}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.2 }}
                    className="p-2 sm:p-4 bg-background/50 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <result.icon className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400" />
                      <span className="text-[10px] sm:text-sm text-muted-foreground truncate">{result.category}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-foreground text-xs sm:text-base truncate">{result.value}</span>
                      <span className={`text-[10px] sm:text-sm font-mono flex-shrink-0 ${getConfidenceColor(result.confidence)}`}>
                        {result.confidence}%
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="bg-card border border-border rounded-xl p-2.5 sm:p-4"
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-medium text-foreground mb-0.5 sm:mb-1 text-xs sm:text-base">AI Reasoning</h4>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">
                    <span className="text-indigo-400">Structural</span> • <span className="text-rose-400">High Priority</span> • Assigned to <span className="text-emerald-400">Jane Smith</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );

      case "context":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3 sm:space-y-6"
          >
            <div className="bg-gradient-to-br from-sky-500/20 to-cyan-500/10 border border-sky-500/30 rounded-xl p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Context Retrieval</h3>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Searching knowledge base...</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {contextSources.map((source, index) => (
                  <motion.div
                    key={source.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="p-2 sm:p-4 bg-background/50 rounded-lg border border-border/50"
                  >
                      <div className="flex items-start gap-1.5 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                        <source.icon className="w-3 h-3 sm:w-4 sm:h-4 text-sky-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-foreground text-[10px] sm:text-sm block"><span className="sm:hidden">{source.shortName}</span><span className="hidden sm:inline">{source.name}</span></span>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[9px] sm:text-xs text-muted-foreground capitalize truncate max-w-[60px] sm:max-w-none">{source.type}</span>
                          {source.revision && (
                            <Badge variant="outline" className="text-[8px] sm:text-xs border-sky-500/50 text-sky-400 px-1 whitespace-nowrap">
                              {source.revision}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex items-center justify-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-sky-500/10 rounded-lg border border-sky-500/30"
            >
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
              <span className="text-[10px] sm:text-sm text-sky-400">4 sources referenced</span>
            </motion.div>
          </motion.div>
        );

      case "draft":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3 sm:space-y-6"
          >
            <div className="bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/30 rounded-xl p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                  <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Draft Response</h3>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">AI-generated, ready for review</p>
                </div>
              </div>

              {/* Draft response */}
              <div className="p-2 sm:p-4 bg-background/50 rounded-lg border border-border/50 mb-3 sm:mb-4 max-h-[150px] sm:max-h-none overflow-y-auto">
                <pre className="whitespace-pre-wrap text-[10px] sm:text-sm text-foreground font-sans leading-relaxed">
                  {draftResponse.answer}
                </pre>
              </div>

              {/* References - compact on mobile */}
              <div className="mb-3 sm:mb-4">
                <h4 className="text-[10px] sm:text-sm font-medium text-foreground mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-teal-400" />
                  References ({draftResponse.references.length})
                </h4>
                <ul className="space-y-0.5 sm:space-y-1 max-h-[60px] sm:max-h-none overflow-y-auto">
                  {draftResponse.references.slice(0, 2).map((ref, i) => (
                    <li key={i} className="text-[9px] sm:text-xs text-muted-foreground flex items-center gap-1 sm:gap-2">
                      <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                      <span className="truncate">{ref}</span>
                    </li>
                  ))}
                  {draftResponse.references.length > 2 && (
                    <li className="text-[9px] sm:text-xs text-teal-400 hidden sm:block">+{draftResponse.references.length - 2} more</li>
                  )}
                </ul>
              </div>

              {/* Assumptions - hidden on mobile */}
              <div className="hidden sm:block">
                <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Assumptions
                </h4>
                <ul className="space-y-1">
                  {draftResponse.assumptions.map((assumption, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                      <ChevronRight className="w-3 h-3" />
                      {assumption}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-teal-500/10 rounded-lg border border-teal-500/30">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400" />
              <span className="text-[10px] sm:text-sm text-teal-400 text-center">Using approved documents only</span>
            </div>
          </motion.div>
        );

      case "accountability":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3 sm:space-y-6"
          >
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Accountability</h3>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Human-in-the-Loop</p>
                </div>
              </div>

              {/* Quest card */}
              <div className="p-2.5 sm:p-5 bg-background/70 rounded-lg border-2 border-amber-500/50 mb-3 sm:mb-6">
                <div className="flex items-center justify-between mb-2 sm:mb-4 gap-2">
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50 text-[9px] sm:text-xs">
                    {sampleRFI.rfiNumber}
                  </Badge>
                  <Badge variant="outline" className="border-rose-500/50 text-rose-400 text-[9px] sm:text-xs">
                    Due: {sampleRFI.dueDate}
                  </Badge>
                </div>
                <h4 className="font-medium text-foreground mb-1 sm:mb-2 text-xs sm:text-base truncate">{sampleRFI.subject}</h4>
                <p className="text-[10px] sm:text-sm text-muted-foreground mb-2 sm:mb-4">
                  Assign to Jane Smith
                </p>

                {/* Action buttons */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                  <Button
                    variant={selectedDecision === "accept" ? "default" : "outline"}
                    className={`flex-col h-auto py-2 sm:py-4 px-1 sm:px-3 ${
                      selectedDecision === "accept"
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                        : "border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                    }`}
                    onClick={() => handleDecision("accept")}
                  >
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 sm:mb-1" />
                    <span className="text-[9px] sm:text-xs">Accept</span>
                  </Button>
                  <Button
                    variant={selectedDecision === "delegate" ? "default" : "outline"}
                    className={`flex-col h-auto py-2 sm:py-4 px-1 sm:px-3 ${
                      selectedDecision === "delegate"
                        ? "bg-blue-500 hover:bg-blue-600 text-white"
                        : "border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                    }`}
                    onClick={() => handleDecision("delegate")}
                  >
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 sm:mb-1" />
                    <span className="text-[9px] sm:text-xs">Delegate</span>
                  </Button>
                  <Button
                    variant={selectedDecision === "reject" ? "default" : "outline"}
                    className={`flex-col h-auto py-2 sm:py-4 px-1 sm:px-3 ${
                      selectedDecision === "reject"
                        ? "bg-rose-500 hover:bg-rose-600 text-white"
                        : "border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
                    }`}
                    onClick={() => handleDecision("reject")}
                  >
                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 sm:mb-1" />
                    <span className="text-[9px] sm:text-xs">Reject</span>
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-amber-400 text-center">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="text-[10px] sm:text-sm font-medium">AI recommends • Humans decide</span>
              </div>
            </div>

            {selectedDecision && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30"
              >
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                <span className="text-[10px] sm:text-sm text-emerald-400">
                  {selectedDecision === "accept" ? "Accepted" : selectedDecision === "delegate" ? "Delegated" : "Returned"}
                </span>
              </motion.div>
            )}
          </motion.div>
        );

      case "review":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3 sm:space-y-6"
          >
            <div className="bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10 border border-purple-500/30 rounded-xl p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <FileCheck className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Human Review</h3>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Edit if needed</p>
                </div>
                {hasEdited && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 text-[9px] sm:text-xs">
                    Modified
                  </Badge>
                )}
              </div>

              <Textarea
                value={editedResponse}
                onChange={(e) => handleEditChange(e.target.value)}
                className={`min-h-[120px] sm:min-h-[200px] bg-background/50 border-border/50 resize-none text-xs sm:text-sm ${
                  hasEdited ? "border-purple-500/50" : ""
                }`}
              />

              <div className="flex gap-2 sm:gap-3 mt-2 sm:mt-4">
                <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 text-[10px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4">
                  <Paperclip className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Attach</span>
                </Button>
                <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 text-[10px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4">
                  <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Clarify</span>
                </Button>
              </div>
            </div>

            {hasEdited && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-purple-500/10 rounded-lg border border-purple-500/30"
              >
                <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                <span className="text-[10px] sm:text-sm text-purple-400">Edits tracked in audit</span>
              </motion.div>
            )}
          </motion.div>
        );

      case "execution":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3 sm:space-y-6"
          >
            <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/30 rounded-xl p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Execution</h3>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Sending response...</p>
                </div>
              </div>

              {/* Progress stages */}
              <div className="space-y-1.5 sm:space-y-3 mb-3 sm:mb-6">
                {["Preparing email", "Updating Procore", "Notifying stakeholders"].map((stage, index) => (
                  <motion.div
                    key={stage}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.4 }}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-background/50 rounded-lg"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.4 + 0.3 }}
                    >
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                    </motion.div>
                    <span className="text-[10px] sm:text-sm text-foreground">{stage}</span>
                  </motion.div>
                ))}
              </div>

              {/* Success confirmation */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 }}
                className="p-2.5 sm:p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                  <span className="font-medium text-emerald-400 text-xs sm:text-base">Sent Successfully</span>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">RFI:</span>
                    <span className="text-foreground font-mono">{sampleRFI.rfiNumber}</span>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px] sm:text-xs">Responded</Badge>
                </div>
              </motion.div>
            </div>

            {/* Recipients notified */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="bg-card border border-border rounded-xl p-2.5 sm:p-4"
            >
              <h4 className="text-[10px] sm:text-sm font-medium text-foreground mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                Recipients
              </h4>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {["Turner", "Procore", "S. Chen", "Archive"].map((recipient) => (
                  <Badge key={recipient} variant="outline" className="text-[9px] sm:text-xs px-1.5 sm:px-2">
                    {recipient}
                  </Badge>
                ))}
              </div>
            </motion.div>
          </motion.div>
        );

      case "tracking":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3 sm:space-y-6"
          >
            <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 rounded-xl p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Tracking</h3>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">RFI monitoring</p>
                </div>
              </div>

              {/* RFI Dashboard preview */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-6">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-2 sm:p-4 bg-amber-500/10 rounded-lg border border-amber-500/30 text-center"
                >
                  <div className="text-lg sm:text-2xl font-bold text-amber-400">12</div>
                  <div className="text-[9px] sm:text-xs text-muted-foreground">Open</div>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="p-2 sm:p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30 text-center"
                >
                  <div className="text-lg sm:text-2xl font-bold text-emerald-400">45</div>
                  <div className="text-[9px] sm:text-xs text-muted-foreground">Answered</div>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-2 sm:p-4 bg-rose-500/10 rounded-lg border border-rose-500/30 text-center"
                >
                  <div className="text-lg sm:text-2xl font-bold text-rose-400">3</div>
                  <div className="text-[9px] sm:text-xs text-muted-foreground">Overdue</div>
                </motion.div>
              </div>

              {/* Reminder timeline */}
              <div className="space-y-1.5 sm:space-y-3 mb-3 sm:mb-4">
                <h4 className="text-[10px] sm:text-sm font-medium text-foreground">Reminders</h4>
                {[
                  { days: "5d", action: "Reminder sent", status: "complete" },
                  { days: "2d", action: "Escalate to PM", status: "scheduled" },
                  { days: "0d", action: "Alert senior mgmt", status: "pending" },
                ].map((reminder, index) => (
                  <motion.div
                    key={reminder.days}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.15 }}
                    className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-background/50 rounded-lg"
                  >
                    <Badge variant="outline" className={`w-10 sm:w-20 justify-center text-[9px] sm:text-xs ${
                      reminder.status === "complete" ? "border-emerald-500/50 text-emerald-400" :
                      reminder.status === "scheduled" ? "border-blue-500/50 text-blue-400" :
                      "border-rose-500/50 text-rose-400"
                    }`}>
                      {reminder.days}
                    </Badge>
                    <span className="text-[10px] sm:text-sm text-muted-foreground flex-1 truncate">{reminder.action}</span>
                    {reminder.status === "complete" && <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 flex-shrink-0" />}
                  </motion.div>
                ))}
              </div>

              {/* Escalation example */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="p-2 sm:p-3 bg-rose-500/10 rounded-lg border border-rose-500/30"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 flex-shrink-0" />
                  <span className="text-[10px] sm:text-sm text-rose-400">RFI-019 escalated (3 missed)</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        );

      case "audit":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3 sm:space-y-6"
          >
            <div className="bg-gradient-to-br from-slate-500/20 to-zinc-500/10 border border-slate-500/30 rounded-xl p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-500/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Decision Record</h3>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">{sampleRFI.rfiNumber} audit trail</p>
                </div>
              </div>

              {/* Audit timeline */}
              <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-6 max-h-[150px] sm:max-h-none overflow-y-auto">
                {auditLog.map((entry, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-background/50 rounded-lg"
                  >
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] sm:text-xs font-medium flex-shrink-0 ${
                      entry.actor === "AI" ? "bg-violet-500/20 text-violet-400" :
                      entry.actor === "Human" ? "bg-emerald-500/20 text-emerald-400" :
                      entry.actor === "Platform" ? "bg-orange-500/20 text-orange-400" :
                      "bg-blue-500/20 text-blue-400"
                    }`}>
                      {entry.actor === "AI" ? "AI" : entry.actor === "Human" ? "H" : entry.actor === "Platform" ? "P" : "S"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="font-medium text-foreground text-[10px] sm:text-sm truncate">{entry.action}</span>
                        <span className="text-[9px] sm:text-xs text-muted-foreground flex-shrink-0">{entry.timestamp}</span>
                      </div>
                      <p className="text-[9px] sm:text-xs text-muted-foreground truncate hidden sm:block">{entry.detail}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Documents referenced - compact on mobile */}
              <div className="mb-3 sm:mb-4 hidden sm:block">
                <h4 className="text-sm font-medium text-foreground mb-2">Documents Referenced</h4>
                <div className="flex flex-wrap gap-2">
                  {contextSources.map((source) => (
                    <Badge key={source.name} variant="outline" className="text-xs">
                      {source.name} {source.revision && `(${source.revision})`}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Governance badges */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 text-[9px] sm:text-xs px-1.5 sm:px-2">
                  <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                  Traceable
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 text-[9px] sm:text-xs px-1.5 sm:px-2">
                  <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                  Defensible
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 text-[9px] sm:text-xs px-1.5 sm:px-2">
                  <FileCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                  Compliant
                </Badge>
              </div>
            </div>

            {/* Completion summary */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 }}
              className="bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-yellow-500/20 border border-orange-500/30 rounded-xl p-3 sm:p-6 text-center"
            >
              <h3 className="text-sm sm:text-xl font-bold text-foreground mb-1 sm:mb-2">RFI Complete</h3>
              <p className="text-[10px] sm:text-base text-muted-foreground mb-2 sm:mb-4 hidden sm:block">
                Fast RFI handling with clear ownership and defensible answers.
              </p>
              <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
                <div>
                  <div className="text-sm sm:text-2xl font-bold text-orange-400">{formatTime(processingTime)}</div>
                  <div className="text-[9px] sm:text-xs text-muted-foreground">Time</div>
                </div>
                <div>
                  <div className="text-sm sm:text-2xl font-bold text-amber-400">97%</div>
                  <div className="text-[9px] sm:text-xs text-muted-foreground">Conf.</div>
                </div>
                <div>
                  <div className="text-sm sm:text-2xl font-bold text-yellow-400">4</div>
                  <div className="text-[9px] sm:text-xs text-muted-foreground">Sources</div>
                </div>
                <div>
                  <div className="text-sm sm:text-2xl font-bold text-emerald-400">{auditLog.length}</div>
                  <div className="text-[9px] sm:text-xs text-muted-foreground">Audit</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-2xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
                <HardHat className="w-5 h-5 sm:w-7 sm:h-7 text-orange-400 flex-shrink-0" />
                <span className="truncate">RFI Management</span>
              </h1>
              <p className="text-xs sm:text-base text-muted-foreground mt-0.5 sm:mt-1 truncate">Procore Integration</p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              <InlineDemoSpeedControl compact className="hidden sm:flex" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 h-8 px-2 sm:px-3"
              >
                {isAutoPlaying ? <Pause className="w-3.5 h-3.5 sm:mr-2" /> : <Play className="w-3.5 h-3.5 sm:mr-2" />}
                <span className="hidden sm:inline">{isAutoPlaying ? "Pause" : "Auto"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="border-border hover:bg-muted h-8 px-2 sm:px-3"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:mr-2" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="bg-background/50 rounded-lg p-2 sm:p-3 border border-border/50">
              <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm text-muted-foreground">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Time</span>
              </div>
              <div className="text-sm sm:text-xl font-bold text-foreground">{formatTime(processingTime)}</div>
            </div>
            <div className="bg-background/50 rounded-lg p-2 sm:p-3 border border-border/50">
              <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm text-muted-foreground">
                <Brain className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Confidence</span>
              </div>
              <div className="text-sm sm:text-xl font-bold text-foreground">
                {currentStep > 0 ? `${Math.min(95 + currentStep, 99)}%` : "—"}
              </div>
            </div>
            <div className="bg-background/50 rounded-lg p-2 sm:p-3 border border-border/50">
              <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm text-muted-foreground">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Steps</span>
              </div>
              <div className="text-sm sm:text-xl font-bold text-foreground">{currentStep}/{STEPS.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Step Progress - with arrows and mobile swipe */}
      <div 
        className="bg-card/50 border-b border-border/50 py-2 sm:py-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-6">
          <div className="flex items-center gap-2">
            {/* Left Arrow */}
            <button
              onClick={goToPrevStep}
              disabled={currentStep === 0}
              className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 ${
                currentStep === 0
                  ? "border-muted bg-muted/20 text-muted-foreground cursor-not-allowed"
                  : "border-primary bg-primary/10 text-primary hover:bg-primary/20"
              }`}
              aria-label="Previous step"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Steps - horizontal scroll on mobile */}
            <div 
              ref={progressContainerRef}
              className="flex-1 min-w-0 overflow-x-auto scrollbar-none touch-pan-x overscroll-contain"
            >
              <div className="flex items-center gap-1 sm:gap-0 sm:justify-between min-w-max px-2 pr-8">
                {STEPS.map((step, index) => (
                  <React.Fragment key={step.key}>
                    <button
                      onClick={() => setCurrentStep(index)}
                      className={`flex flex-col items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-2 rounded-lg transition-all shrink-0 ${
                        index === currentStep
                          ? "bg-orange-500/20 text-orange-400"
                          : index < currentStep
                          ? "text-emerald-400"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 shrink-0 ${
                        index === currentStep
                          ? "border-orange-500 bg-orange-500/20"
                          : index < currentStep
                          ? "border-emerald-500 bg-emerald-500/20"
                          : "border-muted bg-muted/20"
                      }`}>
                        {index < currentStep ? (
                          <CheckCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                        ) : (
                          <step.icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                        )}
                      </div>
                      <span className="text-[9px] sm:text-xs font-medium whitespace-nowrap">{step.label}</span>
                    </button>
                    {index < STEPS.length - 1 && (
                      <div className={`w-3 sm:w-8 h-0.5 shrink-0 ${index < currentStep ? "bg-emerald-500" : "bg-muted"}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Right Arrow */}
            <button
              onClick={goToNextStep}
              disabled={currentStep === STEPS.length - 1}
              className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 ${
                currentStep === STEPS.length - 1
                  ? "border-muted bg-muted/20 text-muted-foreground cursor-not-allowed"
                  : "border-primary bg-primary/10 text-primary hover:bg-primary/20"
              }`}
              aria-label="Next step"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Step Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={stepKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-4 sm:mt-8">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 0}
                className="border-border h-9 px-3"
              >
                <ChevronLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={currentStep === STEPS.length - 1}
                className="bg-orange-500 hover:bg-orange-600 text-white h-9 px-3"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4 sm:ml-2" />
              </Button>
            </div>
          </div>

          {/* Running Audit Log - hidden on mobile, shown at bottom */}
          <div className="lg:col-span-1 order-last lg:order-none">
            <Card className="bg-card/50 border-border/50 lg:sticky lg:top-4">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
                  Activity Log
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="space-y-1.5 sm:space-y-2 max-h-[200px] sm:max-h-[500px] overflow-y-auto">
                  {auditLog.length === 0 ? (
                    <p className="text-xs sm:text-sm text-muted-foreground text-center py-3 sm:py-4">
                      Activity will appear here...
                    </p>
                  ) : (
                    auditLog.map((entry, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-1.5 sm:p-2 bg-background/50 rounded-lg border border-border/30"
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                          <Badge variant="outline" className={`text-[9px] sm:text-xs px-1 sm:px-1.5 py-0 ${
                            entry.actor === "AI" ? "border-violet-500/50 text-violet-400" :
                            entry.actor === "Human" ? "border-emerald-500/50 text-emerald-400" :
                            entry.actor === "Platform" ? "border-orange-500/50 text-orange-400" :
                            "border-blue-500/50 text-blue-400"
                          }`}>
                            {entry.actor}
                          </Badge>
                          <span className="text-[9px] sm:text-xs text-muted-foreground">{entry.timestamp}</span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-foreground truncate">{entry.action}</p>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
