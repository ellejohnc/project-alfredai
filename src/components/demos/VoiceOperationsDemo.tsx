import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { InlineDemoSpeedControl } from "@/components/demos/shared/InlineDemoSpeedControl";
import {
  Phone,
  PhoneIncoming,
  PhoneCall,
  Brain,
  Users,
  User,
  AlertTriangle,
  Calendar,
  Mail,
  MessageSquare,
  BarChart3,
  Activity,
  Shield,
  History,
  CheckCircle,
  Clock,
  Zap,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Headphones,
  TrendingUp,
  FileText,
  Target,
  Radio,
} from "lucide-react";

type ProcessingStep =
  | "intake"
  | "parallel"
  | "intent"
  | "routing"
  | "escalation"
  | "orchestration"
  | "processing"
  | "accountability"
  | "dashboard"
  | "audit";

interface CallData {
  id: string;
  caller: string;
  company: string;
  phone: string;
  intent: string;
  intentIcon: typeof Phone;
  sentiment: "positive" | "neutral" | "negative";
  confidence: number;
  status: "active" | "resolved" | "escalated" | "followup";
  duration: string;
  aiDecision: string;
  actions: string[];
}

const STEPS: { id: ProcessingStep; label: string; icon: typeof Phone; color: string }[] = [
  { id: "intake", label: "Call Intake", icon: PhoneIncoming, color: "text-rose-500" },
  { id: "parallel", label: "Parallel Sessions", icon: Radio, color: "text-violet-500" },
  { id: "intent", label: "Intent Detection", icon: Brain, color: "text-blue-500" },
  { id: "routing", label: "Call Routing", icon: ArrowRight, color: "text-emerald-500" },
  { id: "escalation", label: "Human Escalation", icon: Users, color: "text-amber-500" },
  { id: "orchestration", label: "Action Orchestration", icon: Zap, color: "text-primary" },
  { id: "processing", label: "After-Call Processing", icon: FileText, color: "text-cyan-500" },
  { id: "accountability", label: "Task Assignment", icon: Target, color: "text-orange-500" },
  { id: "dashboard", label: "Live Dashboard", icon: BarChart3, color: "text-indigo-500" },
  { id: "audit", label: "Audit Trail", icon: Shield, color: "text-slate-500" },
];

const sampleCalls: CallData[] = [
  {
    id: "call-001",
    caller: "Sarah Mitchell",
    company: "ABC Corp",
    phone: "+61 4XX XXX 123",
    intent: "Booking",
    intentIcon: Calendar,
    sentiment: "positive",
    confidence: 94,
    status: "resolved",
    duration: "1:24",
    aiDecision: "Resolved by AI",
    actions: ["Calendar booking created", "Confirmation email sent", "CRM updated"],
  },
  {
    id: "call-002",
    caller: "Mike Thompson",
    company: "Thompson & Co",
    phone: "+61 4XX XXX 456",
    intent: "Support",
    intentIcon: Headphones,
    sentiment: "negative",
    confidence: 91,
    status: "escalated",
    duration: "2:45",
    aiDecision: "Escalated due to urgency",
    actions: ["Ticket created", "Agent notified", "Priority: High"],
  },
  {
    id: "call-003",
    caller: "Emma Johnson",
    company: "Bright Solutions",
    phone: "+61 4XX XXX 789",
    intent: "Sales",
    intentIcon: TrendingUp,
    sentiment: "positive",
    confidence: 88,
    status: "followup",
    duration: "3:12",
    aiDecision: "Follow-up required",
    actions: ["Lead captured", "Quote task created", "Follow-up scheduled"],
  },
  {
    id: "call-004",
    caller: "James Wilson",
    company: "Wilson Logistics",
    phone: "+61 4XX XXX 321",
    intent: "Reschedule",
    intentIcon: Clock,
    sentiment: "neutral",
    confidence: 96,
    status: "resolved",
    duration: "0:58",
    aiDecision: "Resolved by AI",
    actions: ["Appointment rescheduled", "SMS confirmation sent"],
  },
];

