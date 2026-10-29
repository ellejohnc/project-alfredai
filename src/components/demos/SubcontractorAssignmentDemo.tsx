import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  HardHat, 
  MessageSquare, 
  Calendar, 
  FileText,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Mic,
  Play,
  Send,
  Upload,
  Bell,
  BarChart3,
  AlertTriangle,
  Zap,
  ClipboardCheck,
  MapPin,
  DollarSign,
  Workflow,
  Shield,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useChatContext } from "@/contexts/ChatContext";

type WorkflowStep = {
  id: string;
  title: string;
  icon: typeof HardHat;
  description: string;
  aiAction: string;
  completed?: boolean;
};

const workflowSteps: WorkflowStep[] = [
  {
    id: "detect",
    title: "Smart Project Context",
    icon: BarChart3,
    description: "AI checks project Gantt, missing trades, and availability",
    aiAction: "Checking Anderson Project... Electrical works start Aug 1. No electrician assigned. James Rodriguez available."
  },
  {
    id: "assign",
    title: "Assign Subcontractor",
    icon: Users,
    description: "Assign with full scope and sync to Accountable.link",
    aiAction: "Assigned James Rodriguez. Tagged: Electrical – Anderson. Scope: Rough-In + Testing + Certification. Aug 1–15."
  },
  {
    id: "brief",
    title: "Attach Project Brief",
    icon: FileText,
    description: "Upload and link all project documents",
    aiAction: "Uploaded Anderson_Electrical_Package_RevC.pdf. Linked to James's profile with site map, scope, and safety notes."
  },
  {
    id: "workflow",
    title: "Trigger Workflow",
    icon: Workflow,
    description: "Launch onboarding + QA workflow template",
    aiAction: "Applied 'Subbie Onboarding + QA Electrical' template. 5 steps activated: Induction, SWMS, Delivery, QA, Certification."
  },
  {
    id: "notify",
    title: "Send Notification",
    icon: Bell,
    description: "Notify subbie with scope, brief, and first task",
    aiAction: "Notification sent to James via SMS & Email. Includes: project details, brief link, Accountable login."
  },
  {
    id: "track",
    title: "Live Tracking",
    icon: ClipboardCheck,
    description: "Monitor progress and trigger escalation alerts",
    aiAction: "Tracking active. Alert set: Flag if induction or SWMS incomplete by July 29."
  }
];

const features = [
  { icon: BarChart3, label: "Smart role detection", desc: "Never miss a required trade" },
  { icon: FileText, label: "Document handling", desc: "No 'where's the brief?' confusion" },
  { icon: Workflow, label: "Workflow activation", desc: "Turns admin into action" },
  { icon: Bell, label: "Subbie notification", desc: "Instant mobilisation" },
  { icon: ClipboardCheck, label: "Trackable tasks", desc: "Real accountability" },
  { icon: Zap, label: "Memory engine", desc: "Works across all projects" },
];

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  action?: string;
  metadata?: {
    cost?: string;
    dates?: string;
    status?: string;
  };
};

