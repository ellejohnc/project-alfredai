import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  Bot, 
  Sparkles, 
  Send,
  Plus,
  ArrowRight,
  CheckCircle2,
  Mail,
  FileText,
  Users,
  Bell,
  Database,
  Zap,
  Settings,
  MessageSquare,
  Clock,
  GitBranch,
  Loader2,
  Lightbulb,
  ChevronRight,
  RefreshCw,
  LayoutTemplate,
  Play,
  Receipt,
  UserCheck,
  ShieldCheck,
  TrendingUp,
  Headphones,
  Rocket,
  PartyPopper,
  Copy,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChatAvatar, ChatTypingIndicator } from "@/components/chat/shared";
import { DemoMarkdown } from "@/components/demos/DemoMarkdown";
import { HorizontalWorkflowCanvas } from "@/components/demos/workflow/HorizontalWorkflowCanvas";
import confetti from "canvas-confetti";

type WorkflowNode = {
  id: string;
  type: "trigger" | "action" | "condition";
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  status: "pending" | "active" | "complete";
};

type AIMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
};

type WorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  icon: typeof Mail;
  color: string;
  nodes: Omit<WorkflowNode, "id" | "status">[];
  category: string;
};

const iconMap: Record<string, typeof Mail> = {
  Mail, FileText, Users, Bell, Database, Zap, MessageSquare, Clock, GitBranch, Receipt, UserCheck, ShieldCheck, TrendingUp, Headphones
};

const availableNodeTypes = [
  { icon: Mail, label: "Email", color: "hsl(262, 83%, 58%)" },
  { icon: MessageSquare, label: "Slack", color: "hsl(142, 76%, 36%)" },
  { icon: Database, label: "Database", color: "hsl(199, 89%, 48%)" },
  { icon: FileText, label: "Document", color: "hsl(47, 100%, 50%)" },
  { icon: Clock, label: "Schedule", color: "hsl(0, 84%, 60%)" },
  { icon: Zap, label: "Webhook", color: "hsl(var(--primary))" },
];

