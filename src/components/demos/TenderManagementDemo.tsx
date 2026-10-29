import { useState, useEffect, useRef, useCallback } from "react";
import { InlineDemoSpeedControl } from "@/components/demos/shared/InlineDemoSpeedControl";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import {
  FileText,
  Send,
  CheckCircle2,
  Clock,
  ArrowRight,
  Building2,
  Search,
  Sparkles,
  Bot,
  Scale,
  BarChart3,
  ClipboardList,
  ChevronRight,
  Play,
  RefreshCw,
  Zap,
  Target,
  Shield,
  Upload,
  Users,
  Award,
  AlertTriangle,
  Eye,
  MessageSquare,
  DollarSign,
  FileCheck,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DemoMarkdown } from "./DemoMarkdown";
import { useChatContext } from "@/contexts/ChatContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type WorkflowStep = {
  id: string;
  step: string;
  title: string;
  icon: typeof FileText;
  description: string;
  details: string[];
  color: string;
  savings?: string;
};

const workflowSteps: WorkflowStep[] = [
  {
    id: "rfq-generation",
    step: "1",
    title: "RFQ/RFP Generation",
    icon: FileText,
    description: "AI generates professional tender documents from requirements",
    details: [
      "Select tender type (RFQ for goods, RFP for services)",
      "AI auto-populates specs from project brief",
      "Configure weighted evaluation criteria",
      "Set submission deadlines & terms"
    ],
    color: "from-blue-500/20 to-cyan-500/10"
  },
  {
    id: "distribution",
    step: "2",
    title: "Supplier Distribution",
    icon: Send,
    description: "Multi-channel distribution to qualified suppliers",
    details: [
      "Match suppliers from approved vendor database",
      "Distribute via email, portal, and networks",
      "Track invitation opens & downloads",
      "AI answers supplier clarifications"
    ],
    color: "from-purple-500/20 to-violet-500/10"
  },
  {
    id: "portal-submission",
    step: "3",
    title: "Tender Portal Submission",
    icon: Upload,
    description: "Supplier self-service submission with compliance tracking",
    details: [
      "Secure document upload portal",
      "Mandatory compliance checklist",
      "Real-time submission status",
      "Late submission auto-rejection"
    ],
    color: "from-emerald-500/20 to-green-500/10"
  },
  {
    id: "bid-comparison",
    step: "4",
    title: "Bid Comparison & Evaluation",
    icon: Scale,
    description: "AI-powered side-by-side analysis with weighted scoring",
    details: [
      "Normalized price comparison matrix",
      "Weighted criteria scoring",
      "Risk flags for outliers",
      "AI recommendation with confidence"
    ],
    color: "from-orange-500/20 to-amber-500/10",
    savings: "25% faster evaluation"
  },
  {
    id: "negotiation",
    step: "5",
    title: "Negotiation & Clarification",
    icon: MessageSquare,
    description: "AI-assisted BAFO and counter-offer management",
    details: [
      "Counter-offer drafting assistant",
      "Best-and-final-offer (BAFO) tracking",
      "Price negotiation history",
      "Terms clarification workflow"
    ],
    color: "from-pink-500/20 to-rose-500/10"
  },
  {
    id: "award",
    step: "6",
    title: "Award & Notification",
    icon: Award,
    description: "Generate award letters and notify all bidders",
    details: [
      "Winner confirmation & compliance check",
      "Award letter generation",
      "Unsuccessful bidder notifications",
      "Contract handoff preparation"
    ],
    color: "from-teal-500/20 to-cyan-500/10"
  }
];

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: string;
  workflowStep?: string;
  suppliers?: SupplierMatch[];
  submissions?: PortalSubmission[];
  bidMatrix?: BidComparison[];
  awardData?: AwardData;
};

type SupplierMatch = {
  name: string;
  category: string;
  score: number;
  invited: boolean;
  responded: boolean;
};

type PortalSubmission = {
  supplier: string;
  status: "submitted" | "pending" | "late" | "withdrawn";
  timestamp: string;
  compliant: boolean;
  documents: number;
};

