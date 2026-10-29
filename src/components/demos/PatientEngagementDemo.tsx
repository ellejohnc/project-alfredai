import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  Bot, User, Calendar, Bell, Clock, CheckCircle2, 
  Phone, MessageSquare, Mail, Heart, Activity,
  Send, RefreshCcw, AlertCircle, TrendingUp,
  Star, ThumbsUp, ThumbsDown, Pill, Stethoscope,
  Building2, FileCheck, Loader2, Play, SkipForward, Pause,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { InlineDemoSpeedControl } from "@/components/demos/shared/InlineDemoSpeedControl";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";

type DemoStep = {
  id: string;
  type: "booking" | "reminder" | "followup" | "survey" | "prescription" | "engagement";
  title: string;
  description: string;
  status: "pending" | "active" | "completed";
};

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
  channel?: "sms" | "email" | "call";
};

const initialSteps: DemoStep[] = [
  { id: "1", type: "booking", title: "Smart Booking", description: "AI schedules optimal appointment slots", status: "pending" },
  { id: "2", type: "reminder", title: "Reminders", description: "Automated multi-channel reminders", status: "pending" },
  { id: "3", type: "followup", title: "No-Show Recovery", description: "Instant rebooking for missed appointments", status: "pending" },
  { id: "4", type: "survey", title: "NPS Survey", description: "Post-appointment satisfaction feedback", status: "pending" },
  { id: "5", type: "prescription", title: "Rx Refill", description: "Prescription reminders & approvals", status: "pending" },
  { id: "6", type: "engagement", title: "Results", description: "Patient retention metrics", status: "pending" },
];

const bookingConversation: Message[] = [
  { id: "b1", role: "assistant", content: "Hi Sarah! 👋 I'm the HealthFirst Clinic assistant. How can I help you today?" },
  { id: "b2", role: "user", content: "I need to book an appointment with Dr. Chen" },
  { id: "b3", role: "assistant", content: "I'd be happy to help! Dr. Chen has availability this week. Based on your history, I recommend a 30-min consultation. Tuesday 10am or Thursday 2pm?" },
  { id: "b4", role: "user", content: "Tuesday 10am please" },
  { id: "b5", role: "assistant", content: "Perfect! ✅ Booked with Dr. Chen for Tuesday at 10:00 AM. You'll receive confirmation shortly." },
];

const reminderSequence = [
  { time: "72h before", channel: "email" as const, message: "Your appointment with Dr. Chen is in 3 days. Review pre-appointment checklist →", icon: Mail },
  { time: "24h before", channel: "sms" as const, message: "Reminder: Appointment tomorrow at 10am. Reply YES to confirm.", icon: MessageSquare },
  { time: "2h before", channel: "sms" as const, message: "See you in 2 hours! Clinic: 123 Health St. Free parking available.", icon: MessageSquare },
];

const noShowRecovery: Message[] = [
  { id: "n1", role: "assistant", content: "Hi Sarah, I noticed you missed your 10am appointment. Is everything okay? 💙", channel: "sms" },
  { id: "n2", role: "user", content: "Sorry, had an emergency at work" },
  { id: "n3", role: "assistant", content: "No problem! Dr. Chen has openings tomorrow at 9am or 4pm. Which works?", channel: "sms" },
  { id: "n4", role: "user", content: "4pm tomorrow" },
  { id: "n5", role: "assistant", content: "Done! ✅ Rebooked for tomorrow 4pm. See you then!", channel: "sms" },
];

const surveyConversation: Message[] = [
  { id: "s1", role: "assistant", content: "Hi Sarah! Thank you for visiting HealthFirst Clinic today. How would you rate your experience with Dr. Chen? (1-10)", channel: "sms" },
  { id: "s2", role: "user", content: "9" },
  { id: "s3", role: "assistant", content: "Wonderful! 🎉 We're so glad you had a great experience. Would you recommend HealthFirst to friends or family? Reply YES or NO", channel: "sms" },
  { id: "s4", role: "user", content: "YES definitely!" },
  { id: "s5", role: "assistant", content: "Thank you! 💚 Your feedback helps us improve. We've added 50 loyalty points to your account. See you next time!", channel: "sms" },
];

