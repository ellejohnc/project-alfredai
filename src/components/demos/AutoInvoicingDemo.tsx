import { useState, useEffect, useRef } from "react";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { InlineDemoSpeedControl } from "@/components/demos/shared/InlineDemoSpeedControl";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import {
  Receipt,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Mail,
  MessageSquare,
  ArrowRight,
  Loader2,
  DollarSign,
  Calendar,
  FileText,
  RefreshCw,
  TrendingUp,
  Users,
  Zap,
  Award,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DemoMarkdown } from "./DemoMarkdown";

type Invoice = {
  id: string;
  client: string;
  amount: number;
  dueDate: string;
  status: "draft" | "sent" | "overdue" | "paid" | "reminded";
  daysOverdue?: number;
};

type DemoMessage = {
  role: "user" | "assistant";
  content: string;
  invoices?: Invoice[];
  action?: string;
};

const demoConversation: DemoMessage[] = [
  {
    role: "user",
    content: "Generate invoices for all completed projects this month"
  },
  {
    role: "assistant",
    content: "📝 Scanning completed projects... Found **8 projects** ready for invoicing. Here are the generated invoices:",
    invoices: [
      { id: "INV-2024-089", client: "BuildRight Construction", amount: 45000, dueDate: "Jan 15, 2025", status: "draft" },
      { id: "INV-2024-090", client: "Urban Developments", amount: 28500, dueDate: "Jan 15, 2025", status: "draft" },
      { id: "INV-2024-091", client: "Precision Builders", amount: 62000, dueDate: "Jan 15, 2025", status: "draft" },
    ],
    action: "invoices_generated"
  },
  {
    role: "user",
    content: "Send all invoices and set up automatic reminders"
  },
  {
    role: "assistant",
    content: "✅ **All 8 invoices sent!**\n\n📧 Email with PDF attachment sent to each client\n📅 Payment terms: Net 30\n\n**Reminder Schedule Activated:**\n• Day 7: Friendly reminder email\n• Day 14: Follow-up with payment link\n• Day 21: Escalation to account manager\n• Day 30: Overdue notice + late fee warning",
    action: "invoices_sent"
  },
  {
    role: "user",
    content: "Show me overdue invoices and chase them"
  },
  {
    role: "assistant",
    content: "⚠️ Found **3 overdue invoices** totaling **$87,500**. Here's the breakdown:",
    invoices: [
      { id: "INV-2024-072", client: "Premier Constructions", amount: 35000, dueDate: "Dec 15, 2024", status: "overdue", daysOverdue: 11 },
      { id: "INV-2024-068", client: "Summit Developers", amount: 42500, dueDate: "Dec 10, 2024", status: "overdue", daysOverdue: 16 },
      { id: "INV-2024-065", client: "Harbour Projects", amount: 10000, dueDate: "Dec 20, 2024", status: "overdue", daysOverdue: 6 },
    ],
    action: "overdue_found"
  },
  {
    role: "user",
    content: "Send personalized reminders based on relationship history"
  },
  {
    role: "assistant",
    content: "📨 **Smart Reminders Sent:**\n\n**Premier Constructions** (11 days overdue)\n→ Tone: Firm but professional\n→ Mentioned: Previous prompt payment history\n→ Offered: Payment plan option\n\n**Summit Developers** (16 days overdue)\n→ Tone: Escalated, formal\n→ CC'd: Their CFO from our records\n→ Attached: Statement of account\n\n**Harbour Projects** (6 days overdue)\n→ Tone: Gentle reminder\n→ Note: First-time late, great relationship\n→ Included: Easy payment link\n\nI'll notify you when any respond or pay.",
    action: "reminders_sent"
  },
  {
    role: "user",
    content: "What's the cash flow forecast for next month?"
  },
  {
    role: "assistant",
    content: "💰 **January Cash Flow Forecast:**\n\n**Expected Income:**\n• Invoices due: $285,000\n• Recurring revenue: $45,000\n• Collection probability: 94%\n\n**Projected Collections:** $310,500\n\n**AI Insights:**\n• 2 clients likely to pay early (history pattern)\n• 1 client may need follow-up (seasonal slowdown)\n• Recommend: Offer 2% early payment discount to boost cash flow",
    action: "forecast_complete"
  }
];