type BidComparison = {
  supplier: string;
  price: number;
  normalizedScore: number;
  technicalScore: number;
  totalScore: number;
  flags: string[];
  recommendation: "preferred" | "acceptable" | "review" | "reject";
};

type AwardData = {
  winner: string;
  contractValue: number;
  savings: number;
  savingsPercent: number;
  nextSteps: string[];
};

const mockSuppliers: SupplierMatch[] = [
  { name: "Apex Industrial Supply", category: "Office Equipment", score: 94, invited: true, responded: true },
  { name: "Premier Office Solutions", category: "Office Equipment", score: 89, invited: true, responded: true },
  { name: "GlobalTech Furnishings", category: "Office Equipment", score: 85, invited: true, responded: true },
  { name: "Prime Workspace Ltd", category: "Office Equipment", score: 82, invited: true, responded: false },
  { name: "Urban Office Direct", category: "Office Equipment", score: 78, invited: true, responded: true },
  { name: "Elite Interiors", category: "Office Equipment", score: 75, invited: true, responded: false },
];

const mockSubmissions: PortalSubmission[] = [
  { supplier: "Apex Industrial Supply", status: "submitted", timestamp: "2024-01-15 14:32", compliant: true, documents: 5 },
  { supplier: "Premier Office Solutions", status: "submitted", timestamp: "2024-01-15 16:45", compliant: true, documents: 5 },
  { supplier: "GlobalTech Furnishings", status: "submitted", timestamp: "2024-01-16 09:12", compliant: false, documents: 4 },
  { supplier: "Urban Office Direct", status: "submitted", timestamp: "2024-01-16 11:30", compliant: true, documents: 5 },
  { supplier: "Prime Workspace Ltd", status: "pending", timestamp: "-", compliant: false, documents: 0 },
  { supplier: "Elite Interiors", status: "late", timestamp: "2024-01-17 08:15", compliant: false, documents: 3 },
];

const mockBidMatrix: BidComparison[] = [
  { supplier: "Apex Industrial Supply", price: 485000, normalizedScore: 92, technicalScore: 94, totalScore: 93, flags: [], recommendation: "preferred" },
  { supplier: "Premier Office Solutions", price: 512000, normalizedScore: 87, technicalScore: 89, totalScore: 88, flags: [], recommendation: "acceptable" },
  { supplier: "Urban Office Direct", price: 468000, normalizedScore: 95, technicalScore: 76, totalScore: 84, flags: ["Missing warranty terms"], recommendation: "review" },
  { supplier: "GlobalTech Furnishings", price: 545000, normalizedScore: 82, technicalScore: 85, totalScore: 83, flags: ["Non-compliant submission"], recommendation: "reject" },
];

const mockAwardData: AwardData = {
  winner: "Apex Industrial Supply",
  contractValue: 485000,
  savings: 67000,
  savingsPercent: 12.1,
  nextSteps: [
    "Award letter sent to Apex Industrial Supply",
    "Regret notifications sent to 3 unsuccessful bidders",
    "Contract draft ready for legal review",
    "Project handoff scheduled for Monday"
  ]
};

