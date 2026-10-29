import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  Send,
  Users,
  Package,
  UserCog,
  CreditCard,
  BarChart3,
  FileText,
  CheckCircle2,
  Loader2,
  Bot,
  Mic,
  Brain,
  Building2,
  Briefcase,
  Receipt,
  TrendingUp,
  Zap
} from "lucide-react";
import BIDashboardChart from "./BIDashboardChart";
import { 
  SalesFunnelChart, 
  DepartmentRadarChart, 
  CashFlowWaterfallChart, 
  WorkforceDonutChart,
  RevenueForecastChart 
} from "./charts";
import { DragScrollArea } from "@/components/ui/drag-scroll-area";
import { cn } from "@/lib/utils";

type Module = "crm" | "erp" | "finance" | "workforce" | "projects" | "intelligence";

type ChartType = "kpi" | "funnel" | "radar" | "waterfall" | "donut" | "forecast";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: {
    module: Module;
    operation: string;
    result: string;
  };
  showChart?: boolean;
  chartType?: ChartType;
  prediction?: string;
};

type DemoScenario = {
  userMessage: string;
  assistantResponse: string;
  action: {
    module: Module;
    operation: string;
    result: string;
  };
  showChart?: boolean;
  chartType?: ChartType;
  prediction?: string;
  isVoice?: boolean;
};

const modules: { id: Module; label: string; icon: typeof Users; color: string }[] = [
  { id: "crm", label: "CRM", icon: Users, color: "text-blue-600" },
  { id: "erp", label: "ERP", icon: Package, color: "text-purple-600" },
  { id: "finance", label: "AP/AR", icon: CreditCard, color: "text-amber-600" },
  { id: "workforce", label: "Workforce", icon: UserCog, color: "text-emerald-600" },
  { id: "projects", label: "Projects", icon: Briefcase, color: "text-cyan-600" },
  { id: "intelligence", label: "AI Intel", icon: Brain, color: "text-rose-600" },
];

const demoScenarios: DemoScenario[] = [
  {
    userMessage: "New lead: Mark Stevens, Apex Building Group, $2.4M commercial fitout in North Queensland",
    assistantResponse: "✅ Lead created and AI-enriched. I found Marcus on LinkedIn — he's their Head of Projects. I've auto-tagged this as Commercial Fitout, matched 3 similar past wins, and drafted a follow-up email for your review.",
    action: {
      module: "crm",
      operation: "AI Lead Capture & Enrichment",
      result: "Lead #3891 created • Data enriched • Email drafted • Follow-up: 3 days"
    },
    prediction: "🔮 Predicted: 68% win probability based on similar project history"
  },
  {
    userMessage: "Show me the sales pipeline",
    assistantResponse: "📊 Here's your current pipeline. AI flagged 4 deals at risk of stalling — I've prepared re-engagement actions for each:",
    action: {
      module: "crm",
      operation: "Predictive Pipeline Analysis",
      result: "$8.7M pipeline • 23 active deals • 4 at-risk flagged • 62% avg win rate"
    },
    showChart: true,
    chartType: "funnel"
  },
  {
    userMessage: "Generate invoice for the Riverside Tower progress claim",
    assistantResponse: "📄 Invoice auto-generated from project milestones. I pulled the approved variations, retention rates, and contract terms. Ready for review and one-tap send.",
    action: {
      module: "finance",
      operation: "AI Invoice Generation",
      result: "INV-2847 • $187,500 progress claim • 5% retention held • Terms: 30 days"
    },
    prediction: "🔮 Predicted: Payment likely in 22 days based on client history"
  },
  {
    userMessage: "What's our cash position across all entities?",
    assistantResponse: "💰 Multi-org cash flow loaded. Your construction arm is positive but the consulting division has a $45K gap next month. I've prepared 3 actions to close it:",
    action: {
      module: "finance",
      operation: "Multi-Org Cash Flow Intelligence",
      result: "Construction: +$320K • Consulting: -$45K gap • Net: +$275K"
    },
    showChart: true,
    chartType: "waterfall"
  },
  {
    userMessage: "Break down contractor utilisation this quarter",
    assistantResponse: "👥 Workforce analytics loaded. 3 contractors are under-utilised — I've matched them to 2 upcoming projects that need their skillsets:",
    action: {
      module: "workforce",
      operation: "AI Workforce Optimisation",
      result: "47 active staff • 23 contractors • 3 under-utilised • 2 auto-matched"
    },
    showChart: true,
    chartType: "donut"
  },
  {
    userMessage: "Calculate profitability split for the Henderson project",
    assistantResponse: "📊 Profitability analysis complete. Revenue allocated across 3 divisions with commission calculations. 2 team members hit their bonus threshold:",
    action: {
      module: "projects",
      operation: "Profitability & Commission Calc",
      result: "Gross margin: 34% • $127K profit • 3-way split calculated • 2 bonuses triggered"
    },
    showChart: true,
    chartType: "kpi"
  },
  {
    userMessage: "Triage the AP inbox — what needs action?",
    assistantResponse: "🤖 AI triaged 18 incoming invoices. 12 auto-matched to POs and approved. 4 need your sign-off (over $10K threshold). 2 flagged as potential duplicates:",
    action: {
      module: "finance",
      operation: "AI Payables Triage",
      result: "18 invoices • 12 auto-approved • 4 need sign-off • 2 duplicates flagged"
    },
    prediction: "🔮 Predicted: $47K in savings from duplicate detection this quarter"
  },
  {
    userMessage: "Forecast Q3 revenue across both orgs",
    assistantResponse: "🔮 AI revenue forecast with 91% confidence. Construction pipeline is strong. I've also identified 5 past clients likely to re-engage this quarter:",
    action: {
      module: "intelligence",
      operation: "Multi-Org Revenue Forecast",
      result: "Q3 Target: $1.8M • 91% confidence • 5 re-engagement opportunities"
    },
    showChart: true,
    chartType: "forecast"
  },
  {
    userMessage: "Compare department performance across both companies",
    assistantResponse: "📈 Cross-org performance radar loaded. Your consulting operations team outperforms construction admin — I've flagged 3 process improvements to transfer:",
    action: {
      module: "intelligence",
      operation: "Cross-Org Performance Analysis",
      result: "Top: Consulting Ops (96%) • Gap: Construction Admin (71%) • 3 improvements identified"
    },
    showChart: true,
    chartType: "radar"
  }
];