const prescriptionWorkflow = [
  { step: "Patient Request", description: "Sarah requests Metformin refill via app", icon: Pill, status: "complete" as const },
  { step: "AI Validation", description: "Checking prescription history & eligibility", icon: FileCheck, status: "complete" as const },
  { step: "Doctor Approval", description: "Dr. Chen approves refill request", icon: Stethoscope, status: "complete" as const },
  { step: "Pharmacy Notification", description: "CVS Pharmacy notified - ready in 2hrs", icon: Building2, status: "complete" as const },
  { step: "Patient Alert", description: "SMS sent: Your prescription is ready!", icon: MessageSquare, status: "complete" as const },
];

export default function PatientEngagementDemo() {
  const [steps, setSteps] = useState<DemoStep[]>(initialSteps);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMsgIndex, setCurrentMsgIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [reminderIndex, setReminderIndex] = useState(0);
  const [prescriptionIndex, setPrescriptionIndex] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stepsScrollRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[activeStepIndex];

  // Scroll arrows
  const scrollSteps = (direction: "left" | "right") => {
    if (stepsScrollRef.current) {
      const scrollAmount = 120;
      stepsScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Swipe navigation for steps
  const handleStepNavigate = useCallback((step: DemoStep) => {
    const stepIndex = steps.findIndex(s => s.id === step.id);
    if (stepIndex > activeStepIndex) {
      // Only allow advancing to next step
      if (stepIndex === activeStepIndex + 1 && currentStep?.status === "active") {
        // Use skipToNextStep logic inline to avoid circular dependency
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setIsTyping(false);
        setSteps(prev => prev.map((s, i) => 
          i === activeStepIndex ? { ...s, status: "completed" } : s
        ));
        if (activeStepIndex < steps.length - 1) {
          setTimeout(() => {
            setActiveStepIndex(prev => prev + 1);
            setSteps(prev => prev.map((s, i) => 
              i === activeStepIndex + 1 ? { ...s, status: "active" } : s
            ));
            setMessages([]);
            setCurrentMsgIndex(0);
            setReminderIndex(0);
            setPrescriptionIndex(0);
            setShowStats(false);
          }, 500);
        }
      }
    }
  }, [steps, activeStepIndex, currentStep?.status]);

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeNavigation({
    items: steps,
    activeItem: steps[activeStepIndex],
    onNavigate: handleStepNavigate,
    threshold: 50,
  });

  // Auto-scroll messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Get current conversation based on step
  const getCurrentConversation = useCallback(() => {
    switch (currentStep?.type) {
      case "booking": return bookingConversation;
      case "followup": return noShowRecovery;
      case "survey": return surveyConversation;
      default: return [];
    }
  }, [currentStep?.type]);

  // Clear any existing timer
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Complete current step and move to next
  const completeCurrentStep = useCallback(() => {
    clearTimer();
    
    setSteps(prev => prev.map((s, i) => 
      i === activeStepIndex ? { ...s, status: "completed" } : s
    ));
    
    if (activeStepIndex < steps.length - 1) {
      timerRef.current = setTimeout(() => {
        setActiveStepIndex(prev => prev + 1);
        setSteps(prev => prev.map((s, i) => 
          i === activeStepIndex + 1 ? { ...s, status: "active" } : s
        ));
        setMessages([]);
        setCurrentMsgIndex(0);
        setReminderIndex(0);
        setPrescriptionIndex(0);
        setShowStats(false);
      }, 500);
    }
  }, [activeStepIndex, steps.length, clearTimer]);

  // Skip to next step manually
  const skipToNextStep = () => {
    clearTimer();
    setIsTyping(false);
    completeCurrentStep();
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  // Main animation driver
  useEffect(() => {
    if (!isPlaying) return;
    clearTimer();

    const chatSteps = ["booking", "followup", "survey"];
    
    // Chat-based animations
    if (chatSteps.includes(currentStep?.type)) {
      const conversation = getCurrentConversation();
      
      if (currentMsgIndex >= conversation.length) {
        timerRef.current = setTimeout(completeCurrentStep, 1500);
        return;
      }

      const message = conversation[currentMsgIndex];
      
      if (message.role === "assistant") {
        setIsTyping(true);
        timerRef.current = setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [...prev, message]);
          setCurrentMsgIndex(prev => prev + 1);
        }, 1200);
      } else {
        timerRef.current = setTimeout(() => {
          setMessages(prev => [...prev, message]);
          setCurrentMsgIndex(prev => prev + 1);
        }, 800);
      }
      return;
    }

    // Reminder animations
    if (currentStep?.type === "reminder") {
      if (reminderIndex >= reminderSequence.length) {
        timerRef.current = setTimeout(completeCurrentStep, 1500);
        return;
      }
      timerRef.current = setTimeout(() => {
        setReminderIndex(prev => prev + 1);
      }, 1800);
      return;
    }

    // Prescription animations
    if (currentStep?.type === "prescription") {
      if (prescriptionIndex >= prescriptionWorkflow.length) {
        timerRef.current = setTimeout(completeCurrentStep, 1500);
        return;
      }
      timerRef.current = setTimeout(() => {
        setPrescriptionIndex(prev => prev + 1);
      }, 1500);
      return;
    }

    // Engagement stats
    if (currentStep?.type === "engagement") {
      timerRef.current = setTimeout(() => setShowStats(true), 400);
    }

    return clearTimer;
  }, [isPlaying, currentStep?.type, currentMsgIndex, reminderIndex, prescriptionIndex, getCurrentConversation, completeCurrentStep, clearTimer]);

  // Initialize demo
  useEffect(() => {
    setSteps(prev => prev.map((s, i) => 
      i === 0 ? { ...s, status: "active" } : s
    ));
    return clearTimer;
  }, [clearTimer]);

  const handleRestart = () => {
    clearTimer();
    setSteps(initialSteps.map((s, i) => ({ ...s, status: i === 0 ? "active" : "pending" })));
    setActiveStepIndex(0);
    setMessages([]);
    setCurrentMsgIndex(0);
    setReminderIndex(0);
    setPrescriptionIndex(0);
    setShowStats(false);
    setIsTyping(false);
    setIsPlaying(true);
  };

  const allComplete = steps.every(s => s.status === "completed");

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden h-[520px] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-3 py-2 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-xs">Patient Engagement</h3>
              <div className="flex items-center gap-1">
                <span className={cn("w-1.5 h-1.5 rounded-full", isPlaying ? "bg-green-500" : "bg-amber-500")} />
                <span className="text-[10px] text-muted-foreground">
                  {isPlaying ? "Running" : "Paused"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <InlineDemoSpeedControl compact className="hidden sm:flex" />
            {!allComplete && (
              <>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={togglePlayPause} 
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={skipToNextStep} 
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  title="Skip to next step"
                >
                  <SkipForward className="w-3 h-3" />
                </Button>
              </>
            )}
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleRestart} 
              className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
            >
              <RefreshCcw className="w-2.5 h-2.5 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-2 py-2 border-b border-border bg-muted/30 relative group">
        {/* Left Arrow */}
        <button
          onClick={() => scrollSteps("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center bg-background/90 border border-border rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        <div 
          ref={stepsScrollRef}
          className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-hide px-4"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {steps.map((step, idx) => (
            <button 
              key={step.id}
              onClick={() => {
                if (step.status === "completed" || step.status === "active") return;
                // Allow clicking on next pending step
                if (idx === activeStepIndex + 1 && currentStep?.status === "active") {
                  skipToNextStep();
                }
              }}
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] whitespace-nowrap transition-all",
                step.status === "completed" && "bg-emerald-500/20 text-emerald-600",
                step.status === "active" && "bg-primary/20 text-primary ring-1 ring-primary/30",
                step.status === "pending" && "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {step.status === "completed" ? (
                <CheckCircle2 className="w-2.5 h-2.5" />
              ) : step.status === "active" ? (
                <Activity className="w-2.5 h-2.5" />
              ) : (
                <Clock className="w-2.5 h-2.5" />
              )}
              <span>{step.title}</span>
            </button>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scrollSteps("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center bg-background/90 border border-border rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {/* Chat-based steps */}
          {(currentStep?.type === "booking" || currentStep?.type === "followup" || currentStep?.type === "survey") && (
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "flex gap-2",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                        <Bot className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5">
                      {message.channel && (
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wide">
                          via {message.channel}
                        </span>
                      )}
                      <div
                        className={cn(
                          "max-w-[85%] rounded-xl px-2.5 py-1.5 text-xs",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                    {message.role === "user" && (
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="w-2.5 h-2.5 text-muted-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2 items-center"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                      <Bot className="w-2.5 h-2.5 text-white" />
                    </div>
                    <div className="bg-muted rounded-xl rounded-bl-sm px-2.5 py-1.5">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-bounce"
                            style={{ animationDelay: `${i * 150}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </motion.div>
          )}

          {/* Reminder Sequence */}
          {currentStep?.type === "reminder" && (
            <motion.div
              key="reminder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-3 space-y-2 h-full overflow-y-auto"
            >
              <div className="text-center mb-2">
                <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10 text-[10px]">
                  <Bell className="w-2.5 h-2.5 mr-1" />
                  Automated Reminder Sequence
                </Badge>
              </div>
              
              {reminderSequence.slice(0, reminderIndex).map((reminder, i) => (
                <motion.div
                  key={`reminder-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 border border-border"
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                    reminder.channel === "email" ? "bg-blue-500/20 text-blue-500" : "bg-emerald-500/20 text-emerald-500"
                  )}>
                    <reminder.icon className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Badge variant="secondary" className="text-[9px] px-1 py-0">{reminder.time}</Badge>
                      <span className="text-[9px] text-muted-foreground uppercase">{reminder.channel}</span>
                    </div>
                    <p className="text-[11px] text-foreground leading-tight">{reminder.message}</p>
                  </div>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                </motion.div>
              ))}

              {reminderIndex < reminderSequence.length && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs py-3">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Sending next reminder...</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Prescription Refill Workflow */}
          {currentStep?.type === "prescription" && (
            <motion.div
              key="prescription"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-3 space-y-2 h-full overflow-y-auto"
            >
              <div className="text-center mb-2">
                <Badge variant="outline" className="text-purple-600 border-purple-500/30 bg-purple-500/10 text-[10px]">
                  <Pill className="w-2.5 h-2.5 mr-1" />
                  Prescription Refill Workflow
                </Badge>
              </div>
              
              {prescriptionWorkflow.slice(0, prescriptionIndex).map((item, i) => (
                <motion.div
                  key={`rx-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-600 flex items-center justify-center shrink-0">
                    <item.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{item.step}</p>
                    <p className="text-[10px] text-muted-foreground">{item.description}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                </motion.div>
              ))}

              {prescriptionIndex < prescriptionWorkflow.length && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs py-3">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Processing next step...</span>
                </div>
              )}

              {prescriptionIndex >= prescriptionWorkflow.length && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center"
                >
                  <p className="text-xs text-emerald-600 font-medium">✅ Refill Complete</p>
                  <p className="text-[10px] text-muted-foreground">Total time: 4 minutes</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Engagement Stats */}
          {currentStep?.type === "engagement" && (
            <motion.div
              key="engagement"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-3 space-y-2 h-full overflow-y-auto"
            >
              <div className="text-center mb-1">
                <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10 text-[10px]">
                  <TrendingUp className="w-2.5 h-2.5 mr-1" />
                  Patient Retention Results
                </Badge>
              </div>

              {showStats && (
                <>
                  {/* NPS Score */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="p-2 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-medium">NPS Score</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-amber-600">72</span>
                        <span className="text-[10px] text-emerald-600">↑ 18pts</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <ThumbsUp className="w-3 h-3 text-emerald-500" />
                      <span className="text-[10px] text-muted-foreground">89% promoters</span>
                      <ThumbsDown className="w-3 h-3 text-red-400 ml-2" />
                      <span className="text-[10px] text-muted-foreground">3% detractors</span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="grid grid-cols-2 gap-2"
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <div className="text-xl font-bold text-emerald-600 tabular-nums">92%</div>
                      <div className="text-[10px] text-muted-foreground">Show-up Rate</div>
                      <div className="text-[9px] text-emerald-600">↑ 28%</div>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                      <div className="text-xl font-bold text-blue-600 tabular-nums">85%</div>
                      <div className="text-[10px] text-muted-foreground">Retention</div>
                      <div className="text-[9px] text-blue-600">↑ 34%</div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="grid grid-cols-2 gap-2"
                  >
                    <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
                      <div className="text-xl font-bold text-purple-600">94%</div>
                      <div className="text-[10px] text-muted-foreground">Rx Refill Rate</div>
                      <div className="text-[9px] text-purple-600">↑ 22%</div>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                      <div className="text-xl font-bold text-amber-600">4.8</div>
                      <div className="text-[10px] text-muted-foreground">Avg Rating</div>
                      <div className="text-[9px] text-amber-600">↑ 0.6</div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    className="p-2 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertCircle className="w-3 h-3 text-emerald-600" />
                      <span className="text-[10px] font-medium text-foreground">AI Insight</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-snug">
                      Post-visit surveys within 2hrs have 3x higher response rates. 
                      Automated Rx refills reduced churn by 22%.
                    </p>
                  </motion.div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Footer */}
      <div className="px-3 py-1.5 bg-muted/30 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Avg booking: 45s</span>
        <span>Survey response: 78%</span>
        <span>No-show ↓28%</span>
      </div>
    </div>
  );
}
