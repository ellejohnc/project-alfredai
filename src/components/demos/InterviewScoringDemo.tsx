import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import {
  Users,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Star,
  Award,
  Brain,
  Target,
  FileText,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Video,
  Mic,
  ClipboardCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DemoMarkdown } from "./DemoMarkdown";


type Candidate = {
  id: string;
  name: string;
  role: string;
  scores: {
    technical: number;
    communication: number;
    cultural: number;
    leadership: number;
    overall: number;
  };
  strengths: string[];
  concerns: string[];
  recommendation: "strong-hire" | "hire" | "maybe" | "no-hire";
};

type DemoMessage = {
  role: "user" | "assistant";
  content: string;
  candidate?: Candidate;
  comparison?: Candidate[];
  action?: string;
};

const demoConversation: DemoMessage[] = [
  {
    role: "user",
    content: "Analyze the interview recording for Jane Smith - Senior Engineer role"
  },
  {
    role: "assistant",
    content: "🎥 Analyzing 45-minute interview recording...\n\n**Processing:**\n• Speech-to-text transcription\n• Sentiment & confidence analysis\n• Technical depth scoring\n• Communication pattern mapping\n\nAnalysis complete! Here's the comprehensive scorecard:",
    candidate: {
      id: "1",
      name: "Jane Smith",
      role: "Senior Software Engineer",
      scores: {
        technical: 92,
        communication: 88,
        cultural: 85,
        leadership: 78,
        overall: 86
      },
      strengths: [
        "Deep systems design knowledge",
        "Clear problem articulation",
        "Proactive about documentation"
      ],
      concerns: [
        "Limited team leadership examples",
        "May need mentoring support"
      ],
      recommendation: "strong-hire"
    },
    action: "analysis_complete"
  },
  {
    role: "user",
    content: "What specific technical insights did the AI pick up?"
  },
  {
    role: "assistant",
    content: "🔍 **Technical Deep-Dive Analysis:**\n\n**System Design (Score: 95/100)**\n• Correctly identified scalability bottlenecks\n• Proposed microservices architecture with clear trade-offs\n• Referenced real-world examples from previous experience\n\n**Coding Approach (Score: 89/100)**\n• Thought out loud clearly during problem-solving\n• Considered edge cases proactively\n• Used appropriate data structures\n\n**Technical Communication (Score: 91/100)**\n• Explained complex concepts simply\n• Asked clarifying questions appropriately\n• Admitted knowledge gaps honestly (positive signal)\n\n**Red Flag Detection:** None identified",
    action: "technical_insights"
  },
  {
    role: "user",
    content: "Generate interview questions for the next round based on gaps"
  },
  {
    role: "assistant",
    content: "📝 **Recommended Questions for Panel Interview:**\n\n**Leadership Gap Exploration:**\n1. \"Tell me about a time you had to influence a technical decision without formal authority.\"\n2. \"How would you mentor a junior engineer struggling with code quality?\"\n\n**Team Dynamics:**\n3. \"Describe a conflict with a colleague and how you resolved it.\"\n4. \"How do you handle pushback on your technical recommendations?\"\n\n**Stress Testing:**\n5. \"Walk me through a project that failed. What would you do differently?\"\n\nThese questions are calibrated to assess her weaker areas while confirming strengths.",
    action: "questions_generated"
  },
  {
    role: "user",
    content: "Compare her against the other 2 finalists for this role"
  },
  {
    role: "assistant",
    content: "📊 **Finalist Comparison Matrix:**",
    comparison: [
      {
        id: "1",
        name: "Jane Smith",
        role: "Finalist #1",
        scores: { technical: 92, communication: 88, cultural: 85, leadership: 78, overall: 86 },
        strengths: ["Systems design", "Clear communication"],
        concerns: ["Leadership experience"],
        recommendation: "strong-hire"
      },
      {
        id: "2",
        name: "Mark Johnson",
        role: "Finalist #2",
        scores: { technical: 85, communication: 92, cultural: 90, leadership: 88, overall: 89 },
        strengths: ["Team leadership", "Cultural fit"],
        concerns: ["Less technical depth"],
        recommendation: "hire"
      },
      {
        id: "3",
        name: "Priya Patel",
        role: "Finalist #3",
        scores: { technical: 88, communication: 80, cultural: 82, leadership: 85, overall: 84 },
        strengths: ["Balanced profile", "Leadership"],
        concerns: ["Communication polish"],
        recommendation: "maybe"
      }
    ],
    action: "comparison_complete"
  },
  {
    role: "user",
    content: "Generate the hiring recommendation report"
  },
  {
    role: "assistant",
    content: "📄 **Hiring Recommendation Report Generated**\n\n**Primary Recommendation: Jane Smith**\n• Highest technical score aligns with role requirements\n• Growth potential for leadership with mentoring\n• Salary expectation within budget\n\n**Alternative: Mark Johnson**\n• Better for team-lead track if that's the priority\n• Higher cultural fit score\n\n**Report Includes:**\n✓ Full scorecard with AI analysis\n✓ Interview transcript highlights\n✓ Bias-check verification (passed)\n✓ Compensation benchmarking\n✓ Onboarding recommendations\n\n📧 Report sent to hiring manager and HR.",
    action: "report_generated"
  }
];

