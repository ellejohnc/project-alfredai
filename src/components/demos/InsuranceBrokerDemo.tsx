import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import {
  TrendingUp,
  ShieldCheck,
  Scale,
  BarChart3,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageSquare,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  Building2,
  FileWarning,
  UserCheck,
  Award,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Zap,
  ChevronUp,
  AlertTriangle,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DemoMarkdown } from "./DemoMarkdown";
import { useChatContext } from "@/contexts/ChatContext";

type ModuleId = "revenue" | "cost" | "claims" | "compliance" | "intelligence";

type DemoMessage = {
  role: "user" | "assistant";
  content: string;
  data?: any;
  action?: string;
};

type ModuleData = {
  id: ModuleId;
  title: string;
  shortTitle: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  accentColor: string;
  bgGlow: string;
  messages: DemoMessage[];
};

const MODULES: ModuleData[] = [
  {
    id: "revenue",
    title: "Revenue Acceleration",
    shortTitle: "Revenue",
    subtitle: "Front Office AI",
    icon: TrendingUp,
    gradient: "from-emerald-500 to-teal-600",
    accentColor: "emerald",
    bgGlow: "bg-emerald-500/10",
    messages: [
      {
        role: "user",
        content: "New inbound lead just came in from the website form."
      },
      {
        role: "assistant",
        content: "📊 **Lead Qualified & Scored**\n\n**Company:** Lakewood Commercial Group\n**Industry:** Retail/Commercial Property\n**Est. Premium:** $850,000\n**Risk Complexity:** High (multi-site portfolio)\n**Bind Likelihood:** 87%\n\n**AI Score: 94/100** — Routing to Senior Broker immediately.",
        data: {
          type: "lead_score",
          score: 94,
          factors: [
            { label: "Premium Size", value: 92 },
            { label: "Risk Profile Match", value: 88 },
            { label: "Bind Probability", value: 87 },
            { label: "Strategic Fit", value: 96 }
          ]
        },
        action: "lead_qualified"
      },
      {
        role: "user",
        content: "Compare policy options for this client."
      },
      {
        role: "assistant",
        content: "📋 **Policy Comparison Complete**\n\nCompared 4 insurers for Commercial Property Portfolio:\n\n**Insurer A (Prime Insurance):** Best price at $780K but **excludes flood** in 3 locations\n\n**Insurer B (National Insurance):** Comprehensive at $920K, includes business interruption extension\n\n**Insurer C (Global Insurance):** Gap in **terrorism coverage** for CBD properties\n\n**Recommendation:** National Insurance with negotiated terms — similar clients achieved 12% premium reduction.",
        data: {
          type: "policy_compare",
          insurers: [
            { name: "Prime Insurance", premium: 780000, flag: "Flood exclusion", risk: "high" },
            { name: "National Insurance", premium: 920000, flag: "Recommended", risk: "low" },
            { name: "Global Insurance", premium: 860000, flag: "Terrorism gap", risk: "medium" },
            { name: "Secure Insurance", premium: 890000, flag: "Higher excess", risk: "medium" }
          ]
        },
        action: "comparison_complete"
      },
      {
        role: "user",
        content: "What cross-sell opportunities exist?"
      },
      {
        role: "assistant",
        content: "💡 **Cross-Sell Intelligence**\n\nBased on portfolio analysis & peer benchmarks:\n\n✅ **Cyber Liability** — 78% of similar portfolios have this. Client has none.\n\n✅ **Directors & Officers** — New board members appointed last quarter.\n\n✅ **Management Liability Extension** — Regulatory exposure increasing in retail sector.\n\n**Estimated Additional Premium:** $145,000\n**Your Commission:** +$21,750",
        action: "crosssell_identified"
      }
    ]
  },
  {
    id: "cost",
    title: "Cost & Margin Protection",
    shortTitle: "Costs",
    subtitle: "Middle Office AI",
    icon: ShieldCheck,
    gradient: "from-blue-500 to-indigo-600",
    accentColor: "blue",
    bgGlow: "bg-blue-500/10",
    messages: [
      {
        role: "user",
        content: "Generate renewal pack for the Henderson account."
      },
      {
        role: "assistant",
        content: "📄 **Renewal Pack Generated**\n\nAuto-generated documents:\n\n• Policy Schedule (12 pages)\n• Certificate of Currency\n• Endorsement Summary (3 amendments)\n• Premium Comparison vs Last Year\n• Claims History Summary\n\n**Time Saved:** 2.5 hours\n**Status:** Ready for broker review",
        data: {
          type: "documents",
          docs: [
            { name: "Policy Schedule", pages: 12, status: "complete" },
            { name: "Certificate of Currency", pages: 1, status: "complete" },
            { name: "Endorsement Summary", pages: 3, status: "complete" },
            { name: "Premium Comparison", pages: 2, status: "complete" },
            { name: "Claims History", pages: 4, status: "complete" }
          ]
        },
        action: "docs_generated"
      },
      {
        role: "user",
        content: "New claim just came in. Triage it."
      },
      {
        role: "assistant",
        content: "🚨 **Claim Triaged**\n\n**Claimant:** ABC Manufacturing\n**Type:** Water Damage — Burst Pipe\n**Severity:** Medium\n**Est. Value:** $125,000\n**Fraud Score:** 3/100 (Low Risk)\n\n**AI Actions:**\n• Auto-generated claim summary\n• Assigned to Claims Handler: Sarah M.\n• Loss adjuster appointment scheduled\n• Client notification drafted\n\n**Next Steps Ready:** View summary →",
        data: {
          type: "claim_triage",
          severity: "medium",
          fraudScore: 3,
          estimatedValue: 125000
        },
        action: "claim_triaged"
      },
      {
        role: "user",
        content: "Summarize today's insurer emails."
      },
      {
        role: "assistant",
        content: "📧 **Email Co-Pilot Summary**\n\nProcessed 47 insurer emails today:\n\n**Urgent (3):**\n• Prime Insurance: Premium endorsement required by EOD\n• National Insurance: Missing motor schedule for fleet\n• Secure Insurance: Claim update requested\n\n**Action Required (12):**\n• 5 renewal confirmations needed\n• 4 quote requests pending\n• 3 document requests\n\n**Informational (32):**\n• Auto-filed and indexed\n\n**Draft Replies Ready:** 3 urgent responses drafted",
        action: "emails_summarized"
      }
    ]
  },
  {
    id: "claims",
    title: "Claims Intelligence",
    shortTitle: "Claims",
    subtitle: "AI Claims Hub",
    icon: FileWarning,
    gradient: "from-rose-500 to-pink-500",
    accentColor: "rose",
    bgGlow: "bg-rose-500/10",
    messages: [
      {
        role: "user",
        content: "Analyze the incoming claim for fraud risk."
      },
      {
        role: "assistant",
        content: "🔍 **Fraud Detection Analysis Complete**\n\n**Claim:** Fire Damage — Industrial Warehouse\n**Claimant:** Nexus Industrial Pty Ltd\n**Claimed Amount:** $2.4M\n\n**Fraud Risk Score: 67/100 (Elevated)**\n\n**Risk Indicators Detected:**\n• Recent policy increase (+40% cover 60 days ago)\n• After-hours incident (reported 2:47am)\n• Similar claim pattern to flagged network\n• Financial distress indicators on company\n\n**Recommendation:** Escalate to Special Investigations Unit",
        data: {
          type: "fraud_detection",
          overallScore: 67,
          riskLevel: "elevated",
          indicators: [
            { label: "Policy Timing", score: 82, flag: "Recent increase" },
            { label: "Incident Pattern", score: 71, flag: "After-hours" },
            { label: "Network Analysis", score: 65, flag: "Pattern match" },
            { label: "Financial Signals", score: 58, flag: "Distress" },
            { label: "Documentation", score: 45, flag: "Incomplete" },
            { label: "Witness Consistency", score: 38, flag: "Pending" }
          ]
        },
        action: "fraud_analyzed"
      },
      {
        role: "user",
        content: "Assess severity and generate claim summary."
      },
      {
        role: "assistant",
        content: "📊 **Severity Assessment Complete**\n\n**Severity Level: HIGH**\n\n**Assessment Breakdown:**\n• Property Damage: Extensive (80% structure)\n• Business Interruption: 6-8 weeks estimated\n• Third-Party Impact: 2 neighboring businesses\n• Environmental: Hazmat assessment required\n\n**AI-Generated Claim Summary:**\n\n*\"Industrial fire at 45 Commerce Way caused extensive structural damage to main warehouse facility. Initial inspection indicates origin point in electrical room B. Business operations suspended. Adjacent properties report smoke damage. Hazardous materials team dispatched. Reserve recommendation: $2.1M pending full assessment.\"*\n\n**Auto-Generated Documents:**\n• Initial Loss Report\n• Reserve Recommendation\n• Stakeholder Notification Pack",
        data: {
          type: "severity_assessment",
          level: "high",
          components: [
            { category: "Property Damage", score: 85, status: "critical" },
            { category: "Business Interruption", score: 72, status: "high" },
            { category: "Third-Party Liability", score: 45, status: "medium" },
            { category: "Environmental", score: 60, status: "high" },
            { category: "Regulatory", score: 35, status: "low" }
          ],
          reserve: 2100000,
          timeline: "6-8 weeks"
        },
        action: "severity_assessed"
      },
      {
        role: "user",
        content: "Route claim to appropriate stakeholders."
      },
      {
        role: "assistant",
        content: "🎯 **Stakeholder Routing Complete**\n\n**Primary Handlers Assigned:**\n\n👤 **Sarah Mitchell** — Senior Claims Manager\n   • Lead handler for $2M+ claims\n   • Notified via SMS + Email\n\n👤 **James Wong** — SIU Investigator  \n   • Fraud score >60 auto-escalation\n   • Investigation file created\n\n👤 **Dr. Lisa Park** — Loss Adjuster\n   • Site inspection scheduled: Tomorrow 9am\n   • Access credentials issued\n\n**Notifications Sent:**\n✅ Insurer (Prime Insurance) — Claim lodged\n✅ Reinsurer — Large loss notification\n✅ Client — Acknowledgment + next steps\n✅ Legal — Watching brief initiated\n\n**Workflow Status:** All stakeholders engaged",
        data: {
          type: "stakeholder_routing",
          stakeholders: [
            { name: "Sarah Mitchell", role: "Senior Claims Manager", status: "assigned", priority: "primary" },
            { name: "James Wong", role: "SIU Investigator", status: "assigned", priority: "primary" },
            { name: "Dr. Lisa Park", role: "Loss Adjuster", status: "scheduled", priority: "primary" },
            { name: "Prime Insurance Claims", role: "Insurer", status: "notified", priority: "secondary" },
            { name: "SwissRe", role: "Reinsurer", status: "notified", priority: "secondary" },
            { name: "Legal Team", role: "Watching Brief", status: "notified", priority: "secondary" }
          ]
        },
        action: "stakeholders_routed"
      }
    ]
  },
  {
    id: "compliance",
    title: "Risk & Compliance",
    shortTitle: "Compliance",
    subtitle: "Governance AI",
    icon: Scale,
    gradient: "from-amber-500 to-orange-600",
    accentColor: "amber",
    bgGlow: "bg-amber-500/10",
    messages: [
      {
        role: "user",
        content: "Run compliance scan on recent broker communications."
      },
      {
        role: "assistant",
        content: "🔍 **Compliance Scan Complete**\n\nScanned 234 communications this week:\n\n**⚠️ Alert Found:**\n\nEmail from broker@company.com (Tuesday 2:34pm)\n\n**Issue:** Missing disclosure of commission arrangement\n**Regulatory Reference:** ASIC RG 175.34\n**Risk Level:** High\n\n**Suggested Amendment:**\n*\"Please note: [Broker Name] receives commission from the insurer for arranging this policy...\"*\n\n✅ 231 communications compliant\n⚠️ 3 require amendments",
        data: {
          type: "compliance_scan",
          scanned: 234,
          compliant: 231,
          issues: 3
        },
        action: "compliance_scanned"
      },
      {
        role: "user",
        content: "I need to understand our standard professional indemnity wording."
      },
      {
        role: "assistant",
        content: "🧠 **Knowledge Base Result**\n\n**Query:** Professional Indemnity Standard Wording\n\n**Key Points:**\n• Retroactive date must not be altered without approval\n• Discovery period: 90 days post-expiry\n• Minimum limit: $2M for commercial clients\n• Run-off coverage required for ceased practices\n\n**Related Precedents:**\n• Johnson & Co claim (2022) — Retroactive date issue\n• Smith Holdings dispute — Discovery period interpretation\n\n**Source:** Internal Policy Manual v4.2, AFSL Requirements Doc",
        action: "knowledge_retrieved"
      },
      {
        role: "user",
        content: "New hire starting Monday. Prepare onboarding materials."
      },
      {
        role: "assistant",
        content: "📚 **Onboarding Pack Generated**\n\n**New Hire:** Jessica Chen — Commercial Broker\n\n**Personalized Learning Path:**\n\n1. **Week 1:** Core compliance training (AFSL obligations)\n2. **Week 2:** Product knowledge (Commercial Property, Liability)\n3. **Week 3:** Systems training (Broker Platform, Claims)\n4. **Week 4:** Client handling & advice protocols\n\n**Materials Ready:**\n• Policy templates library access\n• Precedent clause database\n• Insurer contact matrix\n• Compliance checklist\n\n**Estimated Ramp Time:** 40% faster than average",
        action: "onboarding_ready"
      }
    ]
  },
  {
    id: "intelligence",
    title: "Strategic Intelligence",
    shortTitle: "Intel",
    subtitle: "Executive Edge",
    icon: BarChart3,
    gradient: "from-violet-500 to-purple-600",
    accentColor: "violet",
    bgGlow: "bg-violet-500/10",
    messages: [
      {
        role: "user",
        content: "Which insurers are slowing us down?"
      },
      {
        role: "assistant",
        content: "📊 **Carrier Performance Analysis**\n\n**Slowest Response Times:**\n\n1. **Secure Insurance** — Avg 8.2 days (vs industry 4.1)\n2. **Vero** — Avg 6.5 days\n3. **Prime Insurance Commercial** — Avg 5.8 days\n\n**Impact on Revenue:**\n• 12 deals delayed past quarter\n• Est. $340K premium at risk\n• 3 clients expressed frustration\n\n**Recommendation:** Schedule relationship meeting with Secure Insurance. Consider backup markets for time-sensitive risks.",
        data: {
          type: "carrier_performance",
          carriers: [
            { name: "Secure Insurance", days: 8.2, benchmark: 4.1, status: "poor" },
            { name: "Vero", days: 6.5, benchmark: 4.1, status: "below" },
            { name: "Prime Insurance", days: 5.8, benchmark: 4.1, status: "below" },
            { name: "National Insurance", days: 3.2, benchmark: 4.1, status: "good" }
          ]
        },
        action: "carrier_analyzed"
      },
      {
        role: "user",
        content: "Where are margins leaking?"
      },
      {
        role: "assistant",
        content: "💰 **Margin Leakage Analysis**\n\n**Top Leakage Points:**\n\n1. **Small Commercial (<$5K premium):** 23% of volume, 8% of profit\n   — Recommendation: Automate or decline\n\n2. **Claims Handling Delays:** Avg 4.2 extra hours per claim\n   — Recommendation: AI triage implementation\n\n3. **Renewal Admin:** 6.5 hours per renewal (industry avg 4.2)\n   — Recommendation: Automation in progress\n\n**Potential Savings:** $1.2M annually\n**Implementation Priority:** Claims Handling (highest ROI)",
        action: "margin_analyzed"
      },
      {
        role: "user",
        content: "Predict renewal risks for next quarter."
      },
      {
        role: "assistant",
        content: "🎯 **Renewal Risk Prediction**\n\n**High Churn Risk (Action Required):**\n\n1. **Westgate Holdings** — 78% churn probability\n   — Premium sensitivity + 2 service complaints\n   — Recommended: Proactive call this week\n\n2. **Northern Mining Co** — 65% churn probability\n   — Claims frequency up 40%\n   — Recommended: Risk review meeting\n\n3. **Metro Retail Group** — 61% churn probability\n   — Competitor quote received\n   — Recommended: Retention offer\n\n**At-Risk Premium:** $2.1M\n**Intervention Success Rate:** 73% (historical)",
        data: {
          type: "churn_prediction",
          accounts: [
            { name: "Westgate Holdings", risk: 78, premium: 450000 },
            { name: "Northern Mining", risk: 65, premium: 890000 },
            { name: "Metro Retail", risk: 61, premium: 760000 }
          ]
        },
        action: "renewals_predicted"
      }
    ]
  }
];