const VoiceOperationsDemo = () => {
  const [currentStep, setCurrentStep] = useState<ProcessingStep>("intake");
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [activeCalls, setActiveCalls] = useState(0);
  const [callsHandled, setCallsHandled] = useState(0);
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  // Simulate call counter animation
  useEffect(() => {
    if (currentStep === "intake") {
      const interval = setInterval(() => {
        setActiveCalls((prev) => Math.min(prev + Math.floor(Math.random() * 3) + 1, 47));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === "dashboard") {
      setCallsHandled(342);
    }
  }, [currentStep]);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setTimeout(() => {
      if (currentStepIndex < STEPS.length - 1) {
        setCurrentStep(STEPS[currentStepIndex + 1].id);
      } else {
        setIsAutoPlaying(false);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [isAutoPlaying, currentStepIndex]);

  const handleNext = useCallback(() => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1].id);
    }
  }, [currentStepIndex]);

  const handlePrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
    }
  }, [currentStepIndex]);

  const handleReset = useCallback(() => {
    setCurrentStep("intake");
    setIsAutoPlaying(false);
    setActiveCalls(0);
    setCallsHandled(0);
    setSelectedDecision(null);
  }, []);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-emerald-500 bg-emerald-500/10";
      case "negative":
        return "text-rose-500 bg-rose-500/10";
      default:
        return "text-amber-500 bg-amber-500/10";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "escalated":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "followup":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-violet-500/20 text-violet-400 border-violet-500/30";
    }
  };

  const renderCallCard = (call: CallData, index: number, showDetails: boolean = false) => {
    const IntentIcon = call.intentIcon;
    return (
      <motion.div
        key={call.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-card/50 border border-border/50 rounded-lg p-4 space-y-3"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{call.caller}</p>
              <p className="text-sm text-muted-foreground">{call.company}</p>
            </div>
          </div>
          <Badge variant="outline" className={getStatusColor(call.status)}>
            {call.status === "active" && <Radio className="w-3 h-3 mr-1 animate-pulse" />}
            {call.status}
          </Badge>
        </div>

        {showDetails && (
          <>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <IntentIcon className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Intent:</span>
                <span className="text-foreground font-medium">{call.intent}</span>
              </div>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${getSentimentColor(call.sentiment)}`}>
                <span className="text-xs capitalize">{call.sentiment}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Confidence</span>
                <span className="text-foreground font-medium">{call.confidence}%</span>
              </div>
              <Progress value={call.confidence} className="h-1.5" />
            </div>
          </>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {call.duration}
          </span>
          <span>{call.phone}</span>
        </div>
      </motion.div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "intake":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">
                Concurrent Call Handling — AI Scales Instantly
              </Badge>
              <div className="flex items-center justify-center gap-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <div className="text-5xl font-bold text-primary mb-2 tabular-nums">{activeCalls}</div>
                  <p className="text-sm text-muted-foreground">Active Calls</p>
                </motion.div>
                <div className="h-16 w-px bg-border" />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <div className="text-5xl font-bold text-emerald-500 mb-2 tabular-nums">0%</div>
                  <p className="text-sm text-muted-foreground">Drop Rate</p>
                </motion.div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card/30 border border-border/30 rounded-lg p-3 flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <PhoneCall className="w-4 h-4 text-emerald-500 animate-pulse" />
                  </div>
                  <div className="text-xs">
                    <p className="text-foreground font-medium">Call #{1000 + i}</p>
                    <p className="text-muted-foreground">Connected</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
              <p className="text-emerald-400 font-medium">No waiting tone • Zero call drops • Instant answer</p>
            </div>
          </div>
        );

      case "parallel":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                Each call handled independently, without interference
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {sampleCalls.map((call, index) => (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className="bg-card/50 border border-border/50 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-violet-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{call.caller}</p>
                      <p className="text-sm text-muted-foreground">{call.intent} enquiry</p>
                    </div>
                    <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30">
                      <Radio className="w-3 h-3 mr-1 animate-pulse" />
                      Live
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Isolated Memory</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Brain className="w-3.5 h-3.5" />
                      <span>Independent Intent Detection</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Separate Execution Path</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case "intent":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                Real-Time Intent & Sentiment Detection
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {sampleCalls.map((call, index) => renderCallCard(call, index, true))}
            </div>
          </div>
        );

      case "routing":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                Dynamic Call Routing Decisions
              </Badge>
            </div>

            <div className="space-y-4">
              {sampleCalls.map((call, index) => (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className="bg-card/50 border border-border/50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{call.caller}</p>
                        <p className="text-sm text-muted-foreground">{call.intent}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      <Badge className={getStatusColor(call.status)}>
                        {call.status === "resolved" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {call.status === "escalated" && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {call.status === "followup" && <Calendar className="w-3 h-3 mr-1" />}
                        {call.aiDecision}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case "escalation":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                Controlled Human Escalation (Capacity-Aware)
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card/50 border border-amber-500/30 rounded-lg p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Escalated Call</p>
                    <p className="text-sm text-muted-foreground">Mike Thompson - Support Issue</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Live Summary for Agent</p>
                    <p className="text-sm text-foreground">Billing discrepancy reported. Customer frustrated. Previous payments on file. Requires account review.</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Suggested Next Steps</p>
                    <ul className="text-sm text-foreground space-y-1">
                      <li>• Review last 3 invoices</li>
                      <li>• Verify payment records</li>
                      <li>• Offer credit if applicable</li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card/50 border border-border/50 rounded-lg p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-6 h-6 text-primary" />
                  <p className="font-medium text-foreground">Agent Availability</p>
                </div>

                <div className="space-y-3">
                  {["Available", "Available", "On Call", "Available", "Busy"].map((status, i) => (
                    <div key={i} className="flex items-center justify-between bg-background/30 rounded-lg p-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm text-foreground">Agent {i + 1}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          status === "Available"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : status === "On Call"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }
                      >
                        {status}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm text-emerald-400 font-medium">3/5 agents available</p>
                </div>
              </motion.div>
            </div>

            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
              <p className="text-primary font-medium">AI absorbs volume. Humans handle exceptions.</p>
            </div>
          </div>
        );

      case "orchestration":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Badge className="bg-primary/20 text-primary border-primary/30">
                Post-Call Action Orchestration
              </Badge>
            </div>

            <div className="space-y-4">
              {sampleCalls.map((call, callIndex) => (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: callIndex * 0.15 }}
                  className="bg-card/50 border border-border/50 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{call.caller}</p>
                      <p className="text-xs text-muted-foreground">{call.aiDecision}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {call.actions.map((action, actionIndex) => (
                      <motion.div
                        key={action}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: callIndex * 0.15 + actionIndex * 0.1 }}
                        className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm text-foreground truncate">{action}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case "processing":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                After-Call AI Processing
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {sampleCalls.slice(0, 2).map((call, index) => (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-card/50 border border-border/50 rounded-lg p-5"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{call.caller}</p>
                      <p className="text-sm text-muted-foreground">{call.company}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-background/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <FileText className="w-3 h-3" />
                        Call Transcription
                      </div>
                      <div className="h-2 bg-cyan-500/30 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 1.5, delay: index * 0.3 }}
                          className="h-full bg-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="bg-background/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Brain className="w-3 h-3" />
                        Summary Generated
                      </div>
                      <p className="text-sm text-foreground">
                        {index === 0
                          ? "Customer requested appointment booking for next Tuesday. Confirmed availability and sent calendar invite."
                          : "Customer reported billing issue with last invoice. Escalated to support team for account review."}
                      </p>
                    </div>

                    <div className="bg-background/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Zap className="w-3 h-3" />
                        Key Data Extracted
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">{call.intent}</Badge>
                        <Badge variant="secondary" className="text-xs">{call.company}</Badge>
                        <Badge variant="secondary" className="text-xs">{call.phone}</Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 text-center">
              <p className="text-cyan-400 font-medium">Happens without delaying other live calls</p>
            </div>
          </div>
        );

      case "accountability":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                Accountability & Task Assignment
              </Badge>
            </div>

            <div className="space-y-4">
              {[
                { title: "Follow-up call required", caller: "Emma Johnson", urgency: "Medium" },
                { title: "Quote preparation needed", caller: "Emma Johnson", urgency: "High" },
                { title: "Issue resolution pending", caller: "Mike Thompson", urgency: "High" },
              ].map((quest, index) => (
                <motion.div
                  key={quest.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className="bg-card/50 border border-border/50 rounded-lg p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <Target className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{quest.title}</p>
                        <p className="text-sm text-muted-foreground">From call with {quest.caller}</p>
                      </div>
                    </div>
                    <Badge
                      className={
                        quest.urgency === "High"
                          ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }
                    >
                      {quest.urgency} Priority
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={selectedDecision === `${quest.title}-accept` ? "default" : "outline"}
                      onClick={() => setSelectedDecision(`${quest.title}-accept`)}
                      className="flex-1 min-w-[120px]"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Set Start Date
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedDecision === `${quest.title}-delegate` ? "default" : "outline"}
                      onClick={() => setSelectedDecision(`${quest.title}-delegate`)}
                      className="flex-1 min-w-[120px]"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Delegate
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedDecision === `${quest.title}-reject` ? "destructive" : "outline"}
                      onClick={() => setSelectedDecision(`${quest.title}-reject`)}
                      className="flex-1 min-w-[120px]"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 text-center">
              <p className="text-orange-400 font-medium">Nothing falls through the cracks.</p>
            </div>
          </div>
        );

      case "dashboard":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                Concurrency Monitoring Dashboard
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Active Calls", value: "47", subtext: "/ 100 capacity", icon: PhoneCall, color: "text-violet-500" },
                { label: "Calls / Hour", value: "342", subtext: "+12% vs avg", icon: TrendingUp, color: "text-emerald-500" },
                { label: "AI Resolution", value: "78%", subtext: "vs 22% Human", icon: Brain, color: "text-blue-500" },
                { label: "Escalation Rate", value: "8%", subtext: "Below target", icon: AlertTriangle, color: "text-amber-500" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card/50 border border-border/50 rounded-lg p-4 text-center"
                >
                  <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                  <div className="text-2xl font-bold text-foreground tabular-nums">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xs text-muted-foreground/70">{stat.subtext}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card/50 border border-border/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Resolution Distribution
                </h4>
                <div className="space-y-3">
                  {[
                    { label: "Resolved by AI", value: 78, color: "bg-emerald-500" },
                    { label: "Human Assisted", value: 14, color: "bg-blue-500" },
                    { label: "Escalated", value: 8, color: "bg-amber-500" },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="text-foreground font-medium">{item.value}%</span>
                      </div>
                      <div className="h-2 bg-background rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className={`h-full ${item.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card/50 border border-border/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Performance Metrics
                </h4>
                <div className="space-y-3">
                  {[
                    { label: "Avg Handle Time", value: "2m 34s" },
                    { label: "First Call Resolution", value: "89%" },
                    { label: "Customer Satisfaction", value: "4.7/5" },
                    { label: "Peak Concurrency Today", value: "67 calls" },
                  ].map((metric) => (
                    <div key={metric.label} className="flex items-center justify-between bg-background/30 rounded-lg p-2.5">
                      <span className="text-sm text-muted-foreground">{metric.label}</span>
                      <span className="text-sm font-medium text-foreground">{metric.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "audit":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                Audit & Traceability
              </Badge>
            </div>

            <div className="bg-card/50 border border-border/50 rounded-lg overflow-hidden">
              <div className="bg-background/50 px-4 py-3 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Call Execution Record</p>
                    <p className="text-sm text-muted-foreground">Call #1002 - Sarah Mitchell</p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="bg-background/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <FileText className="w-3 h-3" />
                    Transcript Preview
                  </div>
                  <p className="text-sm text-foreground italic">
                    "Hi, I'd like to book an appointment for next Tuesday please..."
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-background/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Brain className="w-3 h-3" />
                      AI Analysis
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Intent</span>
                        <span className="text-foreground">Booking</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sentiment</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Positive</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className="text-foreground">94%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-background/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Zap className="w-3 h-3" />
                      Actions Executed
                    </div>
                    <div className="space-y-1.5">
                      {["Calendar booking created", "Confirmation email sent", "CRM record updated"].map((action) => (
                        <div key={action} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-foreground">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-background/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <History className="w-3 h-3" />
                    Timeline
                  </div>
                  <div className="space-y-2">
                    {[
                      { time: "10:24:01", event: "Call received" },
                      { time: "10:24:03", event: "AI agent connected" },
                      { time: "10:24:45", event: "Intent detected: Booking" },
                      { time: "10:25:12", event: "Appointment confirmed" },
                      { time: "10:25:25", event: "Call ended - Resolved by AI" },
                      { time: "10:25:26", event: "Post-call actions triggered" },
                      { time: "10:25:28", event: "All actions completed" },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <span className="text-xs text-muted-foreground font-mono w-16">{item.time}</span>
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-foreground">{item.event}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border/50 pt-3">
                  <span>Human Involvement: None required</span>
                  <span>Compliance: Full audit trail preserved</span>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-primary/20 via-violet-500/20 to-emerald-500/20 border border-primary/30 rounded-lg p-6 text-center"
            >
              <CheckCircle className="w-10 h-10 text-primary mx-auto mb-3" />
              <p className="text-lg font-semibold text-foreground mb-2">
                High-volume calls handled concurrently
              </p>
              <p className="text-muted-foreground">
                With automatic follow-ups and zero dropped work.
              </p>
            </motion.div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full bg-gradient-to-br from-background via-card to-background border-border/50 shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-card/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-foreground">Voice AI Operations Agent</CardTitle>
              <p className="text-sm text-muted-foreground">High-Volume, Concurrent Calls</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <InlineDemoSpeedControl compact className="hidden sm:flex" />
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            <Button
              variant={isAutoPlaying ? "secondary" : "default"}
              size="sm"
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            >
              {isAutoPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  Auto-Play
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Progress Steps */}
        <div className="p-4 border-b border-border/50 bg-card/30 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isPast = index < currentStepIndex;
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-primary/20 text-primary"
                      : isPast
                      ? "text-emerald-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? step.color : ""}`} />
                  <span className="hidden md:inline">{step.label}</span>
                  {isPast && <CheckCircle className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 min-h-[500px]">
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

        {/* Navigation */}
        <div className="p-4 border-t border-border/50 bg-card/30 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Step {currentStepIndex + 1} of {STEPS.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentStepIndex === STEPS.length - 1}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceOperationsDemo;