const demoConversation: ChatMessage[] = [
  {
    role: "user",
    content: "Hey, who do we still need for next week's works at the Anderson Project?"
  },
  {
    role: "assistant",
    content: "Anderson Project starts electrical works on 1st Aug. No electrician assigned yet. James Rodriguez is available and matches the skill requirements.",
    action: "Checked project Gantt + availability"
  },
  {
    role: "user",
    content: "Assign James Rodriguez to Anderson from 1st–15th Aug. Add his scope as Rough-In + Testing + Certification."
  },
  {
    role: "assistant",
    content: "Done! James Rodriguez assigned to Anderson Project.\n\n• Scope: Electrical Rough-In + Testing + Certification\n• Dates: Aug 1–15 (12 working days)\n• Rate: $62/hr × 8hrs/day",
    action: "Synced to Accountable.link",
    metadata: { cost: "$5,952", dates: "Aug 1–15", status: "Assigned" }
  },
  {
    role: "user",
    content: "Upload and link project brief: Anderson_Electrical_Package_RevC.pdf"
  },
  {
    role: "assistant",
    content: "Project brief uploaded and linked to James's assignment:\n\n📁 Anderson_Electrical_Package_RevC.pdf\n• Site map included\n• Scope of work detailed\n• Safety notes attached",
    action: "Document linked to subbie profile"
  },
  {
    role: "user",
    content: "Apply the 'Subbie Onboarding + QA Electrical' workflow template for James."
  },
  {
    role: "assistant",
    content: "Workflow activated via Accountable.link:\n\n✓ Site induction checklist\n✓ Submit SWMS\n✓ Delivery schedule\n✓ QA check-in (rough-in inspection)\n✓ Certification upload\n\nFirst task due: July 29 (Site Induction)",
    action: "5 workflow steps created"
  },
  {
    role: "user",
    content: "Send James a notification with his scope, project brief, and first workflow step."
  },
  {
    role: "assistant",
    content: "Notification sent to James Rodriguez:\n\n📧 Email + 📱 SMS delivered\n\nIncludes:\n• Project: Anderson Electrical\n• Site: 42 Anderson Way, Richmond\n• Dates: Aug 1–15\n• First task: Complete Site Induction by July 29\n• Brief + Accountable login link",
    action: "Subbie mobilised"
  }
];

