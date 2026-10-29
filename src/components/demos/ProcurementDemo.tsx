import { useState, useEffect, useRef, useCallback } from "react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import {
  ShoppingCart,
  Users,
  FileText,
  Send,
  CheckCircle2,
  Clock,
  ArrowRight,
  Building2,
  Search,
  Sparkles,
  Bot,
  DollarSign,
  Scale,
  TrendingDown,
  BarChart3,
  FileCheck,
  PenTool,
  Handshake,
  Package,
  Truck,
  ClipboardList,
  Star,
  ChevronRight,
  Play,
  RefreshCw,
  Zap,
  Target,
  Shield,
  Globe,
  MessageSquare,
  Mail,
  Calendar,
  Award,
  Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DemoMarkdown } from "./DemoMarkdown";
import { useChatContext } from "@/contexts/ChatContext";

type WorkflowStep = {
  id: string;
  step: string;
  title: string;
  icon: typeof ShoppingCart;
  description: string;
  details: string[];
  color: string;
  savings?: string;
};

const workflowSteps: WorkflowStep[] = [
  {
    id: "deal",
    step: "1",
    title: "Deal Won in CRM",
    icon: Handshake,
    description: "Sales closes deal, triggers procurement workflow",
    details: [
      "Deal marked as 'Won' in CRM",
      "Auto-extract project requirements",
      "Identify procurement needs from scope"
    ],
    color: "from-emerald-500/20 to-green-500/10"
  },
  {
    id: "requirements",
    step: "2",
    title: "AI Requirements Gathering",
    icon: ClipboardList,
    description: "AI extracts and structures procurement needs",
    details: [
      "Parse contract for deliverables",
      "Categorize by spend category",
      "Suggest specifications & quantities"
    ],
    color: "from-blue-500/20 to-cyan-500/10"
  },
  {
    id: "matching",
    step: "3",
    title: "AI Supplier Matching",
    icon: Search,
    description: "Find best suppliers from internal/external database",
    details: [
      "Match against approved vendor list",
      "Score by capability & history",
      "Include external marketplace options"
    ],
    color: "from-purple-500/20 to-violet-500/10",
    savings: "15% avg savings"
  },
  {
    id: "tender",
    step: "4",
    title: "Tender Document Generation",
    icon: FileText,
    description: "Auto-generate professional tender documents",
    details: [
      "Create RFQ/RFP from templates",
      "Include evaluation criteria",
      "Set submission deadlines"
    ],
    color: "from-orange-500/20 to-amber-500/10"
  },
  {
    id: "distribute",
    step: "5",
    title: "Tender Distribution",
    icon: Send,
    description: "Send to matched suppliers automatically",
    details: [
      "Multi-channel distribution (email, portal)",
      "Track opens and responses",
      "Answer supplier questions via AI"
    ],
    color: "from-pink-500/20 to-rose-500/10"
  },
  {
    id: "evaluate",
    step: "6",
    title: "AI Bid Evaluation",
    icon: Scale,
    description: "Compare proposals with weighted scoring",
    details: [
      "Normalize pricing for comparison",
      "Score against criteria matrix",
      "Flag outliers and risks"
    ],
    color: "from-indigo-500/20 to-blue-500/10"
  },
  {
    id: "negotiate",
    step: "7",
    title: "Negotiation & Award",
    icon: Target,
    description: "AI-assisted negotiation and supplier selection",
    details: [
      "Suggest negotiation points",
      "Draft counter-offers",
      "Issue award notification"
    ],
    color: "from-teal-500/20 to-cyan-500/10"
  },
  {
    id: "contract",
    step: "8",
    title: "Contract Generation",
    icon: FileCheck,
    description: "Auto-generate supplier contracts",
    details: [
      "Merge terms from template",
      "Include negotiated pricing",
      "Route for approval"
    ],
    color: "from-yellow-500/20 to-orange-500/10"
  },
  {
    id: "sign",
    step: "9",
    title: "Digital Signing",
    icon: PenTool,
    description: "Execute contracts with e-signatures",
    details: [
      "DocuSign/Adobe Sign integration",
      "Automatic reminder sequences",
      "Signed copy to all parties"
    ],
    color: "from-red-500/20 to-rose-500/10"
  },
  {
    id: "project",
    step: "10",
    title: "Project Activation",
    icon: Building2,
    description: "Create project with all procurement data",
    details: [
      "Auto-setup in Accountable.link",
      "Attach suppliers & contracts",
      "Trigger delivery tracking"
    ],
    color: "from-violet-500/20 to-purple-500/10"
  }
];

