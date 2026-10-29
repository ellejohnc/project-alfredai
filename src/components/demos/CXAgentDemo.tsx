import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  Bot, 
  User, 
  Send, 
  Headphones, 
  Phone, 
  Mail, 
  MessageSquare, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  UserCheck,
  Flag,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  FileText,
  DollarSign,
  Calendar,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

type Message = {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
  typing?: boolean;
  sentiment?: "positive" | "negative" | "neutral";
  intent?: string;
  choices?: string[];
};

type Scenario = {
  id: string;
  name: string;
  icon: typeof Package;
  description: string;
  color: string;
  messages: Message[];
  analysis: {
    sentiment: "positive" | "negative" | "neutral";
    intent: string;
    resolutionTime: string;
    escalationRisk: "low" | "medium" | "high";
    suggestedActions: string[];
    csat: number;
  };
};

const scenarios: Scenario[] = [
  {
    id: "refund",
    name: "Refund Request",
    icon: DollarSign,
    description: "Customer requests refund for damaged product",
    color: "hsl(0, 84%, 60%)",
    messages: [
      { id: "r1", role: "assistant", content: "Hi! 👋 I'm your alfred ai support agent. How can I help you today?", intent: "Greeting" },
      { id: "r2", role: "user", content: "I received my order yesterday but the product arrived damaged. I want a refund.", sentiment: "negative", intent: "Refund Request" },
      { id: "r3", role: "system", content: "🔍 AI Analysis: Detected damaged product complaint. Checking order history..." },
      { id: "r4", role: "assistant", content: "I'm really sorry to hear that your order arrived damaged. That's definitely not the experience we want for you. I can see your order #45892 was delivered yesterday.\n\nCould you share a photo of the damage? This helps us process your refund faster and prevent similar issues.", intent: "Empathy + Info Request" },
      { id: "r5", role: "user", content: "Here's the photo. The packaging was crushed and the item is broken.", sentiment: "negative" },
      { id: "r6", role: "system", content: "📸 Image analyzed: Confirmed visible damage. Auto-approving refund per policy." },
      { id: "r7", role: "assistant", content: "Thank you for sharing that. I can clearly see the damage, and I've already initiated a full refund of $89.99 to your original payment method.\n\n✅ Refund approved: $89.99\n⏱️ Processing time: 3-5 business days\n\nWould you like me to arrange a replacement at no extra cost, or is the refund sufficient?", intent: "Resolution Offer" },
      { id: "r8", role: "user", content: "A replacement would be great actually!", sentiment: "positive" },
      { id: "r9", role: "assistant", content: "Perfect! I've arranged for a replacement to be shipped with priority delivery at no additional cost. Here are the details:\n\n📦 Replacement order: #45892-R\n🚚 Shipping: Priority (2-3 days)\n💰 Cost: $0.00\n\nYou'll receive tracking info within 2 hours. Is there anything else I can help with today?", intent: "Confirmation" },
      { id: "r10", role: "user", content: "No that's perfect, thank you so much for the quick help!", sentiment: "positive" },
    ],
    analysis: {
      sentiment: "positive",
      intent: "Refund → Replacement",
      resolutionTime: "4 min 23 sec",
      escalationRisk: "low",
      suggestedActions: [
        "Review shipping carrier for this route",
        "Add extra packaging for fragile items",
        "Send follow-up satisfaction survey in 5 days"
      ],
      csat: 92
    }
  },
  {
    id: "billing",
    name: "Billing Dispute",
    icon: FileText,
    description: "Customer disputes unexpected charge",
    color: "hsl(38, 92%, 50%)",
    messages: [
      { id: "b1", role: "assistant", content: "Hi! 👋 I'm your alfred ai support agent. How can I help you today?", intent: "Greeting" },
      { id: "b2", role: "user", content: "I just noticed a $149 charge on my account that I didn't authorize. This is unacceptable!", sentiment: "negative", intent: "Billing Dispute" },
      { id: "b3", role: "system", content: "⚠️ High-priority: Billing dispute detected. Pulling account history..." },
      { id: "b4", role: "assistant", content: "I completely understand your concern, and I want to resolve this right away. Let me look into this charge immediately.\n\nI can see a $149.00 charge from March 28th. This appears to be for your annual subscription renewal. However, I notice you may not have received the renewal reminder email.\n\nWould you like me to explain the charge, or would you prefer to cancel and get a full refund?", intent: "Clarification + Options" },
      { id: "b5", role: "user", content: "I don't remember agreeing to auto-renewal. I want to cancel.", sentiment: "negative" },
      { id: "b6", role: "system", content: "📋 Policy check: Auto-renewal was enabled at signup. Customer has 30-day cancellation window." },
      { id: "b7", role: "assistant", content: "I understand. Looking at your account, auto-renewal was enabled when you first signed up, but I can see our renewal reminder email bounced back.\n\nThat's on us, not you. Here's what I'm doing:\n\n✅ Full refund of $149.00 → Processing now\n✅ Subscription cancelled → Immediate\n✅ Added 30-day free access → As goodwill\n\nYou won't be charged again unless you choose to resubscribe. Fair?", intent: "Resolution" },
      { id: "b8", role: "user", content: "Wow, I didn't expect that. That's really fair, thank you.", sentiment: "positive" },
      { id: "b9", role: "assistant", content: "You're very welcome! I've sent a confirmation email with all the details. If you ever want to come back, use code WELCOME30 for 30% off.\n\nIs there anything else I can help with?", intent: "Retention Offer" },
      { id: "b10", role: "user", content: "No, I'm impressed with how quickly this was handled. Thanks!", sentiment: "positive" },
    ],
    analysis: {
      sentiment: "positive",
      intent: "Billing Dispute → Cancellation",
      resolutionTime: "3 min 45 sec",
      escalationRisk: "medium",
      suggestedActions: [
        "Flag email delivery issue for tech review",
        "Update renewal reminder process",
        "Add to win-back campaign in 60 days",
        "Review auto-renewal disclosure at signup"
      ],
      csat: 88
    }
  },
  {
    id: "appointment",
    name: "Appointment Change",
    icon: Calendar,
    description: "Customer needs to reschedule appointment",
    color: "hsl(199, 89%, 48%)",
    messages: [
      { id: "a1", role: "assistant", content: "Hi! 👋 I'm your alfred ai support agent. How can I help you today?", intent: "Greeting" },
      { id: "a2", role: "user", content: "I need to reschedule my appointment for next week, something came up.", sentiment: "neutral", intent: "Reschedule" },
      { id: "a3", role: "system", content: "📅 Found appointment: Thursday 2pm with Dr. Martinez. Checking availability..." },
      { id: "a4", role: "assistant", content: "No problem at all! I can see your current appointment is:\n\n📅 Thursday, April 3rd at 2:00 PM\n👤 Dr. Martinez\n📍 Main Office\n\nWhen would work better for you? I have availability on Friday or early next week.", intent: "Confirmation + Options" },
      { id: "a5", role: "user", content: "Friday morning would be ideal if possible", sentiment: "neutral" },
      { id: "a6", role: "assistant", content: "Great choice! I have two Friday morning slots available:\n\n🕐 9:00 AM - Dr. Martinez\n🕐 10:30 AM - Dr. Martinez\n\nWhich works better for your schedule?", intent: "Options" },
      { id: "a7", role: "user", content: "10:30 works perfectly", sentiment: "positive" },
      { id: "a8", role: "system", content: "✅ Appointment rescheduled. Sending confirmation..." },
      { id: "a9", role: "assistant", content: "Perfect! ✅ I've rescheduled your appointment:\n\n📅 Friday, April 4th at 10:30 AM\n👤 Dr. Martinez\n📍 Main Office\n\nYou'll receive a confirmation email and SMS reminder 24 hours before. Is there anything else I can help with?", intent: "Confirmation" },
      { id: "a10", role: "user", content: "That's all, thank you!", sentiment: "positive" },
    ],
    analysis: {
      sentiment: "positive",
      intent: "Appointment Reschedule",
      resolutionTime: "1 min 52 sec",
      escalationRisk: "low",
      suggestedActions: [
        "Send appointment reminder 24h before",
        "Offer calendar integration for future bookings"
      ],
      csat: 95
    }
  }
];