const quickCommands = [
  { label: "AP/AR Triage", icon: "🤖" },
  { label: "Cash Position", icon: "💰" },
  { label: "Pipeline", icon: "📊" },
  { label: "Workforce", icon: "👥" },
  { label: "Forecast", icon: "🔮" },
  { label: "Profitability", icon: "📈" }
];

export default function BusinessOSDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Welcome to Accountable.link — your agentic AI platform. I manage CRM, ERP, AP/AR, workforce, and projects across all your organisations. Every action is predicted, enriched, and execution-ready. Try voice or type a command."
    }
  ]);
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.closest('.overflow-y-auto');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Auto-play demo scenarios
  useEffect(() => {
    if (!isAutoPlaying) return;

    const runScenario = async () => {
      const scenario = demoScenarios[currentScenarioIndex];
      
      setInputValue("");
      let typedMessage = "";
      for (const char of scenario.userMessage) {
        typedMessage += char;
        setInputValue(typedMessage);
        await new Promise(r => setTimeout(r, 25));
      }
      
      await new Promise(r => setTimeout(r, 500));
      
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: scenario.userMessage
      };
      setMessages(prev => [...prev, userMsg]);
      setInputValue("");
      
      setIsTyping(true);
      setActiveModule(scenario.action.module);
      
      await new Promise(r => setTimeout(r, 1500));
      
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: scenario.assistantResponse,
        action: scenario.action,
        showChart: scenario.showChart,
        chartType: scenario.chartType,
        prediction: scenario.prediction
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
      
      await new Promise(r => setTimeout(r, 4000));
      
      setCurrentScenarioIndex(prev => (prev + 1) % demoScenarios.length);
    };

    const timeout = setTimeout(runScenario, 2000);
    return () => clearTimeout(timeout);
  }, [isAutoPlaying, currentScenarioIndex]);

  const handleQuickCommand = (command: string) => {
    if (isDragging) return;
    
    setIsAutoPlaying(false);
    
    const commandMap: Record<string, string> = {
      "AP/AR Triage": "triage the AP",
      "Cash Position": "cash position",
      "Pipeline": "sales pipeline",
      "Workforce": "contractor utilisation",
      "Forecast": "forecast Q3",
      "Profitability": "profitability split"
    };
    
    const searchTerm = (commandMap[command] || command).toLowerCase();
    const scenario = demoScenarios.find(s => 
      s.userMessage.toLowerCase().includes(searchTerm)
    );
    
    if (scenario) {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: scenario.userMessage
      };
      setMessages(prev => [...prev, userMsg]);
      setIsTyping(true);
      setActiveModule(scenario.action.module);
      
      setTimeout(() => {
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: scenario.assistantResponse,
          action: scenario.action,
          showChart: scenario.showChart,
          chartType: scenario.chartType,
          prediction: scenario.prediction
        };
        setMessages(prev => [...prev, assistantMsg]);
        setIsTyping(false);
      }, 1500);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden h-[520px] sm:h-[680px] lg:h-[780px] w-full max-w-4xl mx-auto flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">Accountable.link</h3>
              <p className="text-xs sm:text-sm text-slate-500">Agentic AI • Orchestration Native</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200">
              <Mic className="w-3 h-3 text-purple-500" />
              <span className="text-xs text-purple-600 font-medium hidden sm:inline">Voice</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-600 font-medium">Live</span>
            </div>
          </div>
        </div>
        
        {/* Module indicators */}
        <DragScrollArea contentClassName="pb-1">
          <div className="flex gap-2">
            {modules.map((module) => {
              const Icon = module.icon;
              const isActive = activeModule === module.id;
              return (
                <div
                  key={module.id}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap border",
                    isActive 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm" 
                      : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive && module.color)} />
                  {module.label}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-emerald-500"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </DragScrollArea>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-slate-50 to-white overscroll-contain">
        <SafeAnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[90%] sm:max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
                  message.role === "user"
                    ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-br-md"
                    : "bg-white text-slate-800 rounded-bl-md border border-slate-200"
                )}
              >
                <p className="text-sm sm:text-base leading-relaxed">{message.content}</p>
                
                {/* Action result card */}
                {message.action && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs sm:text-sm font-semibold text-slate-800">
                        {message.action.operation}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium uppercase tracking-wide border border-emerald-200">
                        {message.action.module}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600">
                      {message.action.result}
                    </p>
                  </motion.div>
                )}

                {/* AI Prediction badge */}
                {message.prediction && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-700 font-medium"
                  >
                    {message.prediction}
                  </motion.div>
                )}
                
                {/* Charts */}
                {message.showChart && (
                  <>
                    {message.chartType === "kpi" && <BIDashboardChart />}
                    {message.chartType === "funnel" && <SalesFunnelChart />}
                    {message.chartType === "radar" && <DepartmentRadarChart />}
                    {message.chartType === "waterfall" && <CashFlowWaterfallChart />}
                    {message.chartType === "donut" && <WorkforceDonutChart />}
                    {message.chartType === "forecast" && <RevenueForecastChart />}
                    {!message.chartType && <BIDashboardChart />}
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </SafeAnimatePresence>
        
        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white rounded-2xl rounded-bl-md px-5 py-3 flex items-center gap-3 border border-slate-200 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span className="text-sm text-slate-600">
                AI processing in {modules.find(m => m.id === activeModule)?.label || activeModule?.toUpperCase()}...
              </span>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick commands + input */}
      <div className="bg-white border-t border-slate-200 p-3 sm:p-4 space-y-3">
        {/* Quick commands */}
        <div className="relative">
          <DragScrollArea contentClassName="pb-0.5">
            <div className="flex gap-2">
              {quickCommands.map((cmd) => (
                <button
                  key={cmd.label}
                  onClick={() => handleQuickCommand(cmd.label)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-medium text-slate-700 whitespace-nowrap transition-colors border border-slate-200 min-h-[32px]"
                >
                  <span>{cmd.icon}</span>
                  {cmd.label}
                </button>
              ))}
            </div>
          </DragScrollArea>
        </div>

        {/* Input area */}
        <div className="flex items-center gap-2">
          <button className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors border border-purple-200 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Mic className="w-4 h-4 text-purple-600" />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-2 border border-slate-200 min-h-[44px]">
            <input
              type="text"
              value={inputValue}
              readOnly
              placeholder="Ask anything or use voice..."
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
            />
            <button className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition-colors flex-shrink-0">
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