type Supplier = {
  id: string;
  name: string;
  location: string;
  rating: number;
  experience: string;
  minOrder: string;
  capacity: string;
  certifications: string[];
  matchScore: number;
  priceScore: number;
  qualityScore: number;
};

const mockSuppliers: Supplier[] = [
  {
    id: "1",
    name: "TechPro Manufacturing",
    location: "Sydney, NSW",
    rating: 4.8,
    experience: "12 Years",
    minOrder: "$5,000",
    capacity: "50,000 units",
    certifications: ["ISO 9001", "ISO 14001"],
    matchScore: 94,
    priceScore: 88,
    qualityScore: 96
  },
  {
    id: "2",
    name: "BuildRight Supplies",
    location: "Melbourne, VIC",
    rating: 4.6,
    experience: "8 Years",
    minOrder: "$2,500",
    capacity: "30,000 units",
    certifications: ["ISO 9001"],
    matchScore: 87,
    priceScore: 92,
    qualityScore: 84
  },
  {
    id: "3",
    name: "Global Materials Co",
    location: "Brisbane, QLD",
    rating: 4.9,
    experience: "15 Years",
    minOrder: "$10,000",
    capacity: "100,000 units",
    certifications: ["ISO 9001", "ISO 45001", "AS/NZS 4801"],
    matchScore: 91,
    priceScore: 78,
    qualityScore: 98
  }
];

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  action?: string;
  suppliers?: Supplier[];
  workflowStep?: string;
  savings?: { amount: string; percent: string };
};