export default function InterviewScoringDemo() {
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [stats, setStats] = useState({ analyzed: 0, scored: 0, hired: 0 });
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
          
          if (assistantMessage.action === "analysis_complete") {
            setStats(prev => ({ ...prev, analyzed: 1, scored: 1 }));
          } else if (assistantMessage.action === "comparison_complete") {
            setStats(prev => ({ ...prev, analyzed: 3, scored: 3 }));
          } else if (assistantMessage.action === "report_generated") {
            setStats(prev => ({ ...prev, hired: 1 }));
          }
        }
        setIsTyping(false);
      }, 1800);
    }
  };

  const getNextPrompt = () => {
    if (demoIndex < demoConversation.length) {
      const next = demoConversation[demoIndex];
      if (next.role === "user") return next.content;
    }
    return "";
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "strong-hire": return "bg-emerald-500/20 text-emerald-300";
      case "hire": return "bg-blue-500/20 text-blue-300";
      case "maybe": return "bg-amber-500/20 text-amber-300";
      case "no-hire": return "bg-red-500/20 text-red-300";
      default: return "bg-slate-500/20 text-slate-300";
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden h-[500px] sm:h-[600px] md:h-[700px] flex flex-col">
      {/* Header */}
      <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm sm:text-base truncate">Interview Scoring Agent</h3>
              <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">AI Assessment & Analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs shrink-0">
            <div className="text-center">
              <p className="text-blue-400 font-bold text-sm sm:text-lg tabular-nums">{stats.analyzed}</p>
              <p className="text-slate-500 hidden sm:block">Analyzed</p>
            </div>
            <div className="text-center">
              <p className="text-violet-400 font-bold text-sm sm:text-lg tabular-nums">{stats.scored}</p>
              <p className="text-slate-500 hidden sm:block">Scored</p>
            </div>
            <div className="text-center">
              <p className="text-emerald-400 font-bold text-sm sm:text-lg tabular-nums">{stats.hired}</p>
              <p className="text-slate-500 hidden sm:block">Hired</p>
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
                <div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-3 sm:px-4 py-2 sm:py-3 max-w-[90%] sm:max-w-[85%]">
                  <p className="text-xs sm:text-sm">{message.content}</p>
                </div>
              ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-md px-3 sm:px-4 py-2 sm:py-3 max-w-[95%] sm:max-w-[90%]">
                  <DemoMarkdown content={message.content} className="text-xs sm:text-sm" />
                  
                  {message.candidate && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 sm:mt-4 bg-slate-700/50 rounded-xl p-3 sm:p-4 border border-slate-600"
                    >
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-white text-sm sm:text-base truncate">{message.candidate.name}</p>
                          <p className="text-[10px] sm:text-xs text-slate-400">{message.candidate.role}</p>
                        </div>
                        <Badge className={cn("text-[9px] sm:text-xs shrink-0", getRecommendationColor(message.candidate.recommendation))}>
                          {message.candidate.recommendation.replace("-", " ")}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
                        {Object.entries(message.candidate.scores).filter(([key]) => key !== 'overall').map(([key, value]) => (
                          <div key={key} className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-[9px] sm:text-xs text-slate-400 w-20 sm:w-24 capitalize">{key}</span>
                            <Progress value={value} className="flex-1 h-1.5 sm:h-2" />
                            <span className="text-[9px] sm:text-xs text-white w-8 text-right">{value}%</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 text-[10px] sm:text-xs">
                        <div>
                          <p className="text-emerald-400 mb-1 flex items-center gap-1">
                            <ThumbsUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" /> Strengths
                          </p>
                          <ul className="space-y-0.5">
                            {message.candidate.strengths.slice(0, 2).map((s, i) => (
                              <li key={i} className="text-slate-400 text-[9px] sm:text-xs">• {s}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-amber-400 mb-1 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" /> Concerns
                          </p>
                          <ul className="space-y-0.5">
                            {message.candidate.concerns.slice(0, 2).map((c, i) => (
                              <li key={i} className="text-slate-400 text-[9px] sm:text-xs">• {c}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {message.comparison && (
                    <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
                      {message.comparison.map((candidate, i) => (
                        <motion.div
                          key={candidate.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-slate-700/50 rounded-xl p-2 sm:p-3 border border-slate-600"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0">
                                {i + 1}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-white text-xs sm:text-sm truncate">{candidate.name}</p>
                                <p className="text-[10px] sm:text-xs text-slate-400">Overall: {candidate.scores.overall}%</p>
                              </div>
                            </div>
                            <Badge className={cn("text-[9px] sm:text-xs shrink-0", getRecommendationColor(candidate.recommendation))}>
                              {candidate.recommendation.replace("-", " ")}
                            </Badge>
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
            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
            <span className="text-xs sm:text-sm">AI analyzing interview...</span>
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
                className="flex-1 min-w-0 bg-blue-600 hover:bg-blue-700 justify-start text-xs sm:text-sm h-10 sm:h-11 px-2 sm:px-4 overflow-hidden group"
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
              AI interview analysis → scoring → hiring recommendations
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
