import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import {
  Users,
  Search,
  Building2,
  Globe,
  Linkedin,
  Mail,
  Phone,
  TrendingUp,
  Target,
  Sparkles,
  Bot,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  ExternalLink,
  Star,
  Zap,
  FileText,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DemoMarkdown } from "./DemoMarkdown";

type Lead = {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  size: string;
  location: string;
  email: string;
  linkedin: string;
  score: number;
  signals: string[];
  status: "new" | "researching" | "qualified" | "contacted";
};

type DemoMessage = {
  role: "user" | "assistant";
  content: string;
  leads?: Lead[];
  action?: string;
};

const demoConversation: DemoMessage[] = [
  {
    role: "user",
    content: "Find me decision-makers at construction companies in Sydney with 50+ employees"
  },
  {
    role: "assistant",
    content: "🔍 Searching across LinkedIn, company databases, and news sources... Found **47 qualified leads** matching your criteria. Here are the top matches:",
    leads: [
      {
        id: "1",
        name: "Michael Thompson",
        title: "Chief Operations Officer",
        company: "BuildRight Construction",
        industry: "Commercial Construction",
        size: "120 employees",
        location: "CBD",
        email: "m.thompson@buildright.com.au",
        linkedin: "linkedin.com/in/mthompson",
        score: 94,
        signals: ["Recent funding", "Hiring", "Tech adoption"],
        status: "new"
      },
      {
        id: "2",
        name: "Jane Smith",
        title: "Managing Director",
        company: "Urban Developments Group",
        industry: "Residential Construction",
        size: "85 employees",
        location: "Western Hub",
        email: "s.chen@urbandev.com.au",
        linkedin: "linkedin.com/in/sarahchen",
        score: 91,
        signals: ["Expansion plans", "New projects"],
        status: "new"
      },
      {
        id: "3",
        name: "James Wilson",
        title: "General Manager",
        company: "Precision Builders",
        industry: "Infrastructure",
        size: "200 employees",
        location: "Northern Hub",
        email: "j.wilson@precisionbuild.com.au",
        linkedin: "linkedin.com/in/jameswilson",
        score: 88,
        signals: ["Government contracts", "Growing"],
        status: "new"
      }
    ],
    action: "research_complete"
  },
  {
    role: "user",
    content: "Enrich the top lead with more company intel"
  },
  {
    role: "assistant",
    content: "📊 **Deep Research: BuildRight Construction**\n\n• **Revenue:** $45M annually (growing 22% YoY)\n• **Recent News:** Won $12M hospital renovation contract\n• **Tech Stack:** Using outdated project management tools\n• **Pain Points:** Manual reporting, subcontractor coordination delays\n• **Decision Maker:** Michael Thompson reports directly to CEO\n• **Best Approach:** Reference their hospital project and efficiency gains",
    action: "enrichment_complete"
  },
  {
    role: "user",
    content: "Generate a personalized outreach sequence for Michael"
  },
  {
    role: "assistant",
    content: "✉️ **Outreach Sequence Created** (3-touch campaign)\n\n**Email 1 (Day 0):** Congratulate on hospital contract, reference their project coordination challenges\n\n**Email 2 (Day 3):** Case study from similar construction firm showing 40% time savings\n\n**LinkedIn (Day 5):** Connection request with personalized note about industry trends\n\nAll messages personalized with BuildRight's specific context. Ready to send?",
    action: "outreach_ready"
  },
  {
    role: "user",
    content: "Yes, start the sequence and add to CRM"
  },
  {
    role: "assistant",
    content: "✅ **Actions Completed:**\n\n• Lead added to CRM (Pipeline: Prospecting)\n• Email 1 scheduled for 9 AM tomorrow\n• LinkedIn connection queued\n• Follow-up reminders set\n• All touchpoints synced to activity timeline\n\nI'll notify you when Michael opens the email or responds.",
    action: "sequence_started"
  }
];