const demoConversation: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content: "📋 **New Tender Requirement Detected**\n\nProject: Office Furniture Fitout - 200 Workstations\nBudget Estimate: $550,000\nDeadline: Q2 2024\n\nShall I generate an RFP for this requirement?",
    workflowStep: "rfq-generation"
  },
  {
    id: "2",
    role: "user",
    content: "Yes, create an RFP with standard evaluation criteria"
  },
  {
    id: "3",
    role: "assistant",
    content: "✅ **RFP Generated: RFP-2024-0127**\n\n**Tender Details:**\n- Type: Request for Proposal (RFP)\n- Items: 200 ergonomic workstations, 200 task chairs, 50 meeting pods\n- Evaluation: Price (40%), Technical (35%), Experience (15%), Sustainability (10%)\n- Deadline: January 16, 2024 at 5:00 PM\n\n**Documents Included:**\n- Technical specifications\n- Terms & conditions\n- Evaluation criteria matrix\n- Submission requirements\n\nReady to distribute to matched suppliers.",
    action: "RFP Generated",
    workflowStep: "rfq-generation"
  },
  {
    id: "4",
    role: "user",
    content: "Find and invite qualified suppliers"
  },
  {
    id: "5",
    role: "assistant",
    content: "🔍 **Supplier Matching Complete**\n\nI've identified **6 qualified suppliers** from the approved vendor database based on:\n- Category match: Office Equipment\n- Past performance rating ≥ 75%\n- Capacity for order size\n- Geographic coverage",
    action: "Suppliers Matched",
    workflowStep: "distribution",
    suppliers: mockSuppliers
  },
  {
    id: "6",
    role: "user",
    content: "Send invitations to all matched suppliers"
  },
  {
    id: "7",
    role: "assistant",
    content: "📧 **Tender Invitations Sent**\n\n✅ 6 suppliers invited via email\n✅ Portal access credentials generated\n✅ Document download links active\n\n**Tracking Status:**\n- 4 emails opened\n- 3 documents downloaded\n- 2 clarification questions received (auto-answered by AI)\n\nI'll monitor responses and send reminders 48 hours before deadline.",
    action: "Invitations Sent",
    workflowStep: "distribution"
  },
  {
    id: "8",
    role: "assistant",
    content: "📥 **Submission Deadline Passed**\n\nTender Portal Status: **CLOSED**\n\n**Submissions Received:**\n- ✅ 4 on-time submissions\n- ⚠️ 1 late submission (auto-rejected)\n- ❌ 1 no response\n\nLet me show you the portal activity summary.",
    workflowStep: "portal-submission",
    submissions: mockSubmissions
  },
  {
    id: "9",
    role: "user",
    content: "Evaluate the compliant bids"
  },
  {
    id: "10",
    role: "assistant",
    content: "📊 **Bid Evaluation Complete**\n\n**Evaluation Summary:**\n- 3 compliant submissions analyzed\n- 1 flagged for non-compliance (missing insurance cert)\n- Prices ranged from $468K to $545K\n\n**AI Recommendation:**\n🏆 **Apex Industrial Supply** scores highest overall (93/100)\n- Competitive pricing at $485K\n- Strong technical proposal\n- Excellent past performance\n- All compliance requirements met",
    action: "Evaluation Complete",
    workflowStep: "bid-comparison",
    bidMatrix: mockBidMatrix
  },
  {
    id: "11",
    role: "user",
    content: "Let's negotiate with Apex for better pricing"
  },
  {
    id: "12",
    role: "assistant",
    content: "💬 **Negotiation Draft Ready**\n\n**Counter-Offer for Apex Industrial Supply:**\n\n*Based on market analysis and competing bids, I suggest requesting:*\n\n1. **5% price reduction** on base items ($24,250 savings)\n2. **Extended warranty** from 3 to 5 years\n3. **Staged delivery** with 10% held until final inspection\n\n**Negotiation Talking Points:**\n- Urban Office Direct quoted $468K (lower but weaker technical score)\n- Volume discount justified for 200+ units\n- Long-term relationship potential for future projects\n\nShall I send this counter-offer to Apex?",
    action: "Counter-Offer Drafted",
    workflowStep: "negotiation"
  },
  {
    id: "13",
    role: "user",
    content: "They accepted. Proceed with award"
  },
  {
    id: "14",
    role: "assistant",
    content: "🏆 **Award Process Complete!**\n\n**Contract Awarded to: Apex Industrial Supply**\n\n**Final Terms:**\n- Contract Value: $460,750 (after 5% negotiation)\n- Warranty: 5 years extended\n- Delivery: Staged over 6 weeks\n\n**Total Savings Achieved: $89,250 (16.2%)**\n- vs. Budget: $550K → $461K\n- vs. Best alternative: $468K → $461K\n\n**Notifications Sent:**",
    action: "Award Complete",
    workflowStep: "award",
    awardData: { ...mockAwardData, contractValue: 460750, savings: 89250, savingsPercent: 16.2 }
  }
];