export default function AutoInvoicingDemo() {
  const { applySpeed } = useDemoSpeed();
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [stats, setStats] = useState({ sent: 0, collected: 0, overdue: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateNextMessage = () => {
    if (demoIndex >= demoConversation.length || isTyping) return;

    const nextMessage = demoConversation[demoIndex];
    
    if (nextMessage.role === "user") {
      setMessages(prev => [...prev, nextMessage]);
      setDemoIndex(prev => prev + 1);
      setIsTyping(true);
      
      setTimeout(() => {
        const assistantMessage = demoConversation[demoIndex + 1];
        if (assistantMessage) {
          setMessages(prev => [...prev, assistantMessage]);
          setDemoIndex(prev => prev + 1);
          
          if (assistantMessage.action === "invoices_sent") {
            setStats(prev => ({ ...prev, sent: 8 }));
          } else if (assistantMessage.action === "overdue_found") {
            setStats(prev => ({ ...prev, overdue: 3 }));
          } else if (assistantMessage.action === "reminders_sent") {
            setStats(prev => ({ ...prev, collected: 1 }));
          }
        }
        setIsTyping(false);
      }, applySpeed(1500));
    }
  };

  const getNextPrompt = () => {
    if (demoIndex < demoConversation.length) {
      const next = demoConversation[demoIndex];
      if (next.role === "user") return next.content;
    }
    return "";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden h-[500px] sm:h-[600px] md:h-[700px] flex flex-col">
      {/* Header */}
      <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm sm:text-base truncate">Auto Invoicing & Reminders</h3>
              <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">Smart Collections AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs shrink-0">
            <InlineDemoSpeedControl compact className="hidden sm:flex" />
            <div className="text-center">
              <p className="text-emerald-400 font-bold text-sm sm:text-lg tabular-nums">{stats.sent}</p>
              <p className="text-slate-500 hidden sm:block">Sent</p>
            </div>
            <div className="text-center">
              <p className="text-blue-400 font-bold text-sm sm:text-lg tabular-nums">${stats.collected * 35}k</p>
              <p className="text-slate-500 hidden sm:block">Collected</p>
            </div>
            <div className="text-center">
              <p className="text-amber-400 font-bold text-sm sm:text-lg tabular-nums">{stats.overdue}</p>
              <p className="text-slate-500 hidden sm:block">Overdue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "user" ? (
                <div className="bg-emerald-600 text-white rounded-2xl rounded-br-md px-3 sm:px-4 py-2 sm:py-3 max-w-[90%] sm:max-w-[85%]">
                  <p className="text-xs sm:text-sm">{message.content}</p>
                </div>
              ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-md px-3 sm:px-4 py-2 sm:py-3 max-w-[95%] sm:max-w-[90%]">
                  <DemoMarkdown content={message.content} className="text-xs sm:text-sm" lightText />
                  
                  {message.invoices && (
                    <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
                      {message.invoices.map((invoice) => (
                        <motion.div
                          key={invoice.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-slate-700/50 rounded-xl p-2 sm:p-3 border border-slate-600"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <p className="font-semibold text-white text-xs sm:text-sm truncate">{invoice.client}</p>
                                <Badge className={cn(
                                  "text-[9px] sm:text-[10px] shrink-0",
                                  invoice.status === "draft" && "bg-slate-500/20 text-slate-300",
                                  invoice.status === "sent" && "bg-blue-500/20 text-blue-300",
                                  invoice.status === "overdue" && "bg-red-500/20 text-red-300",
                                  invoice.status === "paid" && "bg-emerald-500/20 text-emerald-300"
                                )}>
                                  {invoice.status === "overdue" ? `${invoice.daysOverdue}d late` : invoice.status}
                                </Badge>
                              </div>
                              <p className="text-[10px] sm:text-xs text-slate-400 truncate">{invoice.id} • Due: {invoice.dueDate}</p>
                            </div>
                            <p className="font-bold text-white text-xs sm:text-sm shrink-0 tabular-nums">{formatCurrency(invoice.amount)}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-slate-400"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Processing invoices...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 sm:p-4 border-t border-slate-700 bg-slate-800/50">
        {demoIndex < demoConversation.length ? (
          <div className="flex items-center gap-2">
            {getNextPrompt() ? (
              <Button
                onClick={simulateNextMessage}
                className="flex-1 min-w-0 bg-emerald-600 hover:bg-emerald-700 justify-start text-xs sm:text-sm h-10 sm:h-11 px-2 sm:px-4 overflow-hidden"
                disabled={isTyping}
              >
                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 shrink-0" />
                <span className="truncate text-left min-w-0">&quot;{getNextPrompt()}&quot;</span>
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
                  className="w-full border-primary/50 text-primary bg-primary/10 hover:bg-primary/20 relative overflow-hidden group text-xs sm:text-sm h-10 sm:h-11"
                  disabled={isTyping}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 relative z-10" />
                  <span className="relative z-10">Continue Demo...</span>
                  <motion.div
                    className="ml-1.5 sm:ml-2 relative z-10"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </motion.div>
                </Button>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-semibold text-sm sm:text-base">Demo Complete!</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Automated invoicing → smart reminders → cash flow forecasting
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