const demoConversation: ChatMessage[] = [
  {
    role: "assistant",
    content: "🎉 New Deal Won!\n\n**ACME Corp Office Fitout**\n• Value: $450,000\n• Timeline: 12 weeks\n• Contact: Jane Smith\n\nAnalyzing scope of work for procurement needs...",
    action: "Step 1: Deal synced from CRM",
    workflowStep: "deal"
  },
  {
    role: "assistant",
    content: "📋 Procurement Requirements Extracted\n\nFrom the scope of work, I've identified:\n\n**Materials Needed:**\n• Office Furniture (desks, chairs) - $85,000\n• IT Equipment (workstations) - $62,000\n• Flooring & Carpeting - $45,000\n• Lighting & Electrical - $38,000\n\n**Services Required:**\n• Interior Fit-out Contractor\n• Electrical Subcontractor\n• IT Infrastructure Installer\n\n💡 Total Procurement Value: $230,000",
    action: "Step 2: Requirements parsed",
    workflowStep: "requirements"
  },
  {
    role: "user",
    content: "Find suppliers for the office furniture"
  },
  {
    role: "assistant",
    content: "🔍 Searching Supplier Database...\n\nMatching against:\n• Approved vendor list (internal)\n• Industry marketplace (external)\n• Past performance records\n\nFound **12 suppliers** matching criteria.\nTop 3 recommendations based on capability, price, and quality scores:",
    action: "Step 3: AI Matching Complete",
    suppliers: mockSuppliers,
    workflowStep: "matching",
    savings: { amount: "$12,750", percent: "15%" }
  },
  {
    role: "user",
    content: "Create a tender for top 3 suppliers"
  },
  {
    role: "assistant",
    content: "📄 Tender Document Generated\n\n**RFQ: Office Furniture Supply**\n• Reference: RFQ-2024-0892\n• Category: Furniture & Fixtures\n• Budget: $85,000\n• Deadline: 7 days\n\n**Evaluation Criteria:**\n• Price (40%)\n• Quality & Compliance (30%)\n• Delivery Timeline (20%)\n• Warranty & Support (10%)\n\n**Inclusions:**\n✓ Detailed specifications\n✓ Delivery requirements\n✓ Terms & conditions\n✓ Response template",
    action: "Step 4: Tender created",
    workflowStep: "tender"
  },
  {
    role: "user",
    content: "Send to the suppliers"
  },
  {
    role: "assistant",
    content: "📨 Tender Distributed\n\nSent to 3 suppliers via:\n• Email with portal link\n• Supplier portal notification\n\n**Tracking Enabled:**\n• TechPro Manufacturing - Opened ✓\n• BuildRight Supplies - Pending\n• Global Materials Co - Opened ✓\n\n🤖 AI will auto-respond to clarification questions\n📅 Submission deadline: 7 days\n🔔 Reminders scheduled for Day 3 & Day 6",
    action: "Step 5: RFQ sent",
    workflowStep: "distribute"
  },
  {
    role: "assistant",
    content: "📊 All Bids Received!\n\n**Submission Summary:**\n\n| Supplier | Price | Delivery | Score |\n|----------|-------|----------|-------|\n| TechPro | $78,500 | 3 weeks | 92 |\n| BuildRight | $72,800 | 4 weeks | 88 |\n| Global | $81,200 | 2 weeks | 85 |\n\n💡 **AI Analysis:**\nBuildRight offers lowest price but longer delivery.\nTechPro provides best overall value.\nGlobal Materials has fastest delivery but premium pricing.\n\n⚠️ BuildRight quote missing warranty details - flagged for clarification.",
    action: "Step 6: Bids evaluated",
    workflowStep: "evaluate",
    savings: { amount: "$6,500", percent: "8%" }
  },
  {
    role: "user",
    content: "Negotiate with TechPro for better pricing"
  },
  {
    role: "assistant",
    content: "🤝 Negotiation Strategy\n\n**Leverage Points Identified:**\n• BuildRight's lower quote ($72,800)\n• Volume commitment potential\n• Multi-project relationship\n\n**Counter-Offer Drafted:**\n\n\"Based on competitive bids received, we'd like to discuss:\n1. Price reduction to $74,500 (5% off)\n2. Extended warranty to 3 years\n3. Free delivery & installation\n\nIn exchange, we can offer preferred supplier status for upcoming projects.\"\n\n✅ TechPro Responded:\nAccepted $76,000 with 2-year warranty and free installation.\n\n💰 **Negotiated Savings: $2,500**",
    action: "Step 7: Award negotiated",
    workflowStep: "negotiate",
    savings: { amount: "$9,000", percent: "11%" }
  },
  {
    role: "user",
    content: "Generate the contract"
  },
  {
    role: "assistant",
    content: "📝 Contract Generated\n\n**Supplier Agreement - TechPro Manufacturing**\n\n**Key Terms:**\n• Order Value: $76,000\n• Delivery: 3 weeks from signing\n• Payment: 30% deposit, 70% on delivery\n• Warranty: 2 years parts & labor\n• Installation: Included\n\n**Attached Documents:**\n📎 Master Supply Agreement.pdf\n📎 Pricing Schedule.xlsx\n📎 Product Specifications.pdf\n📎 Warranty Terms.pdf\n\n**Approval Routing:**\n1. Procurement Manager - Pending\n2. Finance Director - Pending\n3. Project Manager - Pending",
    action: "Step 8: Contract drafted",
    workflowStep: "contract"
  },
  {
    role: "user",
    content: "Send for signatures"
  },
  {
    role: "assistant",
    content: "✍️ Signature Request Sent\n\n**DocuSign Envelope Created**\n\n**Signing Order:**\n1. ✅ John Smith (Procurement) - Signed\n2. ✅ Lisa Wong (Finance) - Signed\n3. ⏳ David Chen (TechPro) - Awaiting\n\n📧 Reminder sequence:\n• Day 1: Initial request ✓\n• Day 3: First reminder\n• Day 5: Final reminder\n\n🔔 You'll be notified when fully executed.",
    action: "Step 9: Signatures in progress",
    workflowStep: "sign"
  },
  {
    role: "assistant",
    content: "🎉 Contract Fully Executed!\n\nAll parties have signed.\n\n**Project Activation:**\n✅ Project created in Accountable.link\n✅ Supplier linked to project\n✅ Contract attached to records\n✅ Delivery tracking enabled\n✅ Payment schedule created\n\n📊 **Procurement Summary:**\n• Original Budget: $85,000\n• Final Cost: $76,000\n• **Total Savings: $9,000 (11%)**\n\n🚀 Ready for project execution!",
    action: "Step 10: Project activated",
    workflowStep: "project",
    savings: { amount: "$9,000", percent: "11%" }
  }
];