export default function TenderManagementDemo() {
  const { applySpeed } = useDemoSpeed();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"workflow" | "demo">("demo");
  const [viewMode, setViewMode] = useState<"buyer" | "supplier">("buyer");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const demoIndexRef = useRef(0);
  const isProcessingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef(false);
  const { setDemoActive } = useChatContext();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const updateCompletedSteps = useCallback((stepId: string) => {
    setCompletedSteps(prev => {
      if (!prev.includes(stepId)) {
        const stepIndex = workflowSteps.findIndex(s => s.id === stepId);
        const allPreviousSteps = workflowSteps.slice(0, stepIndex + 1).map(s => s.id);
        return [...new Set([...prev, ...allPreviousSteps])];
      }
      return prev;
    });
    setExpandedStep(stepId);
  }, []);

  const processNextMessage = useCallback(() => {
    // Guard against multiple simultaneous calls
    if (isProcessingRef.current) return;
    
    const currentIndex = demoIndexRef.current;
    if (currentIndex >= demoConversation.length) return;

    isProcessingRef.current = true;
    const nextMessage = demoConversation[currentIndex];

    if (nextMessage.role === "assistant") {
      setIsTyping(true);
      timerRef.current = setTimeout(() => {
        const messageId = `msg-${currentIndex}`;
        setMessages(prev => {
          // Prevent duplicate messages
          if (prev.some(m => m.id === messageId)) return prev;
          return [...prev, { ...nextMessage, id: messageId }];
        });
        setIsTyping(false);
        if (nextMessage.workflowStep) {
          updateCompletedSteps(nextMessage.workflowStep);
        }
        demoIndexRef.current += 1;
        isProcessingRef.current = false;

        // Check if next message is user (auto-advance)
        const nextIndex = demoIndexRef.current;
        if (nextIndex < demoConversation.length) {
          const delay = demoConversation[nextIndex].role === "user" ? 2000 : 3000;
          timerRef.current = setTimeout(() => processNextMessage(), applySpeed(delay));
        }
      }, applySpeed(1500));
    } else {
      // User message - add immediately
      const messageId = `msg-${currentIndex}`;
      setMessages(prev => {
        if (prev.some(m => m.id === messageId)) return prev;
        return [...prev, { ...nextMessage, id: messageId }];
      });
      demoIndexRef.current += 1;
      isProcessingRef.current = false;
      timerRef.current = setTimeout(() => processNextMessage(), applySpeed(1000));
    }
  }, [updateCompletedSteps]);

  // Start demo on mount
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    
    setDemoActive(true);
    timerRef.current = setTimeout(() => {
      processNextMessage();
    }, applySpeed(1000));
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setDemoActive(false);
    };
  }, [setDemoActive, processNextMessage]);

  useEffect(() => {
    const completedCount = completedSteps.length;
    setProgress((completedCount / workflowSteps.length) * 100);
  }, [completedSteps]);

  const handleContinue = useCallback(() => {
    processNextMessage();
  }, [processNextMessage]);

  const resetDemo = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessages([]);
    demoIndexRef.current = 0;
    isProcessingRef.current = false;
    setCompletedSteps([]);
    setExpandedStep(null);
    setProgress(0);
    setViewMode("buyer");
    setIsTyping(false);
    setTimeout(() => {
      processNextMessage();
    }, applySpeed(500));
  }, [processNextMessage]);

  const renderSupplierList = (suppliers: SupplierMatch[]) => (
    <div className="mt-3 space-y-2">
      {suppliers.map((supplier, i) => (
        <motion.div
          key={supplier.name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{supplier.name}</p>
              <p className="text-xs text-muted-foreground">{supplier.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{supplier.score}%</p>
              <p className="text-xs text-muted-foreground">Match</p>
            </div>
            {supplier.responded ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : supplier.invited ? (
              <Clock className="w-5 h-5 text-amber-500" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderPortalSubmissions = (submissions: PortalSubmission[]) => (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">Portal View:</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={viewMode === "buyer" ? "default" : "outline"}
            onClick={() => setViewMode("buyer")}
            className="text-xs"
          >
            <Eye className="w-3 h-3 mr-1" /> Buyer View
          </Button>
          <Button
            size="sm"
            variant={viewMode === "supplier" ? "default" : "outline"}
            onClick={() => setViewMode("supplier")}
            className="text-xs"
          >
            <Upload className="w-3 h-3 mr-1" /> Supplier View
          </Button>
        </div>
      </div>
      
      {viewMode === "buyer" ? (
        <div className="space-y-2">
          {submissions.map((sub, i) => (
            <motion.div
              key={sub.supplier}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  sub.status === "submitted" && sub.compliant ? "bg-green-500" :
                  sub.status === "submitted" && !sub.compliant ? "bg-amber-500" :
                  sub.status === "late" ? "bg-red-500" :
                  "bg-muted-foreground/30"
                )} />
                <div>
                  <p className="font-medium text-sm">{sub.supplier}</p>
                  <p className="text-xs text-muted-foreground">{sub.timestamp}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={
                  sub.status === "submitted" && sub.compliant ? "default" :
                  sub.status === "submitted" ? "secondary" :
                  sub.status === "late" ? "destructive" :
                  "outline"
                }>
                  {sub.status === "submitted" && sub.compliant ? "Compliant" :
                   sub.status === "submitted" ? "Non-Compliant" :
                   sub.status === "late" ? "Late - Rejected" :
                   "Pending"}
                </Badge>
                <span className="text-xs text-muted-foreground">{sub.documents} docs</span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-muted/20 rounded-lg border border-border p-4">
          <div className="text-center mb-4">
            <Globe className="w-8 h-8 mx-auto text-primary mb-2" />
            <h4 className="font-semibold">Tender Portal - Supplier View</h4>
            <p className="text-sm text-muted-foreground">RFP-2024-0127: Office Furniture Fitout</p>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-background rounded border border-border">
              <p className="text-sm font-medium mb-2">📋 Required Documents:</p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> Technical Proposal</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> Pricing Schedule</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> Company Profile</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> Insurance Certificate</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> References</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded border border-green-500/30">
              <span className="text-sm font-medium text-green-700">✅ Submission Complete</span>
              <span className="text-xs text-muted-foreground">Jan 15, 2024 14:32</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBidMatrix = (bids: BidComparison[]) => (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-2 font-medium">Supplier</th>
            <th className="text-right p-2 font-medium">Price</th>
            <th className="text-right p-2 font-medium">Technical</th>
            <th className="text-right p-2 font-medium">Total</th>
            <th className="text-center p-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {bids.map((bid, i) => (
            <motion.tr
              key={bid.supplier}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.15 }}
              className={cn(
                "border-b border-border",
                bid.recommendation === "preferred" && "bg-green-500/10"
              )}
            >
              <td className="p-2">
                <div className="flex items-center gap-2">
                  {bid.recommendation === "preferred" && <Award className="w-4 h-4 text-amber-500" />}
                  {bid.supplier}
                </div>
                {bid.flags.length > 0 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3 h-3" /> {bid.flags[0]}
                  </p>
                )}
              </td>
              <td className="text-right p-2 tabular-nums">${bid.price.toLocaleString()}</td>
              <td className="text-right p-2">{bid.technicalScore}/100</td>
              <td className="text-right p-2 font-semibold">{bid.totalScore}/100</td>
              <td className="text-center p-2">
                <Badge variant={
                  bid.recommendation === "preferred" ? "default" :
                  bid.recommendation === "acceptable" ? "secondary" :
                  bid.recommendation === "review" ? "outline" :
                  "destructive"
                }>
                  {bid.recommendation}
                </Badge>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAwardData = (data: AwardData) => (
    <div className="mt-3 space-y-3">
      <div className="flex items-center gap-4 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
        <Award className="w-10 h-10 text-amber-500" />
        <div>
          <p className="font-semibold text-lg">{data.winner}</p>
          <p className="text-sm text-muted-foreground">
            ${data.contractValue.toLocaleString()} • {data.savingsPercent}% savings
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Next Steps:</p>
        {data.nextSteps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            {step}
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Tender Management Demo
          </h2>
          <p className="text-sm text-muted-foreground">
            End-to-end RFQ/RFP lifecycle with AI-powered evaluation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <InlineDemoSpeedControl compact className="hidden sm:flex" />
          <Button variant="outline" size="sm" onClick={resetDemo} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Restart
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tender Progress</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          {workflowSteps.map((step) => (
            <span
              key={step.id}
              className={cn(
                "transition-colors",
                completedSteps.includes(step.id) && "text-primary font-medium"
              )}
            >
              {step.step}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "workflow" | "demo")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="demo" className="gap-2">
            <Play className="w-4 h-4" /> Live Demo
          </TabsTrigger>
          <TabsTrigger value="workflow" className="gap-2">
            <Zap className="w-4 h-4" /> Workflow Steps
          </TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="mt-4">
          {/* Chat Area */}
          <div className="bg-muted/20 rounded-lg border border-border min-h-[400px] max-h-[500px] overflow-y-auto p-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mb-4",
                    message.role === "user" && "text-right"
                  )}
                >
                  <div className={cn(
                    "inline-block max-w-[85%] p-3 rounded-lg",
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-card border border-border"
                  )}>
                    {message.action && (
                      <Badge className="mb-2" variant="secondary">
                        <Sparkles className="w-3 h-3 mr-1" />
                        {message.action}
                      </Badge>
                    )}
                    <DemoMarkdown content={message.content} />
                    {message.suppliers && renderSupplierList(message.suppliers)}
                    {message.submissions && renderPortalSubmissions(message.submissions)}
                    {message.bidMatrix && renderBidMatrix(message.bidMatrix)}
                    {message.awardData && renderAwardData(message.awardData)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <Bot className="w-5 h-5" />
                <span className="text-sm">Alfred is analyzing...</span>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Continue Button */}
          {demoIndexRef.current < demoConversation.length && !isTyping && demoConversation[demoIndexRef.current]?.role === "assistant" && (
            <Button onClick={handleContinue} className="w-full mt-3 gap-2">
              Continue Demo <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </TabsContent>

        <TabsContent value="workflow" className="mt-4">
          <div className="grid gap-3">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "p-4 rounded-lg border transition-all cursor-pointer",
                  completedSteps.includes(step.id)
                    ? "bg-primary/5 border-primary/30"
                    : "bg-muted/20 border-border hover:bg-muted/40",
                  expandedStep === step.id && "ring-2 ring-primary"
                )}
                onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    completedSteps.includes(step.id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {completedSteps.includes(step.id) ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Step {step.step}</span>
                      {step.savings && (
                        <Badge variant="secondary" className="text-xs">{step.savings}</Badge>
                      )}
                    </div>
                    <h4 className="font-medium">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  <ChevronRight className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform",
                    expandedStep === step.id && "rotate-90"
                  )} />
                </div>
                
                <AnimatePresence>
                  {expandedStep === step.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-border">
                        <ul className="space-y-1">
                          {step.details.map((detail, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <ArrowRight className="w-3 h-3" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary Stats */}
      {completedSteps.includes("award") && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20"
        >
          <div className="text-center">
            <p className="text-2xl font-bold text-primary tabular-nums">6</p>
            <p className="text-xs text-muted-foreground">Suppliers Invited</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary tabular-nums">4</p>
            <p className="text-xs text-muted-foreground">Compliant Bids</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-status-ontrack tabular-nums">16.2%</p>
            <p className="text-xs text-muted-foreground">Total Savings</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