const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "invoice-approval",
    name: "Invoice Approval",
    description: "Automate invoice review, approval routing, and payment processing",
    icon: Receipt,
    color: "hsl(142, 76%, 36%)",
    category: "Finance",
    nodes: [
      { type: "trigger", icon: "Mail", title: "Invoice Received", subtitle: "New email with invoice attachment", color: "hsl(262, 83%, 58%)" },
      { type: "action", icon: "FileText", title: "Extract Data", subtitle: "AI reads invoice details", color: "hsl(47, 100%, 50%)" },
      { type: "condition", icon: "GitBranch", title: "Amount Check", subtitle: "If amount > $10,000", color: "hsl(38, 92%, 50%)" },
      { type: "action", icon: "Users", title: "Route for Approval", subtitle: "Send to finance manager", color: "hsl(199, 89%, 48%)" },
      { type: "action", icon: "Database", title: "Update ERP", subtitle: "Create payment record", color: "hsl(142, 76%, 36%)" },
    ]
  },
  {
    id: "employee-onboarding",
    name: "Employee Onboarding",
    description: "Streamline new hire setup across IT, HR, and facilities",
    icon: UserCheck,
    color: "hsl(199, 89%, 48%)",
    category: "HR",
    nodes: [
      { type: "trigger", icon: "Users", title: "New Hire Added", subtitle: "HR creates employee record", color: "hsl(262, 83%, 58%)" },
      { type: "action", icon: "Mail", title: "Send Welcome Email", subtitle: "Personalized onboarding info", color: "hsl(47, 100%, 50%)" },
      { type: "action", icon: "Database", title: "Create Accounts", subtitle: "AD, email, Slack setup", color: "hsl(199, 89%, 48%)" },
      { type: "action", icon: "FileText", title: "Generate Documents", subtitle: "Contracts & policies", color: "hsl(142, 76%, 36%)" },
      { type: "action", icon: "Bell", title: "Notify Manager", subtitle: "Equipment ready alert", color: "hsl(0, 84%, 60%)" },
    ]
  },
  {
    id: "compliance-monitoring",
    name: "Compliance Monitoring",
    description: "Continuous monitoring and automated compliance reporting",
    icon: ShieldCheck,
    color: "hsl(262, 83%, 58%)",
    category: "Legal",
    nodes: [
      { type: "trigger", icon: "Clock", title: "Daily Schedule", subtitle: "Run at 6:00 AM", color: "hsl(0, 84%, 60%)" },
      { type: "action", icon: "Database", title: "Scan Systems", subtitle: "Check all compliance points", color: "hsl(199, 89%, 48%)" },
      { type: "condition", icon: "GitBranch", title: "Issues Found?", subtitle: "Evaluate risk level", color: "hsl(38, 92%, 50%)" },
      { type: "action", icon: "Bell", title: "Alert Team", subtitle: "Escalate to compliance officer", color: "hsl(262, 83%, 58%)" },
      { type: "action", icon: "FileText", title: "Generate Report", subtitle: "Weekly compliance summary", color: "hsl(142, 76%, 36%)" },
    ]
  },
  {
    id: "sales-pipeline",
    name: "Sales Pipeline",
    description: "Automate lead scoring, follow-ups, and deal tracking",
    icon: TrendingUp,
    color: "hsl(38, 92%, 50%)",
    category: "Sales",
    nodes: [
      { type: "trigger", icon: "Zap", title: "New Lead", subtitle: "Form submission or CRM entry", color: "hsl(262, 83%, 58%)" },
      { type: "action", icon: "Database", title: "Enrich Data", subtitle: "Lookup company info", color: "hsl(199, 89%, 48%)" },
      { type: "action", icon: "TrendingUp", title: "Score Lead", subtitle: "AI qualification scoring", color: "hsl(38, 92%, 50%)" },
      { type: "condition", icon: "GitBranch", title: "High Priority?", subtitle: "Score > 80", color: "hsl(0, 84%, 60%)" },
      { type: "action", icon: "Mail", title: "Assign & Notify", subtitle: "Route to sales rep", color: "hsl(142, 76%, 36%)" },
    ]
  },
  {
    id: "customer-support",
    name: "Customer Support",
    description: "Intelligent ticket routing and automated responses",
    icon: Headphones,
    color: "hsl(0, 84%, 60%)",
    category: "Support",
    nodes: [
      { type: "trigger", icon: "Mail", title: "Support Request", subtitle: "Email or chat message", color: "hsl(262, 83%, 58%)" },
      { type: "action", icon: "Headphones", title: "Analyze Intent", subtitle: "AI categorization", color: "hsl(0, 84%, 60%)" },
      { type: "condition", icon: "GitBranch", title: "Auto-Resolvable?", subtitle: "Check knowledge base", color: "hsl(38, 92%, 50%)" },
      { type: "action", icon: "MessageSquare", title: "Send Response", subtitle: "AI-generated reply", color: "hsl(142, 76%, 36%)" },
      { type: "action", icon: "Users", title: "Escalate", subtitle: "Route to specialist", color: "hsl(199, 89%, 48%)" },
    ]
  },
];

const enterpriseSuggestions = [
  "Automate invoice processing and approval workflows",
  "Build an employee onboarding automation",
  "Create a compliance monitoring system",
  "Set up automated sales lead qualification",
  "Design a customer support ticket routing flow",
  "Automate vendor management and procurement",
  "Build an expense approval workflow",
  "Create automated contract review pipeline",
];