const channels = [
  { id: "chat", icon: MessageSquare, label: "Web Chat", active: true },
  { id: "voice", icon: Phone, label: "Voice" },
  { id: "email", icon: Mail, label: "Email" },
];

type DemoPhase = "selection" | "conversation" | "analysis";

export default function CXAgentDemo() {
  const [phase, setPhase] = useState<DemoPhase>("selection");
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [activeChannel, setActiveChannel] = useState("chat");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.closest('.overflow-y-auto');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    if (phase !== "conversation" || !selectedScenario) return;
    if (currentIndex >= selectedScenario.messages.length) {
      // Conversation complete, show analysis after delay
      const timeout = setTimeout(() => {
        setPhase("analysis");
        setShowAnalysis(true);
      }, 1000);
      return () => clearTimeout(timeout);
    }

    const message = selectedScenario.messages[currentIndex];
    
    if (message.role === "system") {
      // System messages appear quickly
      const timeout = setTimeout(() => {
        setMessages(prev => [...prev, message]);
        setCurrentIndex(prev => prev + 1);
      }, 600);
      return () => clearTimeout(timeout);
    } else if (message.role === "assistant") {
      setIsTyping(true);
      const typingTimeout = setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, message]);
        setCurrentIndex(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(typingTimeout);
    } else {
      const timeout = setTimeout(() => {
        setMessages(prev => [...prev, message]);
        setCurrentIndex(prev => prev + 1);
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, phase, selectedScenario]);

  const handleSelectScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setMessages([]);
    setCurrentIndex(0);
    setIsTyping(false);
    setShowAnalysis(false);
    setPhase("conversation");
  };

  const handleRestart = () => {
    setPhase("selection");
    setSelectedScenario(null);
    setMessages([]);
    setCurrentIndex(0);
    setIsTyping(false);
    setShowAnalysis(false);
  };

  const handleTryAnotherScenario = () => {
    setPhase("selection");
    setMessages([]);
    setCurrentIndex(0);
    setIsTyping(false);
    setShowAnalysis(false);
  };

  const getSentimentColor = (sentiment: "positive" | "negative" | "neutral") => {
    switch (sentiment) {
      case "positive": return "text-emerald-500";
      case "negative": return "text-red-500";
      default: return "text-amber-500";
    }
  };

  const getEscalationColor = (risk: "low" | "medium" | "high") => {
    switch (risk) {
      case "low": return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400";
      case "medium": return "bg-amber-500/20 text-amber-600 dark:text-amber-400";
      case "high": return "bg-red-500/20 text-red-600 dark:text-red-400";
    }
  };

  // Scenario Selection Phase
  if (phase === "selection") {
    return (
      <div className="bg-card rounded-2xl border border-border overflow-hidden h-[520px] flex flex-col">
        <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Headphones className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">CX Agent Demo</h3>
              <span className="text-xs text-muted-foreground">Select a scenario to begin</span>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          <div className="text-center mb-4">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
            <h4 className="font-semibold text-foreground">Choose a Support Scenario</h4>
            <p className="text-xs text-muted-foreground mt-1">Watch how AI handles different customer situations</p>
          </div>

          {scenarios.map((scenario) => (
            <motion.button
              key={scenario.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectScenario(scenario)}
              className="w-full p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/30 transition-all text-left group"
            >
              <div className="flex items-start gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${scenario.color}20` }}
                >
                  <scenario.icon className="w-5 h-5" style={{ color: scenario.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium text-foreground text-sm">{scenario.name}</h5>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{scenario.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="px-4 py-2 bg-muted/30 border-t border-border text-center">
          <span className="text-xs text-muted-foreground">Each scenario includes AI analysis & recommended actions</span>
        </div>
      </div>
    );
  }

  // Analysis Phase
  if (phase === "analysis" && selectedScenario) {
    return (
      <div className="bg-card rounded-2xl border border-border overflow-hidden h-[520px] flex flex-col">
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Conversation Analysis</h3>
                <span className="text-xs text-muted-foreground">Human-in-the-Loop Review</span>
              </div>
            </div>
            <div className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getEscalationColor(selectedScenario.analysis.escalationRisk))}>
              {selectedScenario.analysis.escalationRisk === "low" ? "✓ Resolved" : selectedScenario.analysis.escalationRisk === "medium" ? "⚠ Review" : "🚨 Escalate"}
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Summary Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-2"
          >
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <Clock className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
              <div className="text-sm font-semibold text-foreground">{selectedScenario.analysis.resolutionTime}</div>
              <div className="text-[10px] text-muted-foreground">Resolution Time</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <TrendingUp className={cn("w-4 h-4 mx-auto mb-1", getSentimentColor(selectedScenario.analysis.sentiment))} />
              <div className="text-sm font-semibold text-foreground capitalize">{selectedScenario.analysis.sentiment}</div>
              <div className="text-[10px] text-muted-foreground">Final Sentiment</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <ThumbsUp className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
              <div className="text-sm font-semibold text-foreground tabular-nums">{selectedScenario.analysis.csat}%</div>
              <div className="text-[10px] text-muted-foreground">Predicted CSAT</div>
            </div>
          </motion.div>

          {/* Intent Journey */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-muted/30 rounded-lg p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground">Customer Journey</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded-md bg-background border border-border">{selectedScenario.analysis.intent}</span>
            </div>
          </motion.div>

          {/* Recommended Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3"
          >
            <div className="flex items-center gap-2 mb-3">
              <Flag className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium text-foreground">Recommended Actions for Team</span>
            </div>
            <div className="space-y-2">
              {selectedScenario.analysis.suggestedActions.map((action, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-muted-foreground">{action}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Human Review Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-primary/5 border border-primary/20 rounded-lg p-3"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground">Human Review Options</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => toast.success("Marked as approved")}>
                <ThumbsUp className="w-3 h-3 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => toast.info("Opening for edit...")}>
                <FileText className="w-3 h-3 mr-1" /> Review
              </Button>
              <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => toast.warning("Escalating to supervisor")}>
                <ExternalLink className="w-3 h-3 mr-1" /> Escalate
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-border bg-background flex gap-2">
          <Button onClick={handleTryAnotherScenario} variant="outline" className="flex-1" size="sm">
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Try Another Scenario
          </Button>
          <Button onClick={handleRestart} variant="default" className="flex-1" size="sm">
            <ArrowRight className="w-3.5 h-3.5 mr-1" /> Start Fresh
          </Button>
        </div>
      </div>
    );
  }

  // Conversation Phase
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden h-[520px] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Headphones className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">CX Agent</h3>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground">{selectedScenario?.name}</span>
              </div>
            </div>
          </div>
          
          {/* Channel Switcher */}
          <div className="flex gap-1">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => {
                  setActiveChannel(channel.id);
                  if (channel.id !== "chat") {
                    toast.info("Demo Mode", { description: `${channel.label} channel preview.` });
                  }
                }}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  activeChannel === channel.id
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
                title={channel.label}
              >
                <channel.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {selectedScenario && (
        <div className="px-4 py-2 bg-muted/30 border-b border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Conversation Progress</span>
            <span>{Math.round((currentIndex / selectedScenario.messages.length) * 100)}%</span>
          </div>
          <Progress value={(currentIndex / selectedScenario.messages.length) * 100} className="h-1" />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
        <SafeAnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex gap-2",
                message.role === "user" ? "justify-end" : 
                message.role === "system" ? "justify-center" : "justify-start"
              )}
            >
              {message.role === "system" ? (
                <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5 text-xs text-primary max-w-[90%]">
                  {message.content}
                </div>
              ) : (
                <>
                  {message.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1 max-w-[80%]">
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm whitespace-pre-line",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      )}
                    >
                      {message.content}
                    </div>
                    {message.sentiment && (
                      <span className={cn("text-[10px] ml-1", getSentimentColor(message.sentiment))}>
                        {message.sentiment === "positive" ? "😊" : message.sentiment === "negative" ? "😞" : "😐"} {message.sentiment}
                      </span>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </SafeAnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2 items-center"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
              <span className="text-xs text-muted-foreground italic">Agent is typing...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-background">
        <div className="flex gap-2">
          <Input
            placeholder="Watching demo conversation..."
            className="flex-1 h-9 rounded-full text-sm"
            disabled
          />
          <Button 
            size="icon" 
            className="h-9 w-9 rounded-full shrink-0" 
            disabled
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="px-4 py-2 bg-muted/30 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>AI Confidence: 94%</span>
        <span>Sentiment tracking active</span>
      </div>
    </div>
  );
}