export default function LeadResearchDemo() {
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [stats, setStats] = useState({ researched: 0, qualified: 0, contacted: 0 });
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
          
          if (assistantMessage.action === "research_complete") {
            setStats(prev => ({ ...prev, researched: 47 }));
          } else if (assistantMessage.action === "enrichment_complete") {
            setStats(prev => ({ ...prev, qualified: prev.qualified + 1 }));
          } else if (assistantMessage.action === "sequence_started") {
            setStats(prev => ({ ...prev, contacted: prev.contacted + 1 }));
          }
        }
        setIsTyping(false);
      }, 1500);
    }
  };

  const getNextPrompt = () => {
    if (demoIndex < demoConversation.length) {
      const next = demoConversation[demoIndex];
      if (next.role === "user") return next.content;
    }
    return "";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-2xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/5 overflow-hidden h-[500px] sm:h-[600px] md:h-[700px] flex flex-col"
    >
      {/* Header */}
      <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-teal-500/5 to-transparent">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm sm:text-base truncate">Lead Research & Acquisition</h3>
              <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">AI-Powered Prospecting</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs shrink-0">
            <div className="text-center">
              <p className="text-cyan-400 font-bold text-sm sm:text-lg tabular-nums">{stats.researched}</p>
              <p className="text-slate-500 hidden sm:block">Researched</p>
            </div>
            <div className="text-center">
              <p className="text-emerald-400 font-bold text-sm sm:text-lg tabular-nums">{stats.qualified}</p>
              <p className="text-slate-500 hidden sm:block">Qualified</p>
            </div>
            <div className="text-center">
              <p className="text-teal-400 font-bold text-sm sm:text-lg tabular-nums">{stats.contacted}</p>
              <p className="text-slate-500 hidden sm:block">Contacted</p>
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
                <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-2xl rounded-br-md px-3 sm:px-4 py-2 sm:py-3 max-w-[90%] sm:max-w-[85%] shadow-lg shadow-cyan-500/20">
                  <p className="text-xs sm:text-sm">{message.content}</p>
                </div>
              ) : (
                <div className="bg-slate-800/80 border border-cyan-500/20 rounded-2xl rounded-bl-md px-3 sm:px-4 py-2 sm:py-3 max-w-[95%] sm:max-w-[90%]">
                  <DemoMarkdown content={message.content} className="text-xs sm:text-sm" lightText />
                  
                  {message.leads && (
                    <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                      {message.leads.map((lead) => (
                        <motion.div
                          key={lead.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-slate-700/50 rounded-xl p-2.5 sm:p-3 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2 sm:gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <p className="font-semibold text-white text-xs sm:text-sm">{lead.name}</p>
                                <Badge className="bg-cyan-500/20 text-cyan-300 text-[9px] sm:text-[10px] border border-cyan-500/30">
                                  {lead.score}% match
                                </Badge>
                              </div>
                              <p className="text-[10px] sm:text-xs text-slate-400 truncate">{lead.title}</p>
                              <div className="flex items-center gap-1.5 sm:gap-2 mt-1 text-[10px] sm:text-xs text-slate-500">
                                <Building2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 text-teal-500" />
                                <span className="truncate">{lead.company}</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="hidden sm:inline">{lead.size}</span>
                              </div>
                              <div className="flex gap-1 mt-1.5 sm:mt-2 flex-wrap">
                                {lead.signals.slice(0, 2).map((signal, i) => (
                                  <Badge key={i} variant="outline" className="text-[8px] sm:text-[10px] border-emerald-500/30 text-emerald-400 px-1.5 py-0">
                                    {signal}
                                  </Badge>
                                ))}
                                {lead.signals.length > 2 && (
                                  <Badge variant="outline" className="text-[8px] sm:text-[10px] border-slate-600 text-slate-400 px-1.5 py-0">
                                    +{lead.signals.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-0.5 sm:gap-1 shrink-0">
                              <Button size="sm" variant="ghost" className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
                                <Linkedin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10">
                                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
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
            className="flex items-center gap-2 text-cyan-400"
          >
            <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
            <span className="text-sm">AI researching...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 sm:p-4 border-t border-cyan-500/20 bg-gradient-to-r from-slate-800/80 to-slate-800/50">
        {demoIndex < demoConversation.length ? (
          <div className="flex items-center gap-2">
            {getNextPrompt() ? (
              <Button
                onClick={simulateNextMessage}
                className="flex-1 min-w-0 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 justify-start text-xs sm:text-sm h-10 sm:h-11 shadow-lg shadow-cyan-500/20 px-2 sm:px-4 overflow-hidden"
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
                  className="w-full border-cyan-500/50 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 relative overflow-hidden group text-xs sm:text-sm h-10 sm:h-11"
                  disabled={isTyping}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"
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
              Automated research → enrichment → personalized outreach
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