export default function SubcontractorAssignmentDemo() {
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { setDemoActive } = useChatContext();

  // Track demo active state
  const isDemoRunning = messages.length > 0;
  
  useEffect(() => {
    setDemoActive(isDemoRunning);
    return () => setDemoActive(false);
  }, [isDemoRunning, setDemoActive]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);
  const simulateNextMessage = () => {
    if (demoIndex >= demoConversation.length) return;

    const currentIndex = demoIndex;
    const userMessage = demoConversation[currentIndex];
    
    if (userMessage.role !== "user") {
      // Safety check - skip to next if not a user message
      setDemoIndex(currentIndex + 1);
      return;
    }

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    
    // Check if there's an assistant response to follow
    const assistantIndex = currentIndex + 1;
    if (assistantIndex < demoConversation.length) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const assistantMsg = demoConversation[assistantIndex];
          setMessages(prev => [...prev, assistantMsg]);
          
          // Mark workflow step as completed
          const stepIndex = Math.floor(assistantIndex / 2);
          if (workflowSteps[stepIndex]) {
            setCompletedSteps(prev => [...prev, workflowSteps[stepIndex].id]);
          }
          
          // Move to next user message
          setDemoIndex(assistantIndex + 1);
        }, 1500);
      }, 500);
    } else {
      setDemoIndex(currentIndex + 1);
    }
  };

  const startDemo = () => {
    setMessages([]);
    setDemoIndex(0);
    setCompletedSteps([]);
    // Use setTimeout to ensure state is reset before starting
    setTimeout(() => {
      const userMessage = demoConversation[0];
      setMessages([userMessage]);
      
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const assistantMsg = demoConversation[1];
          setMessages(prev => [...prev, assistantMsg]);
          setCompletedSteps([workflowSteps[0].id]);
          setDemoIndex(2);
        }, 1500);
      }, 500);
    }, 0);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: "user", content: inputValue }]);
    setInputValue("");
    
    // Simulate AI response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I understand you want to manage subcontractor assignments. Try the guided demo to see the full workflow in action!",
        action: "Ready to assist"
      }]);
    }, 1000);
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-4 py-3 border-b border-border sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <HardHat className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="font-semibold text-sm text-foreground">BOTO + Accountable.link</h3>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0">BOTO</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">AI Subcontractor Assignment & Workflow</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="relative border-b border-border">
          {/* Left Arrow */}
          <button
            onClick={() => setActiveTab(activeTab === "workflow" ? "chat" : activeTab === "features" ? "workflow" : "chat")}
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center bg-background/90 backdrop-blur-sm border border-border rounded-full shadow-sm transition-opacity",
              activeTab === "chat" ? "opacity-30 cursor-not-allowed" : "opacity-100 hover:bg-muted"
            )}
            disabled={activeTab === "chat"}
            aria-label="Previous tab"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          
          {/* Tabs with horizontal scroll */}
          <TabsList className="w-full justify-start rounded-none bg-transparent p-0 overflow-x-auto scrollbar-hide px-8">
            <TabsTrigger value="chat" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs whitespace-nowrap flex-shrink-0">
              <MessageSquare className="w-3 h-3 mr-1.5" />
              Chat Demo
            </TabsTrigger>
            <TabsTrigger value="workflow" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs whitespace-nowrap flex-shrink-0">
              <Workflow className="w-3 h-3 mr-1.5" />
              Workflow Steps
            </TabsTrigger>
            <TabsTrigger value="features" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs whitespace-nowrap flex-shrink-0">
              <Zap className="w-3 h-3 mr-1.5" />
              Features
            </TabsTrigger>
          </TabsList>
          
          {/* Right Arrow */}
          <button
            onClick={() => setActiveTab(activeTab === "chat" ? "workflow" : activeTab === "workflow" ? "features" : "features")}
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center bg-background/90 backdrop-blur-sm border border-border rounded-full shadow-sm transition-opacity",
              activeTab === "features" ? "opacity-30 cursor-not-allowed" : "opacity-100 hover:bg-muted"
            )}
            disabled={activeTab === "features"}
            aria-label="Next tab"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Chat Demo Tab */}
        <TabsContent value="chat" className="p-0 mt-0">
          <div className="flex flex-col h-[400px]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                    <Mic className="w-7 h-7 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Subcontractor Assignment Demo</h4>
                    <p className="text-xs text-muted-foreground mt-1">Watch BOTO assign a subbie with full project context</p>
                  </div>
                  <Button onClick={startDemo} className="gap-2">
                    <Play className="w-4 h-4" />
                    Start Guided Demo
                  </Button>
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex gap-2",
                          msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className={cn(
                          "max-w-[85%] p-3 rounded-xl",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-muted rounded-tl-sm"
                        )}>
                          <div className="flex items-center gap-1.5 mb-1">
                            {msg.role === "assistant" ? (
                              <HardHat className="w-3 h-3 text-amber-600" />
                            ) : (
                              <Users className="w-3 h-3" />
                            )}
                            <span className="text-[10px] font-medium opacity-70 uppercase">
                              {msg.role === "assistant" ? "BOTO AI" : "You"}
                            </span>
                          </div>
                          <p className="text-xs whitespace-pre-line">{msg.content}</p>
                          
                          {msg.action && (
                            <div className="mt-2 flex items-center gap-1 text-[10px] opacity-70">
                              <Zap className="w-3 h-3" />
                              {msg.action}
                            </div>
                          )}
                          
                          {msg.metadata && (
                            <div className="mt-2 flex gap-2 flex-wrap">
                              {msg.metadata.cost && (
                                <Badge variant="secondary" className="text-[10px]">
                                  <DollarSign className="w-2.5 h-2.5 mr-0.5" />
                                  {msg.metadata.cost}
                                </Badge>
                              )}
                              {msg.metadata.dates && (
                                <Badge variant="secondary" className="text-[10px]">
                                  <Calendar className="w-2.5 h-2.5 mr-0.5" />
                                  {msg.metadata.dates}
                                </Badge>
                              )}
                              {msg.metadata.status && (
                                <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600">
                                  <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                                  {msg.metadata.status}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-2"
                    >
                      <div className="bg-muted p-3 rounded-xl rounded-tl-sm">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {!isTyping && demoIndex < demoConversation.length && messages.length > 0 && (
                    <div className="flex justify-center pt-2">
                      <motion.div
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={simulateNextMessage} 
                          className="text-xs border-primary/50 text-primary bg-primary/10 hover:bg-primary/20 relative overflow-hidden"
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          />
                          <span className="relative z-10">Continue Demo</span>
                          <motion.div
                            className="ml-1 relative z-10"
                            animate={{ x: [0, 3, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <ArrowRight className="w-3 h-3" />
                          </motion.div>
                        </Button>
                      </motion.div>
                    </div>
                  )}

                  {demoIndex >= demoConversation.length && messages.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center space-y-3 pt-4"
                    >
                      <div className="flex items-center justify-center gap-2 text-green-500">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-medium">Workflow Complete!</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        James Rodriguez is now assigned, briefed, and tracked via Accountable.link
                      </p>
                      <Button variant="outline" size="sm" onClick={startDemo}>
                        Restart Demo
                      </Button>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask a question..."
                  className="text-xs h-9 flex-1 min-w-0"
                />
                <Button size="sm" onClick={handleSend} className="h-9 w-9 p-0 flex-shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Workflow Steps Tab */}
        <TabsContent value="workflow" className="p-4 space-y-3 mt-0">
          {workflowSteps.map((step, idx) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "p-3 rounded-xl border transition-all",
                completedSteps.includes(step.id)
                  ? "bg-green-500/5 border-green-500/20"
                  : "bg-muted/50 border-border"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  completedSteps.includes(step.id)
                    ? "bg-green-500/20"
                    : "bg-amber-500/20"
                )}>
                  {completedSteps.includes(step.id) ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <step.icon className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-muted-foreground">Step {idx + 1}</span>
                    {completedSteps.includes(step.id) && (
                      <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600">
                        Complete
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-medium text-sm text-foreground">{step.title}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{step.description}</p>
                  
                  {completedSteps.includes(step.id) && (
                    <div className="mt-2 p-2 rounded-lg bg-background/50 text-[10px] text-foreground">
                      <span className="text-amber-600 font-medium">AI:</span> {step.aiAction}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {completedSteps.length === 0 && (
            <div className="text-center py-6">
              <p className="text-xs text-muted-foreground mb-3">Run the chat demo to see workflow steps complete</p>
              <Button variant="outline" size="sm" onClick={() => { setActiveTab("chat"); startDemo(); }} className="glow-pulse animate-pulse">
                <Play className="w-3 h-3 mr-1.5" />
                Start Demo
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="p-4 space-y-4 mt-0">
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-3 rounded-xl bg-muted/50 border border-border"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center mb-2">
                  <feature.icon className="w-4 h-4 text-amber-600" />
                </div>
                <h4 className="font-medium text-xs text-foreground">{feature.label}</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Add-ons */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
            <h5 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              Optional Add-Ons
            </h5>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <Shield className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                Photo ID check + license verification via mobile
              </li>
              <li className="flex items-start gap-2">
                <Calendar className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                Auto-sync with site delivery calendar
              </li>
              <li className="flex items-start gap-2">
                <DollarSign className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                Auto-export to accounting/payroll for time-based billing
              </li>
            </ul>
          </div>

          {/* Integration badges */}
          <div className="pt-3 border-t border-border">
            <h5 className="text-xs font-medium text-muted-foreground mb-2">Integrations</h5>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px]">Accountable.link</Badge>
              <Badge variant="outline" className="text-[10px]">Project Gantt</Badge>
              <Badge variant="outline" className="text-[10px]">SWMS</Badge>
              <Badge variant="outline" className="text-[10px]">Email/SMS</Badge>
              <Badge variant="outline" className="text-[10px]">Document Vault</Badge>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="px-4 py-3 bg-muted/30 border-t border-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Construction • Trades • Projects</span>
        </div>
        <Button 
          variant="link" 
          size="sm" 
          className="text-xs h-auto p-0"
          onClick={() => toast.info("Demo Mode", { description: "In production, this would navigate to detailed documentation about the subcontractor assignment system." })}
        >
          Learn more →
        </Button>
      </div>
    </div>
  );
}