export default function ProcurementDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [totalSavings, setTotalSavings] = useState({ amount: 0, percent: 0 });
  const [activeTab, setActiveTab] = useState<"workflow" | "demo">("demo");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { setDemoActive } = useChatContext();

  // Track demo active state
  const isDemoRunning = messages.length > 0;
  
  useEffect(() => {
    setDemoActive(isDemoRunning);
    return () => setDemoActive(false);
  }, [isDemoRunning, setDemoActive]);

  const tabOrder: ("demo" | "workflow")[] = ["demo", "workflow"];
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeNavigation({
    items: tabOrder,
    activeItem: activeTab,
    onNavigate: setActiveTab,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const updateCompletedSteps = (msgs: ChatMessage[]) => {
    const completedIds = new Set<string>();
    let savingsAmount = 0;
    msgs.forEach(msg => {
      if (msg.workflowStep) {
        completedIds.add(msg.workflowStep);
      }
      if (msg.savings) {
        savingsAmount = parseInt(msg.savings.amount.replace(/[^0-9]/g, ''));
      }
    });
    setCompletedSteps(Array.from(completedIds));
    setProgress(Math.min(Math.round((completedIds.size / workflowSteps.length) * 100), 100));
    setTotalSavings({ amount: savingsAmount, percent: Math.round(savingsAmount / 85000 * 100) });
  };

  const simulateNextMessage = () => {
    if (demoIndex >= demoConversation.length) return;

    const currentIndex = demoIndex;
    const message = demoConversation[currentIndex];

    const newMessages = [...messages, message];
    setMessages(newMessages);
    updateCompletedSteps(newMessages);

    if (message.role === "assistant" && currentIndex + 1 < demoConversation.length) {
      const nextMsg = demoConversation[currentIndex + 1];
      if (nextMsg.role === "assistant") {
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            const updatedMessages = [...newMessages, nextMsg];
            setMessages(updatedMessages);
            setDemoIndex(currentIndex + 2);
            updateCompletedSteps(updatedMessages);
          }, 1500);
        }, 1000);
      } else {
        setDemoIndex(currentIndex + 1);
      }
    } else if (message.role === "user" && currentIndex + 1 < demoConversation.length) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const assistantMsg = demoConversation[currentIndex + 1];
          const updatedMessages = [...newMessages, assistantMsg];
          setMessages(updatedMessages);
          setDemoIndex(currentIndex + 2);
          updateCompletedSteps(updatedMessages);
        }, 1800);
      }, 500);
    } else {
      setDemoIndex(currentIndex + 1);
    }
  };

  const startDemo = () => {
    setMessages([]);
    setDemoIndex(0);
    setCompletedSteps([]);
    setProgress(0);
    setTotalSavings({ amount: 0, percent: 0 });
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const firstMsg = demoConversation[0];
        setMessages([firstMsg]);
        updateCompletedSteps([firstMsg]);
        // Auto-continue to second message
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            const secondMsg = demoConversation[1];
            setMessages([firstMsg, secondMsg]);
            updateCompletedSteps([firstMsg, secondMsg]);
            setDemoIndex(2);
          }, 1500);
        }, 1000);
      }, 1200);
    }, 300);
  };

  const resetDemo = () => {
    setMessages([]);
    setDemoIndex(0);
    setCompletedSteps([]);
    setProgress(0);
    setTotalSavings({ amount: 0, percent: 0 });
  };

  const getNextPrompt = () => {
    if (demoIndex >= demoConversation.length) return null;
    const next = demoConversation[demoIndex];
    return next.role === "user" ? next.content : null;
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-bold text-sm sm:text-lg truncate">AI Procurement Manager</h3>
                <p className="text-white/80 text-xs sm:text-sm hidden sm:block">Deals → Procurement → Projects</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {totalSavings.amount > 0 && (
                <div className="px-2 sm:px-4 py-1 sm:py-2 rounded-full bg-emerald-500/20 backdrop-blur-sm flex items-center gap-1 sm:gap-2">
                  <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold text-xs sm:text-sm tabular-nums">${totalSavings.amount.toLocaleString()}</span>
                </div>
              )}
              <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                <span className="text-white text-xs sm:text-sm font-medium">{progress}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/50">
          <button
            onClick={() => setActiveTab("demo")}
            className={cn(
              "flex-1 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors",
              activeTab === "demo" 
                ? "text-white bg-slate-800/50 border-b-2 border-teal-500" 
                : "text-slate-400 hover:text-white"
            )}
          >
            <Bot className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Interactive </span>Demo
          </button>
          <button
            onClick={() => setActiveTab("workflow")}
            className={cn(
              "flex-1 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors",
              activeTab === "workflow" 
                ? "text-white bg-slate-800/50 border-b-2 border-teal-500" 
                : "text-slate-400 hover:text-white"
            )}
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
            Workflow
          </button>
        </div>

        {activeTab === "workflow" ? (
          /* Workflow View */
          <div 
            className="p-6 space-y-4"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="text-center mb-6">
              <h4 className="text-xl font-semibold text-white mb-2">10-Step Procurement Workflow</h4>
              <p className="text-slate-400">From deal close to project activation, fully automated</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-3">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = completedSteps.includes(step.id);
                
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "p-4 rounded-xl border transition-all cursor-pointer",
                      isCompleted
                        ? "bg-teal-500/15 border-teal-500/40"
                        : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600"
                    )}
                    onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        isCompleted ? "bg-teal-500" : "bg-slate-700"
                      )}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        ) : (
                          <Icon className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-teal-400 font-medium">Step {step.step}</span>
                          {step.savings && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                              {step.savings}
                            </Badge>
                          )}
                        </div>
                        <h5 className="text-white font-medium text-sm">{step.title}</h5>
                        <p className="text-slate-400 text-xs mt-1">{step.description}</p>
                        
                        <AnimatePresence>
                          {expandedStep === step.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-3 pt-3 border-t border-slate-700/50"
                            >
                              <ul className="space-y-1">
                                {step.details.map((detail, i) => (
                                  <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                                    <ChevronRight className="w-3 h-3 text-teal-400" />
                                    {detail}
                                  </li>
                                ))}
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="mt-6 p-4 bg-slate-800/50 rounded-xl">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Workflow Progress</span>
                <span className="text-white font-medium">{completedSteps.length} of {workflowSteps.length} steps</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        ) : (
          /* Demo View */
          <div 
            className="grid lg:grid-cols-3 gap-0"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Left: Suppliers Panel */}
            <div className="lg:col-span-1 border-r border-slate-700/50 p-4 bg-slate-800/30">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-teal-400" />
                <h4 className="text-white font-medium text-sm">Matched Suppliers</h4>
              </div>
              
              <div className="space-y-3">
                {messages.some(m => m.suppliers) ? (
                  mockSuppliers.map((supplier, index) => (
                    <motion.div
                      key={supplier.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 bg-slate-800 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-white font-medium text-sm">{supplier.name}</h5>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="text-amber-400 text-xs">{supplier.rating}</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 mb-2">{supplier.location}</div>
                      
                      <div className="grid grid-cols-3 gap-1 mb-2">
                        <div className="text-center p-1 bg-slate-700/50 rounded">
                          <div className="text-[10px] text-slate-400">Match</div>
                          <div className="text-xs text-teal-400 font-medium">{supplier.matchScore}%</div>
                        </div>
                        <div className="text-center p-1 bg-slate-700/50 rounded">
                          <div className="text-[10px] text-slate-400">Price</div>
                          <div className="text-xs text-emerald-400 font-medium">{supplier.priceScore}%</div>
                        </div>
                        <div className="text-center p-1 bg-slate-700/50 rounded">
                          <div className="text-[10px] text-slate-400">Quality</div>
                          <div className="text-xs text-cyan-400 font-medium">{supplier.qualityScore}%</div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {supplier.certifications.map((cert, i) => (
                          <Badge key={i} variant="outline" className="text-[9px] border-slate-600 text-slate-400">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Start demo to find suppliers</p>
                  </div>
                )}
              </div>

              {/* Savings Tracker */}
              {totalSavings.amount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-gradient-to-br from-emerald-500/20 to-green-500/10 rounded-xl border border-emerald-500/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Percent className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-medium text-sm">Savings Tracker</span>
                  </div>
                  <div className="text-2xl font-bold text-white tabular-nums">${totalSavings.amount.toLocaleString()}</div>
                  <div className="text-sm text-emerald-400 tabular-nums">{totalSavings.percent}% below budget</div>
                </motion.div>
              )}
            </div>

            {/* Right: Chat Area */}
            <div className="lg:col-span-2 flex flex-col h-[600px]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center mb-4 border border-teal-500/20">
                      <ShoppingCart className="w-8 h-8 text-teal-400" />
                    </div>
                    <h4 className="text-white font-semibold text-lg mb-2">AI Procurement Manager</h4>
                    <p className="text-slate-400 text-sm mb-6 max-w-md">
                      Experience end-to-end procurement automation. From CRM deal close to supplier contracts and project activation.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                      <Badge className="bg-teal-500/15 text-teal-300 border border-teal-500/30">AI Supplier Matching</Badge>
                      <Badge className="bg-teal-500/15 text-teal-300 border border-teal-500/30">Auto Tendering</Badge>
                      <Badge className="bg-teal-500/15 text-teal-300 border border-teal-500/30">Contract Generation</Badge>
                      <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">15% Avg Savings</Badge>
                    </div>
                    <Button onClick={startDemo} className="bg-teal-600 hover:bg-teal-500 text-white glow-pulse animate-pulse">
                      <Play className="w-4 h-4 mr-2" />
                      Start Demo
                    </Button>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex",
                          msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-3",
                          msg.role === "user"
                            ? "bg-teal-600 text-white"
                            : "bg-slate-800/80 border border-slate-700/50"
                        )}>
                          {msg.action && (
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/50">
                              <Zap className="w-3 h-3 text-teal-400" />
                              <span className="text-xs text-teal-400">{msg.action}</span>
                            </div>
                          )}
                          {msg.role === "assistant" ? (
                            <DemoMarkdown content={msg.content} lightText />
                          ) : (
                            <div className="text-sm whitespace-pre-wrap text-white">
                              {msg.content}
                            </div>
                          )}
                          {msg.savings && (
                            <div className="mt-3 pt-2 border-t border-slate-600 flex items-center gap-2">
                              <TrendingDown className="w-4 h-4 text-emerald-400" />
                              <span className="text-sm text-emerald-400 font-medium">
                                Savings: {msg.savings.amount} ({msg.savings.percent})
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                            <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              {messages.length > 0 && (
                <div className="border-t border-slate-700/50 p-4 bg-slate-800/30">
                  {demoIndex < demoConversation.length ? (
                    <div className="flex items-center gap-2 sm:gap-3">
                      {getNextPrompt() ? (
                        <Button
                          onClick={simulateNextMessage}
                          className="flex-1 min-w-0 bg-teal-600 hover:bg-teal-500 text-white justify-start text-xs sm:text-sm px-2 sm:px-4 overflow-hidden"
                          disabled={isTyping}
                        >
                          <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 shrink-0" />
                          <span className="overflow-hidden flex-1 min-w-0">
                            <span className="inline-block whitespace-nowrap sm:whitespace-normal animate-marquee sm:animate-none">
                              &quot;{getNextPrompt()}&quot;
                            </span>
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-2 shrink-0" />
                        </Button>
                      ) : (
                      <motion.div
                        className="flex-1"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Button
                          onClick={simulateNextMessage}
                          variant="outline"
                          className="w-full border-primary/50 text-primary bg-primary/10 hover:bg-primary/20 relative overflow-hidden group"
                          disabled={isTyping}
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          />
                          <Clock className="w-4 h-4 mr-2 relative z-10" />
                          <span className="relative z-10">Continue Demo...</span>
                          <motion.div
                            className="ml-2 relative z-10"
                            animate={{ x: [0, 4, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <ArrowRight className="w-4 h-4" />
                          </motion.div>
                        </Button>
                      </motion.div>
                    )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 text-center">
                        <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
                          <Award className="w-5 h-5" />
                          <span className="font-semibold">Demo Complete!</span>
                        </div>
                        <p className="text-slate-400 text-sm">Full procurement workflow demonstrated</p>
                      </div>
                      <Button onClick={resetDemo} variant="outline" className="border-slate-600 text-slate-300">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Restart
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-800/30 px-3 sm:px-6 py-2 sm:py-3 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Globe className="w-3 h-3 text-teal-400 shrink-0" /> 
                <span className="hidden sm:inline">Marketplace </span>Integrated
              </span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Shield className="w-3 h-3 text-teal-400 shrink-0" /> 
                Compliant<span className="hidden sm:inline"> Procurement</span>
              </span>
            </div>
            <span className="whitespace-nowrap shrink-0">Powered by alfred ai</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}