const STATS = {
  revenueImpact: { value: 0, target: 23, label: "Revenue", suffix: "%" },
  timeSaved: { value: 0, target: 65, label: "Time Saved", suffix: "%" },
  complianceScore: { value: 0, target: 98.5, label: "Compliance", suffix: "%" },
  riskReduction: { value: 0, target: 40, label: "Claims", suffix: "% ↓" }
};

export default function InsuranceBrokerDemo() {
  const [activeModule, setActiveModule] = useState<ModuleId>("revenue");
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState(STATS);
  const [completedModules, setCompletedModules] = useState<Set<ModuleId>>(new Set());
  const [showGuide, setShowGuide] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [hasError, setHasError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modulesScrollRef = useRef<HTMLDivElement>(null);
  const { setDemoActive } = useChatContext();

  // Scroll arrows for module tabs
  const scrollModules = (direction: "left" | "right") => {
    if (modulesScrollRef.current) {
      const scrollAmount = 120;
      modulesScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Track demo active state
  const isDemoRunning = messages.length > 0;
  
  useEffect(() => {
    setDemoActive(isDemoRunning);
    return () => setDemoActive(false);
  }, [isDemoRunning, setDemoActive]);

  const currentModule = MODULES.find(m => m.id === activeModule)!;
  const moduleIds = MODULES.map(m => m.id);

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeNavigation({
    items: moduleIds,
    activeItem: activeModule,
    onNavigate: setActiveModule,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset when module changes
  useEffect(() => {
    setMessages([]);
    setMessageIndex(0);
    setIsTyping(false);
  }, [activeModule]);

  // Update stats based on actions
  const updateStats = (action?: string) => {
    if (action === "lead_qualified" || action === "crosssell_identified") {
      setStats(prev => ({
        ...prev,
        revenueImpact: { ...prev.revenueImpact, value: Math.min(prev.revenueImpact.value + 8, 23) }
      }));
    }
    if (action === "docs_generated" || action === "emails_summarized" || action === "claim_triaged") {
      setStats(prev => ({
        ...prev,
        timeSaved: { ...prev.timeSaved, value: Math.min(prev.timeSaved.value + 15, 65) }
      }));
    }
    if (action === "compliance_scanned" || action === "knowledge_retrieved") {
      setStats(prev => ({
        ...prev,
        complianceScore: { ...prev.complianceScore, value: Math.min(prev.complianceScore.value + 25, 98.5) }
      }));
    }
    if (action === "claim_triaged" || action === "margin_analyzed" || action === "fraud_analyzed" || action === "severity_assessed" || action === "stakeholders_routed") {
      setStats(prev => ({
        ...prev,
        riskReduction: { ...prev.riskReduction, value: Math.min(prev.riskReduction.value + 10, 40) }
      }));
    }
    if (action === "fraud_analyzed" || action === "severity_assessed") {
      setStats(prev => ({
        ...prev,
        timeSaved: { ...prev.timeSaved, value: Math.min(prev.timeSaved.value + 12, 65) }
      }));
    }
  };

  const advanceDemo = () => {
    if (isTyping || isPaused) return;
    setShowGuide(false);
    
    const moduleMessages = currentModule.messages;
    if (messageIndex >= moduleMessages.length) return;

    const nextMessage = moduleMessages[messageIndex];
    
    if (nextMessage.role === "user") {
      setMessages(prev => [...prev, nextMessage]);
      setMessageIndex(prev => prev + 1);
      setIsTyping(true);

      setTimeout(() => {
        const assistantMessage = moduleMessages[messageIndex + 1];
        if (assistantMessage && assistantMessage.role === "assistant") {
          setMessages(prev => [...prev, assistantMessage]);
          setMessageIndex(prev => prev + 1);
          updateStats(assistantMessage.action);
        }
        setIsTyping(false);

        // Mark module complete
        if (messageIndex + 2 >= moduleMessages.length) {
          setCompletedModules(prev => new Set([...prev, activeModule]));
        }
      }, 1800);
    }
  };

  const resetDemo = () => {
    setMessages([]);
    setMessageIndex(0);
    setIsTyping(false);
    setIsPaused(false);
    setStats(STATS);
    setCompletedModules(new Set());
    setActiveModule("revenue");
    setShowGuide(true);
    setHasError(false);
  };

  const getNextPrompt = () => {
    const moduleMessages = currentModule.messages;
    if (messageIndex < moduleMessages.length) {
      const next = moduleMessages[messageIndex];
      if (next.role === "user") return next.content;
    }
    return "";
  };

  const isModuleComplete = messageIndex >= currentModule.messages.length;

  // Error fallback
  if (hasError) {
    return (
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-xl sm:rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden min-h-[300px] sm:min-h-[400px] flex flex-col items-center justify-center p-4 sm:p-6 text-center">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-amber-500/20 flex items-center justify-center mb-3 sm:mb-4">
          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 sm:mb-2">Demo temporarily unavailable</h3>
        <p className="text-xs sm:text-sm text-slate-300/80 mb-3 sm:mb-4 max-w-xs sm:max-w-sm px-2">
          Something went wrong loading this demo. Please try again or contact support.
        </p>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            onClick={resetDemo}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-200 hover:bg-slate-800 h-8 sm:h-9 text-xs sm:text-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Retry
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white h-8 sm:h-9 text-xs sm:text-sm"
          >
            <a href={`mailto:support@alfredai.bot?subject=Demo Error&body=Page: ${window.location.href}`}>
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Report Issue
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden min-h-[400px] sm:min-h-[480px] max-h-[85vh] flex flex-col relative">
      {/* Ambient glow effect */}
      <div className={cn(
        "absolute inset-0 opacity-20 pointer-events-none transition-all duration-700",
        currentModule.bgGlow
      )} />
      
      {/* Compact Header */}
      <div className="relative px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/90 via-slate-800/70 to-slate-800/90 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className={cn(
              "w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0",
              currentModule.gradient
            )}>
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-xs sm:text-sm md:text-base tracking-tight truncate">Insurance Broker AI</h3>
              <p className="text-[9px] sm:text-[10px] text-slate-300/70 font-medium hidden sm:block">EBITDA-Moving AI Infrastructure</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {/* Stats Toggle */}
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-6 w-6 sm:h-7 sm:w-7 p-0 transition-colors",
                showStats ? "text-emerald-400 bg-emerald-500/10" : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              )}
              onClick={() => setShowStats(!showStats)}
              title="Toggle stats"
            >
              <BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-300 hover:text-white hover:bg-slate-700/50 h-6 w-6 sm:h-7 sm:w-7 p-0"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-300 hover:text-white hover:bg-slate-700/50 h-6 w-6 sm:h-7 sm:w-7 p-0"
              onClick={resetDemo}
            >
              <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Button>
          </div>
        </div>

        {/* Collapsible Stats Dashboard */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-4 gap-1 sm:gap-1.5 mt-2 pt-2 border-t border-slate-700/50">
                {Object.entries(stats).map(([key, stat]) => {
                  const colors = {
                    revenueImpact: { text: "text-emerald-300", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
                    timeSaved: { text: "text-blue-300", bg: "bg-blue-500/15", border: "border-blue-500/30" },
                    complianceScore: { text: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/30" },
                    riskReduction: { text: "text-violet-300", bg: "bg-violet-500/15", border: "border-violet-500/30" }
                  };
                  const color = colors[key as keyof typeof colors];
                  
                  return (
                    <motion.div 
                      key={key} 
                      className={cn(
                        "text-center p-1 sm:p-1.5 rounded-lg border transition-all duration-300",
                        color.bg,
                        color.border
                      )}
                      animate={{ 
                        scale: stat.value > 0 ? [1, 1.02, 1] : 1,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className={cn("font-bold text-xs sm:text-sm tabular-nums", color.text)}>
                        {stat.value.toFixed(key === "complianceScore" ? 1 : 0)}{stat.suffix}
                      </p>
                      <p className="text-[7px] sm:text-[8px] text-slate-300/80 font-medium truncate">{stat.label}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Compact Module Tabs */}
      <div className="relative px-1.5 sm:px-2 py-1.5 sm:py-2 border-b border-slate-700/50 bg-slate-800/40 group">
        {/* Left Arrow */}
        <button
          onClick={() => scrollModules("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-5 h-5 flex items-center justify-center bg-slate-800/95 border border-slate-600/50 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-700"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-3 h-3 text-slate-200" />
        </button>

        <div 
          ref={modulesScrollRef}
          className="flex gap-0.5 sm:gap-1 min-w-max overflow-x-auto scrollbar-hide px-4 sm:px-3"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {MODULES.map((module) => {
            const Icon = module.icon;
            const isActive = activeModule === module.id;
            const isComplete = completedModules.has(module.id);
            
            return (
              <motion.button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={cn(
                  "relative flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium transition-all duration-200 whitespace-nowrap",
                  isActive 
                    ? "text-white shadow-md" 
                    : "text-slate-300/80 hover:text-white hover:bg-slate-700/40"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={cn("absolute inset-0 rounded-md sm:rounded-lg bg-gradient-to-r", module.gradient)}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative flex items-center gap-0.5 sm:gap-1">
                  <Icon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">{module.shortTitle}</span>
                  <span className="sm:hidden text-[9px]">{module.shortTitle.slice(0, 4)}</span>
                  {isComplete && (
                    <CheckCircle2 className="w-2 h-2 sm:w-3 sm:h-3 text-emerald-300" />
                  )}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scrollModules("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-5 h-5 flex items-center justify-center bg-slate-800/95 border border-slate-600/50 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-700"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-3 h-3 text-slate-200" />
        </button>

        {/* Progress indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-700/50">
          <motion.div
            className={cn("h-full bg-gradient-to-r", currentModule.gradient)}
            initial={{ width: 0 }}
            animate={{ width: `${(messageIndex / currentModule.messages.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Messages Area - Maximized */}
      <div 
        className="flex-1 overflow-y-auto p-2.5 sm:p-4 space-y-2 sm:space-y-3"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Compact Welcome Guide */}
        <AnimatePresence>
          {showGuide && messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center py-3 sm:py-4 text-center"
            >
              <div className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br flex items-center justify-center mb-2 sm:mb-3 shadow-lg",
                currentModule.gradient
              )}>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h4 className="text-sm sm:text-base font-semibold text-white mb-0.5 sm:mb-1">
                {currentModule.title}
              </h4>
              <p className="text-[10px] sm:text-xs text-slate-300/80 max-w-[260px] sm:max-w-[280px] leading-relaxed px-2">
                Click the prompt below to see AI-powered {currentModule.subtitle.toLowerCase()} in action
              </p>
              <motion.div
                animate={{ y: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="mt-2 sm:mt-3"
              >
                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={`${activeModule}-${index}`}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "user" ? (
                <div className={cn(
                  "rounded-xl sm:rounded-2xl rounded-br-sm px-2.5 sm:px-3 py-2 sm:py-2.5 max-w-[90%] sm:max-w-[80%] shadow-lg",
                  "bg-gradient-to-r",
                  currentModule.gradient
                )}>
                  <p className="text-[11px] sm:text-sm text-white font-medium leading-snug">{message.content}</p>
                </div>
              ) : (
                <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-xl sm:rounded-2xl rounded-bl-sm px-2.5 sm:px-3 py-2.5 sm:py-3 max-w-[98%] sm:max-w-[90%] shadow-lg">
                  {/* Compact AI Avatar */}
                  <div className="flex items-center gap-1.5 mb-1.5 sm:mb-2 pb-1 sm:pb-1.5 border-b border-slate-700/50">
                    <div className={cn(
                      "w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md bg-gradient-to-br flex items-center justify-center",
                      currentModule.gradient
                    )}>
                      <Zap className="w-2 h-2 text-white" />
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-semibold text-slate-300/80 uppercase tracking-wide">alfred ai</span>
                  </div>
                  
                  <DemoMarkdown content={message.content} lightText={true} className="text-[11px] sm:text-[13px] leading-relaxed" />
                  
                  {/* Enhanced Data Visualizations - More Compact */}
                  {message.data?.type === "lead_score" && (
                    <div className="mt-3 p-3 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl border border-slate-600/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">AI Lead Score</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-2xl font-bold text-emerald-400 tabular-nums">{message.data.score}</span>
                          <span className="text-xs text-slate-500">/100</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {message.data.factors.map((factor: any, i: number) => (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px] text-slate-400">{factor.label}</span>
                              <span className="text-[10px] font-semibold text-slate-300">{factor.value}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${factor.value}%` }}
                                transition={{ duration: 0.6, delay: i * 0.1 }}
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Policy Comparison - More Compact */}
                  {message.data?.type === "policy_compare" && (
                    <div className="mt-3 space-y-1.5">
                      {message.data.insurers.map((insurer: any, i: number) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className={cn(
                            "p-2.5 rounded-lg border flex items-center justify-between transition-all",
                            insurer.risk === "low" 
                              ? "bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border-emerald-500/30" 
                              : insurer.risk === "high"
                              ? "bg-gradient-to-r from-red-500/10 to-red-500/5 border-red-500/30"
                              : "bg-slate-700/30 border-slate-600/50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold",
                              insurer.risk === "low" && "bg-emerald-500/20 text-emerald-400",
                              insurer.risk === "high" && "bg-red-500/20 text-red-400",
                              insurer.risk === "medium" && "bg-amber-500/20 text-amber-400"
                            )}>
                              {insurer.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-white">{insurer.name}</p>
                              <p className="text-[10px] text-slate-400">${(insurer.premium / 1000).toFixed(0)}K premium</p>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[9px] h-5 px-1.5 border",
                              insurer.risk === "low" && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                              insurer.risk === "high" && "bg-red-500/20 text-red-400 border-red-500/30",
                              insurer.risk === "medium" && "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            )}
                          >
                            {insurer.flag}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Document List - Compact */}
                  {message.data?.type === "documents" && (
                    <div className="mt-3 space-y-1">
                      {message.data.docs.map((doc: any, i: number) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="flex items-center gap-2 text-[11px] bg-slate-700/30 px-2.5 py-1.5 rounded-lg border border-slate-600/30 hover:bg-slate-700/50 transition-colors"
                        >
                          <FileText className="w-3 h-3 text-blue-400 shrink-0" />
                          <span className="flex-1 text-slate-200 font-medium truncate">{doc.name}</span>
                          <span className="text-slate-500 text-[10px]">{doc.pages}p</span>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Compliance Scan - Compact */}
                  {message.data?.type === "compliance_scan" && (
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      <div className="p-2 bg-slate-700/40 rounded-lg text-center border border-slate-600/30">
                        <p className="text-base font-bold text-white">{message.data.scanned}</p>
                        <p className="text-[9px] text-slate-400 font-medium">Scanned</p>
                      </div>
                      <div className="p-2 bg-emerald-500/10 rounded-lg text-center border border-emerald-500/30">
                        <p className="text-base font-bold text-emerald-400">{message.data.compliant}</p>
                        <p className="text-[9px] text-slate-400 font-medium">Compliant</p>
                      </div>
                      <div className="p-2 bg-amber-500/10 rounded-lg text-center border border-amber-500/30">
                        <p className="text-base font-bold text-amber-400">{message.data.issues}</p>
                        <p className="text-[9px] text-slate-400 font-medium">Issues</p>
                      </div>
                    </div>
                  )}

                  {/* Carrier Performance - Compact */}
                  {message.data?.type === "carrier_performance" && (
                    <div className="mt-3 space-y-2">
                      {message.data.carriers.map((carrier: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-12 text-[11px] text-white font-medium">{carrier.name}</span>
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((carrier.days / 10) * 100, 100)}%` }}
                              transition={{ duration: 0.5, delay: i * 0.1 }}
                              className={cn(
                                "h-full rounded-full",
                                carrier.status === "good" && "bg-gradient-to-r from-emerald-500 to-emerald-400",
                                carrier.status === "below" && "bg-gradient-to-r from-amber-500 to-amber-400",
                                carrier.status === "poor" && "bg-gradient-to-r from-red-500 to-red-400"
                              )}
                            />
                          </div>
                          <span className={cn(
                            "w-12 text-[10px] text-right font-semibold",
                            carrier.status === "good" && "text-emerald-400",
                            carrier.status === "below" && "text-amber-400",
                            carrier.status === "poor" && "text-red-400"
                          )}>
                            {carrier.days}d
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Churn Prediction - Compact */}
                  {message.data?.type === "churn_prediction" && (
                    <div className="mt-3 space-y-1.5">
                      {message.data.accounts.map((account: any, i: number) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-2.5 bg-gradient-to-r from-red-500/10 to-red-500/5 rounded-lg border border-red-500/20"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">{account.name}</span>
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[9px] font-semibold h-5">
                              {account.risk}% risk
                            </Badge>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            ${(account.premium / 1000).toFixed(0)}K at risk
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Claim Triage - Compact */}
                  {message.data?.type === "claim_triage" && (
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      <div className="p-2 bg-amber-500/10 rounded-lg text-center border border-amber-500/30">
                        <p className="text-xs font-bold text-amber-400 capitalize">{message.data.severity}</p>
                        <p className="text-[9px] text-slate-400 font-medium">Severity</p>
                      </div>
                      <div className="p-2 bg-emerald-500/10 rounded-lg text-center border border-emerald-500/30">
                        <p className="text-xs font-bold text-emerald-400">{message.data.fraudScore}/100</p>
                        <p className="text-[9px] text-slate-400 font-medium">Fraud</p>
                      </div>
                      <div className="p-2 bg-slate-700/40 rounded-lg text-center border border-slate-600/30">
                        <p className="text-xs font-bold text-white">${(message.data.estimatedValue / 1000).toFixed(0)}K</p>
                        <p className="text-[9px] text-slate-400 font-medium">Value</p>
                      </div>
                    </div>
                  )}

                  {/* Fraud Detection - Compact */}
                  {message.data?.type === "fraud_detection" && (
                    <div className="mt-3 space-y-2.5">
                      <div className="flex items-center justify-between p-3 bg-gradient-to-br from-rose-500/10 to-rose-500/5 rounded-xl border border-rose-500/30">
                        <div>
                          <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">Fraud Risk</span>
                          <p className={cn(
                            "text-2xl font-bold",
                            message.data.overallScore >= 70 ? "text-red-400" :
                            message.data.overallScore >= 50 ? "text-amber-400" : "text-emerald-400"
                          )}>
                            {message.data.overallScore}/100
                          </p>
                        </div>
                        <Badge className={cn(
                          "text-[9px] px-2 py-1 font-semibold",
                          message.data.riskLevel === "elevated" && "bg-amber-500/20 text-amber-400 border-amber-500/30",
                          message.data.riskLevel === "high" && "bg-red-500/20 text-red-400 border-red-500/30",
                          message.data.riskLevel === "low" && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        )}>
                          {message.data.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="space-y-1.5">
                        {message.data.indicators.slice(0, 4).map((indicator: any, i: number) => (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px] text-slate-400">{indicator.label}</span>
                              <span className={cn(
                                "text-[10px] font-bold",
                                indicator.score >= 70 ? "text-red-400" :
                                indicator.score >= 50 ? "text-amber-400" : "text-emerald-400"
                              )}>
                                {indicator.score}
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${indicator.score}%` }}
                                transition={{ duration: 0.6, delay: i * 0.08 }}
                                className={cn(
                                  "h-full rounded-full",
                                  indicator.score >= 70 ? "bg-gradient-to-r from-red-500 to-red-400" :
                                  indicator.score >= 50 ? "bg-gradient-to-r from-amber-500 to-amber-400" : 
                                  "bg-gradient-to-r from-emerald-500 to-emerald-400"
                                )}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Severity Assessment - Compact */}
                  {message.data?.type === "severity_assessment" && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between p-2.5 bg-slate-700/40 rounded-lg border border-slate-600/50">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2.5 h-2.5 rounded-full animate-pulse",
                            message.data.level === "high" && "bg-red-500",
                            message.data.level === "medium" && "bg-amber-500",
                            message.data.level === "low" && "bg-emerald-500"
                          )} />
                          <p className={cn(
                            "text-sm font-bold uppercase",
                            message.data.level === "high" && "text-red-400",
                            message.data.level === "medium" && "text-amber-400",
                            message.data.level === "low" && "text-emerald-400"
                          )}>
                            {message.data.level} Severity
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">${(message.data.reserve / 1000000).toFixed(1)}M</p>
                          <span className="text-[9px] text-slate-500">Reserve</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>Timeline: <span className="text-white font-medium">{message.data.timeline}</span></span>
                      </div>
                    </div>
                  )}

                  {/* Stakeholder Routing - Compact */}
                  {message.data?.type === "stakeholder_routing" && (
                    <div className="mt-3 space-y-2">
                      <div className="space-y-1.5">
                        {message.data.stakeholders.filter((s: any) => s.priority === "primary").map((stakeholder: any, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.12 }}
                            className="flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-indigo-500/10 to-indigo-500/5 rounded-lg border border-indigo-500/30"
                          >
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white truncate">{stakeholder.name}</p>
                              <p className="text-[9px] text-slate-400 truncate">{stakeholder.role}</p>
                            </div>
                            <Badge className={cn(
                              "text-[8px] font-medium shrink-0",
                              stakeholder.status === "assigned" && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                              stakeholder.status === "scheduled" && "bg-blue-500/20 text-blue-400 border-blue-500/30",
                              stakeholder.status === "notified" && "bg-slate-700 text-slate-400 border-slate-600"
                            )}>
                              {stakeholder.status}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {message.data.stakeholders.filter((s: any) => s.priority === "secondary").map((stakeholder: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-[8px] border-slate-600 text-slate-400 bg-slate-800/50">
                            <CheckCircle2 className="w-2 h-2 mr-1 text-emerald-400" />
                            {stakeholder.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 sm:gap-2 text-slate-300 bg-slate-800/70 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 w-fit"
          >
            <div className="flex gap-0.5 sm:gap-1">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-400"
              />
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-400"
              />
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-400"
              />
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-slate-200">Alfred is analyzing...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Compact Footer Controls */}
      <div className="relative p-2 sm:p-3 border-t border-slate-700/50 bg-gradient-to-r from-slate-800/90 via-slate-800/70 to-slate-800/90 backdrop-blur-sm">
        {!isModuleComplete ? (
          <div className="flex items-center gap-2">
            {getNextPrompt() ? (
              <motion.div className="flex-1 min-w-0" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  onClick={advanceDemo}
                  className={cn(
                    "w-full justify-start bg-gradient-to-r text-white shadow-lg hover:shadow-xl transition-shadow h-9 sm:h-10 overflow-hidden",
                    currentModule.gradient
                  )}
                  disabled={isTyping || isPaused}
                >
                  <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2 shrink-0" />
                  <span className="overflow-hidden flex-1 min-w-0">
                    <span className="inline-block whitespace-nowrap sm:whitespace-normal animate-marquee sm:animate-none text-[11px] sm:text-sm font-medium text-white">
                      &quot;{getNextPrompt()}&quot;
                    </span>
                  </span>
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1.5 sm:ml-2 shrink-0" />
                </Button>
              </motion.div>
            ) : (
              <Button
                onClick={advanceDemo}
                variant="outline"
                className="w-full border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10 h-9 sm:h-10"
                disabled={isTyping || isPaused}
              >
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2" />
                <span className="text-[11px] sm:text-sm">Continue Demo</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1.5 sm:ml-2" />
              </Button>
            )}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-0.5 sm:py-1"
          >
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-emerald-300 mb-1.5 sm:mb-2">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-semibold">{currentModule.shortTitle} Complete!</span>
            </div>
            {completedModules.size < MODULES.length ? (
              <p className="text-[10px] sm:text-xs text-slate-300/80">
                Select another module to continue.
              </p>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <p className="text-[10px] sm:text-xs text-slate-300/80">
                  All modules completed.
                </p>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-emerald-300 hover:bg-emerald-500/10 h-6 sm:h-7 px-2 text-[10px] sm:text-xs"
                  onClick={resetDemo}
                >
                  <RotateCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                  Restart
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