export default function WorkflowBuilderDemo() {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hi! I'm your Workflow AI. Tell me what process you'd like to automate, and I'll build it for you — no coding required!\n\n**Popular enterprise automations:**",
      suggestions: enterpriseSuggestions.slice(0, 4)
    }
  ]);
  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [workflowActive, setWorkflowActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Prepare conversation history for the API
      const conversationHistory = messages
        .filter(m => m.id !== "welcome")
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const { data, error } = await supabase.functions.invoke('workflow-assistant', {
        body: { 
          message: messageText,
          conversationHistory
        }
      });

      if (error) {
        console.error('Error calling workflow-assistant:', error);
        throw error;
      }

      if (data.error) {
        toast.error(data.error);
        throw new Error(data.error);
      }

      // Ensure completion option exists when workflow has nodes
      let finalSuggestions = data.suggestions || [];
      if (workflowNodes.length >= 1 || data.nodeToAdd) {
        const completionKeywords = ['activate', 'deploy', 'complete', 'finalize', 'finish', 'done', 'ready', 'save and'];
        const hasCompletion = finalSuggestions.some((s: string) => 
          completionKeywords.some(kw => s.toLowerCase().includes(kw))
        );
        if (!hasCompletion) {
          finalSuggestions = [...finalSuggestions.slice(0, 3), "Activate this workflow"];
        }
      }

      // Add AI response
      const aiMessage: AIMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.response,
        suggestions: finalSuggestions
      };
      setMessages(prev => [...prev, aiMessage]);

      // Add workflow node if detected
      if (data.nodeToAdd) {
        const newNode: WorkflowNode = {
          id: `node-${Date.now()}`,
          type: data.nodeToAdd.type,
          icon: data.nodeToAdd.icon,
          title: data.nodeToAdd.title,
          subtitle: data.nodeToAdd.subtitle,
          color: data.nodeToAdd.color,
          status: "complete"
        };
        setWorkflowNodes(prev => [...prev, newNode]);
      }

      // Check for workflow activation
      if (messageText.toLowerCase().includes('activate') || messageText.toLowerCase().includes('deploy') || messageText.toLowerCase().includes('finalize')) {
        activateWorkflow();
        
        // Add celebration message with template suggestions
        const templateSuggestions = workflowTemplates
          .filter(t => !workflowNodes.some(n => n.title.toLowerCase().includes(t.name.toLowerCase().split(' ')[0])))
          .slice(0, 4)
          .map(t => `Build a ${t.name} workflow`);
        
        const celebrationMessage: AIMessage = {
          id: `celebration-${Date.now()}`,
          role: "assistant",
          content: `🎉 **Workflow Activated!**\n\nYour workflow with ${workflowNodes.length} automated steps is now live. Here's what it will do:\n\n${workflowNodes.map((node, i) => `${i + 1}. **${node.title}** — ${node.subtitle}`).join('\n')}\n\n---\n\n**Ready to automate more?** Try one of these popular templates:`,
          suggestions: templateSuggestions.length > 0 ? templateSuggestions : [
            "Build an Invoice Approval workflow",
            "Build an Employee Onboarding workflow", 
            "Build a Sales Pipeline workflow",
            "Build a Customer Support workflow"
          ]
        };
        
        setTimeout(() => {
          setMessages(prev => [...prev, celebrationMessage]);
        }, 500);
      }

    } catch (err) {
      console.error('Failed to send message:', err);
      const errorMessage: AIMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I apologize, but I encountered an issue. Please try again or rephrase your request."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const [showTemplates, setShowTemplates] = useState(false);
  const [isAutoBuilding, setIsAutoBuilding] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Confetti celebration function
  const triggerConfetti = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899']
    });

    frame();
  }, []);

  // Activate workflow with celebration
  const activateWorkflow = useCallback(() => {
    setWorkflowActive(true);
    setShowCelebration(true);
    triggerConfetti();
  }, [triggerConfetti]);

  const handleReset = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "👋 Hi! I'm your Workflow AI. Tell me what process you'd like to automate, and I'll build it for you — no coding required!\n\n**Popular enterprise automations:**",
      suggestions: enterpriseSuggestions.slice(0, 4)
    }]);
    setWorkflowNodes([]);
    setWorkflowActive(false);
    setShowCelebration(false);
    setInputValue("");
    setShowTemplates(false);
    setIsAutoBuilding(false);
  };

  const applyTemplate = async (template: WorkflowTemplate) => {
    setShowTemplates(false);
    setIsAutoBuilding(true);
    
    // Add user message
    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: `Use the "${template.name}" template`
    };
    setMessages(prev => [...prev, userMessage]);

    // Add AI response
    const aiMessage: AIMessage = {
      id: `ai-${Date.now()}`,
      role: "assistant",
      content: `Great choice! I'm building the **${template.name}** workflow for you. Watch the canvas as I add each step...`
    };
    setMessages(prev => [...prev, aiMessage]);

    // Animate adding nodes one by one
    for (let i = 0; i < template.nodes.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const node = template.nodes[i];
      const newNode: WorkflowNode = {
        id: `node-${Date.now()}-${i}`,
        type: node.type,
        icon: node.icon,
        title: node.title,
        subtitle: node.subtitle,
        color: node.color,
        status: "complete"
      };
      setWorkflowNodes(prev => [...prev, newNode]);
    }

    // Final message
    await new Promise(resolve => setTimeout(resolve, 500));
    const completeMessage: AIMessage = {
      id: `ai-complete-${Date.now()}`,
      role: "assistant",
      content: `✅ Your **${template.name}** workflow is ready! It includes ${template.nodes.length} automated steps.\n\nYou can customize any step or say "activate" to deploy it.`,
      suggestions: ["Activate this workflow", "Add email notification", "Customize the trigger", "Add another condition"]
    };
    setMessages(prev => [...prev, completeMessage]);
    setIsAutoBuilding(false);
  };

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName] || Zap;
  };

  // Category pills for template filtering
  const categories = [...new Set(workflowTemplates.map(t => t.category))];

  return (
    <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden min-h-[600px] sm:min-h-[680px] lg:h-[780px] w-full max-w-5xl mx-auto flex flex-col lg:flex-row">
      {/* Workflow Canvas */}
      <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-border bg-gradient-to-br from-slate-900/50 via-background to-background">
        {/* Canvas Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-border/50 bg-background/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/10">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base sm:text-lg">Workflow Builder</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">No-Code Automation</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {workflowNodes.length > 0 && (
                <button
                  onClick={handleReset}
                  className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  title="Reset workflow"
                >
                  <RefreshCw className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              {workflowActive ? (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
                >
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-emerald-500"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="text-xs sm:text-sm text-emerald-500 font-semibold">Active</span>
                </motion.div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">Draft</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto relative">
          {/* Celebration Screen */}
          <AnimatePresence>
            {showCelebration && workflowActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-20 flex items-center justify-center bg-gradient-to-br from-background/95 via-emerald-500/5 to-background/95 backdrop-blur-sm"
              >
                <div className="text-center max-w-md mx-auto px-4">
                  {/* Animated success icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/30"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: "spring" }}
                    >
                      <Rocket className="w-10 h-10 text-white" />
                    </motion.div>
                  </motion.div>

                  {/* Title */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <PartyPopper className="w-5 h-5 text-amber-500" />
                      <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                        Workflow Activated!
                      </h3>
                      <PartyPopper className="w-5 h-5 text-amber-500 scale-x-[-1]" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                      Your automation is now live and running
                    </p>
                  </motion.div>

                  {/* Workflow Summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-card/80 rounded-xl border border-border/50 p-4 mb-6 text-left"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Workflow Summary
                      </span>
                    </div>
                    <div className="space-y-2">
                      {workflowNodes.map((node, idx) => {
                        const IconComponent = getIconComponent(node.icon);
                        return (
                          <motion.div
                            key={node.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + idx * 0.1 }}
                            className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                          >
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${node.color}20` }}
                            >
                              <IconComponent className="w-4 h-4" style={{ color: node.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{node.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{node.subtitle}</p>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Action buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col sm:flex-row gap-3 justify-center"
                  >
                    <motion.button
                      onClick={() => setShowCelebration(false)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted/50 hover:bg-muted border border-border text-foreground text-sm font-medium transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Workflow
                    </motion.button>
                    <motion.button
                      onClick={handleReset}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all shadow-lg shadow-primary/20"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Plus className="w-4 h-4" />
                      Create Another
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {workflowNodes.length === 0 && !showTemplates ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center"
            >
              <motion.div 
                className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 border border-dashed border-border"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Plus className="w-8 h-8 text-muted-foreground" />
              </motion.div>
              <p className="text-sm sm:text-base text-muted-foreground font-medium mb-2">No workflow yet</p>
              <p className="text-xs sm:text-sm text-muted-foreground/70 max-w-xs mb-4">
                Tell the AI what you want to automate or start from a template
              </p>
              <motion.button
                onClick={() => setShowTemplates(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-sm font-medium transition-all shadow-lg shadow-primary/10"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <LayoutTemplate className="w-4 h-4" />
                Browse Templates
              </motion.button>
            </motion.div>
          ) : showTemplates ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4 text-primary" />
                  Workflow Templates
                </h4>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
              
              {/* Category pills */}
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <span key={cat} className="px-3 py-1 text-xs rounded-full bg-muted border border-border text-muted-foreground">
                    {cat}
                  </span>
                ))}
              </div>
              
              <div className="grid gap-3">
                {workflowTemplates.map((template, idx) => (
                  <motion.button
                    key={template.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => applyTemplate(template)}
                    className="flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 hover:bg-primary/5 transition-all text-left group shadow-sm hover:shadow-md hover:shadow-primary/5"
                  >
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: `${template.color}15`, border: `1px solid ${template.color}30` }}
                    >
                      <template.icon className="w-5 h-5" style={{ color: template.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{template.name}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">{template.category}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{template.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {template.nodes.length} steps
                        </span>
                      </div>
                    </div>
                    <Play className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Workflow Steps Header */}
              {workflowNodes.length > 0 && (
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Workflow ({workflowNodes.length} steps)
                  </span>
                  {workflowActive && (
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">
                      Live
                    </span>
                  )}
                </div>
              )}
              
              {/* Horizontal Workflow Canvas */}
              <div className="flex-1 flex items-center justify-start overflow-hidden">
                <HorizontalWorkflowCanvas 
                  nodes={workflowNodes}
                  getIconComponent={getIconComponent}
                  workflowActive={workflowActive}
                />
              </div>
            </div>
          )}

          {/* Auto-building indicator */}
          {isAutoBuilding && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-sm shadow-lg"
            >
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-primary font-medium">Building workflow...</span>
            </motion.div>
          )}
        </div>

        {/* Available Actions */}
        <div className="px-4 sm:px-6 py-3 border-t border-border/50 bg-background/50 backdrop-blur-sm">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Available Actions</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {availableNodeTypes.map((node) => (
              <motion.div
                key={node.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50 shrink-0 cursor-default"
                whileHover={{ scale: 1.02, borderColor: node.color }}
              >
                <node.icon className="w-4 h-4" style={{ color: node.color }} />
                <span className="text-xs font-medium text-muted-foreground">{node.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Assistant Panel */}
      <div className="w-full lg:w-[380px] flex flex-col bg-gradient-to-b from-background to-muted/10">
        {/* AI Header */}
        <div className="px-4 sm:px-5 py-4 border-b border-border/50 bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm sm:text-base">Workflow AI</h3>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                Your automation guide
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {message.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3 max-w-[90%] shadow-lg shadow-primary/10">
                      <p className="text-sm sm:text-base">{message.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2.5">
                    <ChatAvatar role="assistant" size="sm" className="mt-1" />
                    <div className="bg-card/80 backdrop-blur-sm rounded-2xl rounded-bl-md p-4 border border-border/50 shadow-sm max-w-[90%]">
                      <DemoMarkdown content={message.content} className="text-sm sm:text-base" />
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-xs font-medium">Suggestions</span>
                          </div>
                          {message.suggestions.map((suggestion, idx) => {
                            const isCompletionSuggestion = /(activate|deploy|complete|finalize|finish|done|ready)/i.test(suggestion);
                            return (
                              <motion.button
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => handleSuggestionClick(suggestion)}
                                disabled={isLoading}
                                className={cn(
                                  "w-full text-left px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 disabled:opacity-50 group",
                                  isCompletionSuggestion 
                                    ? "bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-700 dark:text-emerald-400" 
                                    : "bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 text-foreground"
                                )}
                              >
                                {isCompletionSuggestion ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                ) : (
                                  <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                )}
                                <span className="line-clamp-2">{suggestion}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <div className="flex gap-2.5">
              <ChatAvatar role="assistant" size="sm" className="mt-1" />
              <ChatTypingIndicator showAvatar={false} variant="dots" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Describe what you want to automate..."
                disabled={isLoading}
                className="w-full px-4 py-3 text-sm bg-muted/50 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 disabled:opacity-50 transition-all"
              />
            </div>
            <motion.button 
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3 font-medium flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-primary" />
            AI guides every step • No coding needed
          </p>
        </form>
      </div>
    </div>
  );
}
