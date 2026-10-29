import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  FileText, Upload, Brain, Scale, AlertTriangle, Users, 
  Bell, Shield, BarChart3, GitBranch, History, MessageSquare,
  Mail, FolderSync, Settings, CheckCircle2, Clock, 
  ChevronRight, ChevronLeft, Sparkles, Eye, PenLine, Send, ArrowRight,
  Building2, Gavel, ClipboardCheck, FileSearch, Zap, 
  Lock, Share2, CheckSquare, XCircle, AlertCircle, 
  Layers, Target, TrendingUp, Bot, Lightbulb, X,
  Reply, ThumbsUp, ThumbsDown, MoreHorizontal, Plus, ChevronDown, ChevronUp,
  Wand2, Copy, Check, Loader2, ArrowLeftRight, Minus
} from "lucide-react";
import { DemoMarkdown } from "./DemoMarkdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WORKFLOW_STEPS = [
  {
    id: 1,
    title: "Input & Upload",
    icon: Upload,
    description: "Upload contracts, sync from email/cloud",
    details: [
      "Upload contract documents (PDFs, DOCs)",
      "Voice memos, instructions, emails",
      "Sync from cloud drive or project platform",
      "Secure drop for external parties"
    ]
  },
  {
    id: 2,
    title: "Context & Mapping",
    icon: Brain,
    description: "AI identifies clauses & responsibilities",
    details: [
      "Identifies clause types & topics",
      "Maps clause-to-stakeholder relationships",
      "Checks for missing responsibilities",
      "Flags ambiguous language"
    ]
  },
  {
    id: 3,
    title: "Clause Comparison",
    icon: Scale,
    description: "Benchmarks against standards & past contracts",
    details: [
      "Compares to past similar agreements",
      "Benchmarks against AS4000, regulations",
      "Highlights unusual variations",
      "Identifies risky custom wording"
    ]
  },
  {
    id: 4,
    title: "Risk & Opportunity Report",
    icon: AlertTriangle,
    description: "AI-generated interactive risk report",
    details: [
      "Highlighted risks & conflicts",
      "Missed opportunities flagged",
      "Stakeholder-specific recommendations",
      "Entity & credit lookup"
    ]
  },
  {
    id: 5,
    title: "Action Assignments",
    icon: Bell,
    description: "Auto-draft notifications & assign tasks",
    details: [
      "Auto-draft emails & WhatsApp messages",
      "Recommend deadlines",
      "Create stakeholder action cards",
      "Priority-based assignments"
    ]
  },
  {
    id: 6,
    title: "Security & Controls",
    icon: Shield,
    description: "Role-based access & document protection",
    details: [
      "Password-protected viewer",
      "Domain/email validation",
      "View/edit restrictions by role",
      "Encrypted file storage"
    ]
  },
  {
    id: 7,
    title: "Task Scoreboard",
    icon: BarChart3,
    description: "Real-time progress tracking",
    details: [
      "What's completed",
      "What's in progress",
      "Who is responsible",
      "What's overdue"
    ]
  },
  {
    id: 8,
    title: "Workflow Diagram",
    icon: GitBranch,
    description: "Interactive review & sign-off flow",
    details: [
      "Visual map of review process",
      "See what's next",
      "Track waiting items",
      "All-party visibility"
    ]
  },
  {
    id: 9,
    title: "Audit Trail",
    icon: History,
    description: "Complete activity logging",
    details: [
      "Comments & changes logged",
      "Downloads & access tracked",
      "IP addresses recorded",
      "Timestamps on everything"
    ]
  }
];

const STAKEHOLDERS = {
  principal: [
    { role: "CEO / Director", icon: Building2 },
    { role: "Construction Manager", icon: Building2 },
    { role: "Project Manager", icon: ClipboardCheck },
    { role: "Contract Administrator", icon: FileText },
    { role: "Legal Counsel", icon: Gavel }
  ],
  contractor: [
    { role: "Director", icon: Building2 },
    { role: "Bid Manager", icon: Target },
    { role: "Operations Manager", icon: Settings },
    { role: "Legal Advisor", icon: Gavel }
  ]
};

const COPILOT_MESSAGES = [
  { 
    type: "system",
    content: "Contract uploaded: Construction_Agreement_v3.pdf (47 pages)"
  },
  { 
    type: "ai",
    content: "I've identified 142 clauses across 12 categories. Found 3 high-risk items requiring immediate attention."
  },
  {
    type: "suggestion",
    title: "Risk Alert: Payment Terms",
    content: "Clause 14.2 differs significantly from your standard AS4000 template. Payment terms extended from 30 to 60 days.",
    severity: "high"
  },
  {
    type: "ai",
    content: "I've mapped responsibilities to 6 stakeholders. The Legal Counsel and Project Manager have the most assigned items."
  },
  {
    type: "suggestion",
    title: "Missing Clause",
    content: "Variation clause (typically Section 20) is not present. Recommend adding standard variation provisions.",
    severity: "medium"
  },
  {
    type: "ai",
    content: "Entity check complete: Principal registered 2018, no credit issues. All director details verified."
  },
  {
    type: "action",
    title: "Recommended Actions",
    items: [
      "Assign Clause 14.2 to Legal Counsel for review",
      "Draft variation clause using Template V-2024",
      "Schedule internal review meeting"
    ]
  }
];

const CLAUSE_ANALYSIS = [
  { id: 1, name: "Payment Terms", status: "risk", assignee: "Legal", progress: 0, section: "14.2", text: "Payment shall be made within 60 days of invoice receipt..." },
  { id: 2, name: "Liability Limits", status: "review", assignee: "Director", progress: 45, section: "8.1", text: "The Contractor's liability shall be limited to..." },
  { id: 3, name: "Insurance Requirements", status: "ok", assignee: "Admin", progress: 100, section: "9.3", text: "Public liability insurance of not less than $20M..." },
  { id: 4, name: "Termination Clause", status: "review", assignee: "Legal", progress: 60, section: "22.1", text: "Either party may terminate this agreement with 30 days notice..." },
  { id: 5, name: "Dispute Resolution", status: "ok", assignee: "Legal", progress: 100, section: "25.2", text: "All disputes shall be resolved through mediation..." },
  { id: 6, name: "Variations", status: "missing", assignee: "PM", progress: 0, section: "—", text: "No variation clause present in this contract." },
];

interface Comment {
  id: string;
  author: string;
  avatar: string;
  role: string;
  content: string;
  timestamp: string;
  status?: "agree" | "negotiate" | "resolved";
  replies?: Comment[];
}

interface ClauseComments {
  [clauseId: number]: Comment[];
}

const INITIAL_COMMENTS: ClauseComments = {
  1: [
    {
      id: "c1",
      author: "Jane Smith",
      avatar: "SC",
      role: "Legal Counsel",
      content: "60 days is significantly outside our standard terms. We should negotiate this back to 30 days or request a discount for extended payment.",
      timestamp: "2 hours ago",
      status: "negotiate",
      replies: [
        {
          id: "c1-r1",
          author: "James Wilson",
          avatar: "JW",
          role: "Project Manager",
          content: "Agreed. This will affect our cash flow projections. Can we propose 45 days as a compromise?",
          timestamp: "1 hour ago",
        },
        {
          id: "c1-r2",
          author: "Jane Smith",
          avatar: "SC",
          role: "Legal Counsel",
          content: "45 days could work. I'll draft the amendment language.",
          timestamp: "45 min ago",
          status: "agree",
        }
      ]
    }
  ],
  2: [
    {
      id: "c2",
      author: "Michael Torres",
      avatar: "MT",
      role: "Director",
      content: "The liability cap seems reasonable for this project size. However, we should ensure consequential damages are properly excluded.",
      timestamp: "3 hours ago",
      status: "agree",
    }
  ],
  4: [
    {
      id: "c4",
      author: "Emma Roberts",
      avatar: "ER",
      role: "Contract Admin",
      content: "30 days notice seems short for a project of this scale. Should we push for 60 days?",
      timestamp: "5 hours ago",
      replies: [
        {
          id: "c4-r1",
          author: "Jane Smith",
          avatar: "SC",
          role: "Legal Counsel",
          content: "Good catch. Adding this to the negotiation list.",
          timestamp: "4 hours ago",
        }
      ]
    }
  ]
};

const ContractReviewDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [copilotMessages, setCopilotMessages] = useState<typeof COPILOT_MESSAGES>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"copilot" | "clauses" | "stakeholders">("copilot");
  const [selectedClause, setSelectedClause] = useState<number | null>(null);
  const [comments, setComments] = useState<ClauseComments>(INITIAL_COMMENTS);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set(["c1"]));
  const [aiSuggestions, setAiSuggestions] = useState<Record<number, string>>({});
  const [loadingSuggestion, setLoadingSuggestion] = useState<number | null>(null);
  const [copiedSuggestion, setCopiedSuggestion] = useState<number | null>(null);
  const [editingSuggestion, setEditingSuggestion] = useState<number | null>(null);
  const [editedText, setEditedText] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // User question state
  const [userQuestion, setUserQuestion] = useState("");
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [userMessages, setUserMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);

  const handleAskQuestion = async (directQuestion?: string) => {
    const question = (directQuestion || userQuestion).trim();
    if (!question || isAskingQuestion) return;
    
    setUserQuestion("");
    setIsAskingQuestion(true);
    
    // Add user message to display
    setUserMessages(prev => [...prev, { role: "user", content: question }]);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contract-question`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ 
            question,
            conversationHistory 
          }),
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Failed to get answer");
        return;
      }
      
      // Add assistant response
      setUserMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
      
      // Update conversation history for context
      setConversationHistory(prev => [
        ...prev,
        { role: "user", content: question },
        { role: "assistant", content: data.answer }
      ]);
    } catch (error) {
      console.error("Error asking question:", error);
      toast.error("Failed to connect to AI assistant");
    } finally {
      setIsAskingQuestion(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [copilotMessages, isTyping, userMessages, isAskingQuestion]);

  useEffect(() => {
    if (copilotMessages.length < COPILOT_MESSAGES.length) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setCopilotMessages(prev => [...prev, COPILOT_MESSAGES[prev.length]]);
        setIsTyping(false);
        
        // Progress the workflow
        if (copilotMessages.length === 0) setCurrentStep(1);
        if (copilotMessages.length === 2) setCurrentStep(2);
        if (copilotMessages.length === 3) setCurrentStep(3);
        if (copilotMessages.length === 5) setCurrentStep(4);
        if (copilotMessages.length === 6) setCurrentStep(5);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copilotMessages]);

  useEffect(() => {
    if (currentStep > 0 && analysisProgress < 100) {
      const timer = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 2, 100));
      }, 100);
      return () => clearInterval(timer);
    }
  }, [currentStep, analysisProgress]);

  const toggleThread = (commentId: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleAddComment = (clauseId: number) => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: `c${Date.now()}`,
      author: "You",
      avatar: "YO",
      role: "Reviewer",
      content: newComment,
      timestamp: "Just now",
    };
    setComments(prev => ({
      ...prev,
      [clauseId]: [...(prev[clauseId] || []), comment]
    }));
    setNewComment("");
  };

  const handleAddReply = (clauseId: number, parentId: string) => {
    if (!replyText.trim()) return;
    const reply: Comment = {
      id: `r${Date.now()}`,
      author: "You",
      avatar: "YO",
      role: "Reviewer",
      content: replyText,
      timestamp: "Just now",
    };
    setComments(prev => ({
      ...prev,
      [clauseId]: prev[clauseId].map(c => 
        c.id === parentId 
          ? { ...c, replies: [...(c.replies || []), reply] }
          : c
      )
    }));
    setReplyText("");
    setReplyingTo(null);
    setExpandedThreads(prev => new Set([...prev, parentId]));
  };

  const handleSuggestAmendment = async (clause: typeof CLAUSE_ANALYSIS[0]) => {
    if (loadingSuggestion === clause.id) return;
    
    setLoadingSuggestion(clause.id);
    
    try {
      const { data, error } = await supabase.functions.invoke("suggest-amendment", {
        body: {
          clauseName: clause.name,
          clauseText: clause.text,
          clauseStatus: clause.status,
          context: comments[clause.id]?.map(c => `${c.author}: ${c.content}`).join("\n")
        }
      });

      if (error) throw error;
      
      if (data?.suggestion) {
        setAiSuggestions(prev => ({ ...prev, [clause.id]: data.suggestion }));
        toast.success("Amendment suggestion generated");
      }
    } catch (error) {
      console.error("Error generating suggestion:", error);
      toast.error("Failed to generate suggestion. Please try again.");
    } finally {
      setLoadingSuggestion(null);
    }
  };

  const handleCopySuggestion = async (clauseId: number) => {
    const suggestion = aiSuggestions[clauseId];
    if (!suggestion) return;
    
    await navigator.clipboard.writeText(suggestion);
    setCopiedSuggestion(clauseId);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedSuggestion(null), 2000);
  };

  const handleStartEditing = (clauseId: number) => {
    setEditingSuggestion(clauseId);
    setEditedText(aiSuggestions[clauseId] || "");
    setShowDiffView(null); // Close diff view when editing
  };

  const handleSaveEdit = (clauseId: number) => {
    setAiSuggestions(prev => ({ ...prev, [clauseId]: editedText }));
    setEditingSuggestion(null);
    setEditedText("");
    toast.success("Amendment updated");
  };

  const handleCancelEdit = () => {
    setEditingSuggestion(null);
    setEditedText("");
  };

  // Extract the suggested amendment text from the full AI response
  const extractAmendedText = (suggestion: string): string => {
    const match = suggestion.match(/\*\*Suggested Amendment:\*\*\s*([\s\S]*?)(?=\*\*Rationale:|$)/i);
    if (match && match[1]) {
      return match[1].trim();
    }
    // Fallback: try to find text between first and second section
    const lines = suggestion.split('\n').filter(l => l.trim());
    const startIdx = lines.findIndex(l => l.includes('Suggested Amendment'));
    const endIdx = lines.findIndex(l => l.includes('Rationale'));
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      return lines.slice(startIdx + 1, endIdx).join(' ').trim();
    }
    return suggestion.split('\n')[0] || suggestion;
  };

  // Simple word-level diff for highlighting changes
  const computeDiff = (original: string, amended: string) => {
    const originalWords = original.split(/\s+/);
    const amendedWords = amended.split(/\s+/);
    
    const originalResult: { word: string; type: 'same' | 'removed' | 'changed' }[] = [];
    const amendedResult: { word: string; type: 'same' | 'added' | 'changed' }[] = [];
    
    // Simple LCS-based diff
    const lcs = (a: string[], b: string[]): Set<number>[] => {
      const m = a.length, n = b.length;
      const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
      
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          if (a[i - 1].toLowerCase() === b[j - 1].toLowerCase()) {
            dp[i][j] = dp[i - 1][j - 1] + 1;
          } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          }
        }
      }
      
      const inA = new Set<number>(), inB = new Set<number>();
      let i = m, j = n;
      while (i > 0 && j > 0) {
        if (a[i - 1].toLowerCase() === b[j - 1].toLowerCase()) {
          inA.add(i - 1);
          inB.add(j - 1);
          i--; j--;
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
          i--;
        } else {
          j--;
        }
      }
      return [inA, inB];
    };
    
    const [inOriginal, inAmended] = lcs(originalWords, amendedWords);
    
    originalWords.forEach((word, i) => {
      originalResult.push({ word, type: inOriginal.has(i) ? 'same' : 'removed' });
    });
    
    amendedWords.forEach((word, i) => {
      amendedResult.push({ word, type: inAmended.has(i) ? 'same' : 'added' });
    });
    
    return { original: originalResult, amended: amendedResult };
  };

  const [showDiffView, setShowDiffView] = useState<number | null>(null);

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case "agree": return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "negotiate": return "bg-warning/20 text-warning border-warning/30";
      case "resolved": return "bg-info/20 text-info border-info/30";
      default: return "";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "risk": return "text-destructive bg-destructive/10";
      case "review": return "text-warning bg-warning/10";
      case "ok": return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
      case "missing": return "text-primary bg-primary/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "risk": return XCircle;
      case "review": return AlertCircle;
      case "ok": return CheckCircle2;
      case "missing": return AlertTriangle;
      default: return Clock;
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden max-h-[80vh] overflow-y-auto">
      {/* Header - Compact for mobile */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-2.5 border-b border-border sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <FileSearch className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground">Contract Review</h3>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 hidden sm:inline-flex">AI Analysis</Badge>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge variant="outline" className="border-secondary/30 text-secondary bg-secondary/10 text-[9px] px-1.5 py-0">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              <span className="hidden sm:inline">Copilot</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content - Copilot Layout */}
      <div className="flex flex-col md:flex-row h-auto md:h-[500px]">
        {/* Left Panel - Document/Workflow View */}
        <div className="flex-1 border-b md:border-b-0 md:border-r border-border flex flex-col min-w-0">
          {/* Workflow Progress */}
          <div className="px-3 py-2 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">Analysis</span>
              <span className="text-[10px] font-medium text-primary">{analysisProgress}%</span>
            </div>
            <Progress value={analysisProgress} className="h-1" />
          </div>

          {/* Workflow Steps - Horizontal with Arrows */}
          <div className="px-3 py-2 border-b border-border">
            <div className="flex items-center gap-1">
              {/* Left Arrow */}
              <button
                onClick={() => {
                  const container = document.getElementById('contract-workflow-scroll');
                  if (container) container.scrollBy({ left: -150, behavior: 'smooth' });
                }}
                className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              
              {/* Scrollable Steps */}
              <div id="contract-workflow-scroll" className="flex-1 overflow-x-auto scrollbar-hide">
                <div className="flex gap-1.5 w-max">
                  {WORKFLOW_STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id;
                    const isComplete = currentStep > step.id;
                    
                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all cursor-pointer ${
                          isActive 
                            ? "bg-primary/20 border border-primary/40" 
                            : isComplete
                            ? "bg-secondary/10 border border-secondary/20"
                            : "bg-muted/50 border border-border opacity-50"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          isComplete ? "bg-secondary" : isActive ? "bg-primary" : "bg-muted-foreground/30"
                        }`}>
                          {isComplete ? (
                            <CheckCircle2 className="w-3 h-3 text-secondary-foreground" />
                          ) : (
                            <Icon className="w-2.5 h-2.5 text-primary-foreground" />
                          )}
                        </div>
                        <span className={`text-[10px] whitespace-nowrap ${
                          isActive ? "text-primary" : isComplete ? "text-secondary" : "text-muted-foreground"
                        }`}>
                          {step.title}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              
              {/* Right Arrow */}
              <button
                onClick={() => {
                  const container = document.getElementById('contract-workflow-scroll');
                  if (container) container.scrollBy({ left: 150, behavior: 'smooth' });
                }}
                className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Document Preview / Content Area */}
          <div className="flex-1 p-3 overflow-auto">
            {!showDocument ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-4 md:py-8"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-primary/20 flex items-center justify-center mb-2 md:mb-3 border border-primary/20">
                  <Upload className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
                <h4 className="text-sm md:text-base font-medium text-foreground mb-0.5 md:mb-1">Drop Contract Here</h4>
                <p className="text-[10px] md:text-xs text-muted-foreground mb-2 md:mb-4 max-w-[180px] md:max-w-[200px]">
                  Upload PDFs, DOCs, or sync from cloud
                </p>
                <Button 
                  onClick={() => setShowDocument(true)}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground glow-pulse animate-pulse h-8 md:h-9 text-xs md:text-sm"
                >
                  <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                  Load Sample
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* Document Header */}
                <div className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-destructive" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">Construction_Agreement_v3.pdf</p>
                      <p className="text-[10px] text-muted-foreground">47 pages • 142 clauses</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                      <PenLine className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { id: "copilot", label: "AI", icon: Bot },
                    { id: "clauses", label: "Clauses", icon: Layers },
                    { id: "stakeholders", label: "Team", icon: Users }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                        activeTab === tab.id
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  {activeTab === "clauses" && (
                    <motion.div
                      key="clauses"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-2"
                    >
                      {CLAUSE_ANALYSIS.map((clause) => {
                        const StatusIcon = getStatusIcon(clause.status);
                        const clauseComments = comments[clause.id] || [];
                        const isSelected = selectedClause === clause.id;
                        
                        return (
                          <div key={clause.id} className="relative">
                            <div
                              onClick={() => setSelectedClause(isSelected ? null : clause.id)}
                              className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                                isSelected 
                                  ? "bg-primary/10 border-primary/40" 
                                  : "bg-muted/50 border-border hover:border-primary/30"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getStatusColor(clause.status)}`}>
                                  <StatusIcon className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-foreground">{clause.name}</p>
                                    <span className="text-xs text-muted-foreground">§{clause.section}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">Assigned to {clause.assignee}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {clauseComments.length > 0 && (
                                  <div className="flex items-center gap-1 text-primary">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span className="text-xs">{clauseComments.length}</span>
                                  </div>
                                )}
                                <Badge variant="outline" className={getStatusColor(clause.status)}>
                                  {clause.status}
                                </Badge>
                              </div>
                            </div>

                            {/* Figma-style Comment Panel */}
                            <AnimatePresence>
                              {isSelected && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-2 p-4 bg-card rounded-xl border border-border">
                                    {/* Clause Text Preview */}
                                    <div className="mb-4 p-3 bg-muted/50 rounded-lg border-l-2 border-primary">
                                      <p className="text-xs text-muted-foreground italic">"{clause.text}"</p>
                                    </div>

                                    {/* AI Suggest Amendment Button */}
                                    <div className="mb-4">
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSuggestAmendment(clause);
                                        }}
                                        disabled={loadingSuggestion === clause.id}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                      >
                                        {loadingSuggestion === clause.id ? (
                                          <>
                                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                            Generating...
                                          </>
                                        ) : (
                                          <>
                                            <Wand2 className="w-3 h-3 mr-2" />
                                            Suggest Amendment
                                          </>
                                        )}
                                      </Button>
                                    </div>

                                    {/* AI Suggestion Display */}
                                    <AnimatePresence>
                                      {aiSuggestions[clause.id] && (
                                        <motion.div
                                          initial={{ opacity: 0, y: -10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: -10 }}
                                          className="mb-4 p-4 bg-primary/5 rounded-xl border border-primary/30"
                                        >
                                          <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                              <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                                                <Sparkles className="w-3 h-3 text-primary-foreground" />
                                              </div>
                                              <span className="text-xs font-medium text-foreground">AI Amendment Suggestion</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              {editingSuggestion !== clause.id && (
                                                <>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleStartEditing(clause.id);
                                                    }}
                                                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                                                  >
                                                    <PenLine className="w-3 h-3 mr-1" />
                                                    <span className="text-[10px]">Edit</span>
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setShowDiffView(showDiffView === clause.id ? null : clause.id);
                                                    }}
                                                    className={`h-7 px-2 ${showDiffView === clause.id ? 'text-primary bg-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                                                  >
                                                    <ArrowLeftRight className="w-3 h-3 mr-1" />
                                                    <span className="text-[10px]">Compare</span>
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleCopySuggestion(clause.id);
                                                    }}
                                                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                                                  >
                                                    {copiedSuggestion === clause.id ? (
                                                      <Check className="w-3 h-3 text-emerald-400" />
                                                    ) : (
                                                      <Copy className="w-3 h-3" />
                                                    )}
                                                  </Button>
                                                </>
                                              )}
                                            </div>
                                          </div>

                                          {/* Side-by-Side Diff View */}
                                          <AnimatePresence>
                                            {showDiffView === clause.id && (
                                              <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mb-4 overflow-hidden"
                                              >
                                                {(() => {
                                                  const amendedText = extractAmendedText(aiSuggestions[clause.id]);
                                                  const diff = computeDiff(clause.text, amendedText);
                                                  
                                                  return (
                                                    <div className="grid grid-cols-2 gap-3">
                                                      {/* Original */}
                                                      <div className="p-3 bg-muted/50 rounded-lg border border-destructive/20">
                                                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                                                          <Minus className="w-3 h-3 text-destructive" />
                                                          <span className="text-[10px] font-medium text-destructive uppercase tracking-wide">Original</span>
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                          {diff.original.map((item, i) => (
                                                            <span
                                                              key={i}
                                                              className={
                                                                item.type === 'removed'
                                                                  ? 'bg-destructive/20 text-destructive px-0.5 rounded line-through'
                                                                  : ''
                                                              }
                                                            >
                                                              {item.word}{' '}
                                                            </span>
                                                          ))}
                                                        </p>
                                                      </div>

                                                      {/* Amended */}
                                                      <div className="p-3 bg-muted/50 rounded-lg border border-emerald-500/20">
                                                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                                                          <Plus className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Amended</span>
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                          {diff.amended.map((item, i) => (
                                                            <span
                                                              key={i}
                                                              className={
                                                                item.type === 'added'
                                                                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-0.5 rounded'
                                                                  : ''
                                                              }
                                                            >
                                                              {item.word}{' '}
                                                            </span>
                                                          ))}
                                                        </p>
                                                      </div>
                                                    </div>
                                                  );
                                                })()}

                                                {/* Legend */}
                                                <div className="flex items-center justify-center gap-4 mt-3 pt-2 border-t border-border">
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="w-3 h-3 rounded bg-destructive/30" />
                                                    <span className="text-[9px] text-muted-foreground">Removed</span>
                                                  </div>
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="w-3 h-3 rounded bg-emerald-500/30" />
                                                    <span className="text-[9px] text-muted-foreground">Added</span>
                                                  </div>
                                                </div>
                                              </motion.div>
                                            )}
                                          </AnimatePresence>

                                          {/* Editable Mode */}
                                          {editingSuggestion === clause.id ? (
                                            <div className="space-y-3">
                                              <div className="relative">
                                                <textarea
                                                  value={editedText}
                                                  onChange={(e) => setEditedText(e.target.value)}
                                                  onClick={(e) => e.stopPropagation()}
                                                  className="w-full h-48 p-3 text-xs text-foreground bg-muted/50 border border-primary/40 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 leading-relaxed"
                                                  placeholder="Edit the amendment suggestion..."
                                                />
                                                <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground">
                                                  {editedText.length} characters
                                                </div>
                                              </div>
                                              <div className="flex gap-2">
                                                <Button
                                                  size="sm"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSaveEdit(clause.id);
                                                  }}
                                                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                                                >
                                                  <Check className="w-3 h-3 mr-1" />
                                                  Save Changes
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCancelEdit();
                                                  }}
                                                  className="h-7 text-xs border-border text-muted-foreground hover:bg-muted"
                                                >
                                                  <X className="w-3 h-3 mr-1" />
                                                  Cancel
                                                </Button>
                                              </div>
                                            </div>
                                          ) : (
                                            <>
                                              {/* Full AI Response (collapsed when diff view is open) */}
                                              {showDiffView !== clause.id && (
                                                <div className="prose prose-sm max-w-none">
                                                  <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                                                    {aiSuggestions[clause.id]}
                                                  </div>
                                                </div>
                                              )}

                                              <div className="flex gap-2 mt-3 pt-3 border-t border-primary/20">
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="h-7 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                                  Apply
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStartEditing(clause.id);
                                                  }}
                                                >
                                                  <PenLine className="w-3 h-3 mr-1" />
                                                  Edit
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="h-7 text-xs border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSuggestAmendment(clause);
                                                  }}
                                                >
                                                  <Wand2 className="w-3 h-3 mr-1" />
                                                  Regenerate
                                                </Button>
                                              </div>
                                            </>
                                          )}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>

                                    {/* Comments Thread */}
                                    <div className="space-y-3 mb-4">
                                      {clauseComments.length === 0 ? (
                                        <div className="text-center py-4">
                                          <MessageSquare className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                                          <p className="text-xs text-muted-foreground">No comments yet. Be the first to comment.</p>
                                        </div>
                                      ) : (
                                        clauseComments.map((comment) => (
                                          <div key={comment.id} className="space-y-2">
                                            {/* Main Comment */}
                                            <div className="flex gap-2">
                                              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                                <span className="text-[10px] font-medium text-primary-foreground">{comment.avatar}</span>
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                  <span className="text-xs font-medium text-foreground">{comment.author}</span>
                                                  <span className="text-[10px] text-muted-foreground">{comment.role}</span>
                                                  <span className="text-[10px] text-muted-foreground/50">•</span>
                                                  <span className="text-[10px] text-muted-foreground">{comment.timestamp}</span>
                                                  {comment.status && (
                                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getStatusBadgeColor(comment.status)}`}>
                                                      {comment.status}
                                                    </Badge>
                                                  )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-2">{comment.content}</p>
                                                <div className="flex items-center gap-3">
                                                  <button 
                                                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                                    className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                                                  >
                                                    <Reply className="w-3 h-3" />
                                                    Reply
                                                  </button>
                                                  <button className="text-[10px] text-muted-foreground hover:text-emerald-500 flex items-center gap-1 transition-colors">
                                                    <ThumbsUp className="w-3 h-3" />
                                                    Agree
                                                  </button>
                                                  <button className="text-[10px] text-muted-foreground hover:text-amber-500 flex items-center gap-1 transition-colors">
                                                    <ThumbsDown className="w-3 h-3" />
                                                    Negotiate
                                                  </button>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Replies */}
                                            {comment.replies && comment.replies.length > 0 && (
                                              <div className="ml-9">
                                                <button
                                                  onClick={() => toggleThread(comment.id)}
                                                  className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 mb-2 transition-colors"
                                                >
                                                  {expandedThreads.has(comment.id) ? (
                                                    <ChevronUp className="w-3 h-3" />
                                                  ) : (
                                                    <ChevronDown className="w-3 h-3" />
                                                  )}
                                                  {expandedThreads.has(comment.id) ? "Hide" : "Show"} {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
                                                </button>
                                                
                                                <AnimatePresence>
                                                  {expandedThreads.has(comment.id) && (
                                                    <motion.div
                                                      initial={{ opacity: 0, height: 0 }}
                                                      animate={{ opacity: 1, height: "auto" }}
                                                      exit={{ opacity: 0, height: 0 }}
                                                      className="space-y-2 border-l-2 border-border pl-3"
                                                    >
                                                      {comment.replies.map((reply) => (
                                                        <div key={reply.id} className="flex gap-2">
                                                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                                            <span className="text-[9px] font-medium text-muted-foreground">{reply.avatar}</span>
                                                          </div>
                                                          <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                              <span className="text-[10px] font-medium text-foreground">{reply.author}</span>
                                                              <span className="text-[9px] text-muted-foreground">{reply.timestamp}</span>
                                                              {reply.status && (
                                                                <Badge variant="outline" className={`text-[9px] px-1 py-0 ${getStatusBadgeColor(reply.status)}`}>
                                                                  {reply.status}
                                                                </Badge>
                                                              )}
                                                            </div>
                                                            <p className="text-[11px] text-muted-foreground">{reply.content}</p>
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </motion.div>
                                                  )}
                                                </AnimatePresence>
                                              </div>
                                            )}

                                            {/* Reply Input */}
                                            <AnimatePresence>
                                              {replyingTo === comment.id && (
                                                <motion.div
                                                  initial={{ opacity: 0, height: 0 }}
                                                  animate={{ opacity: 1, height: "auto" }}
                                                  exit={{ opacity: 0, height: 0 }}
                                                  className="ml-9 mt-2"
                                                >
                                                  <div className="flex gap-2">
                                                    <input
                                                      type="text"
                                                      value={replyText}
                                                      onChange={(e) => setReplyText(e.target.value)}
                                                      placeholder="Write a reply..."
                                                      className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                                      onKeyDown={(e) => {
                                                        if (e.key === "Enter" && !e.shiftKey) {
                                                          e.preventDefault();
                                                          handleAddReply(clause.id, comment.id);
                                                        }
                                                      }}
                                                    />
                                                    <Button 
                                                      size="sm" 
                                                      onClick={() => handleAddReply(clause.id, comment.id)}
                                                      className="bg-primary hover:bg-primary/90 h-7 px-2"
                                                    >
                                                      <Send className="w-3 h-3" />
                                                    </Button>
                                                  </div>
                                                </motion.div>
                                              )}
                                            </AnimatePresence>
                                          </div>
                                        ))
                                      )}
                                    </div>

                                    {/* Add Comment Input */}
                                    <div className="flex gap-2 pt-3 border-t border-border">
                                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                        <span className="text-[10px] font-medium text-secondary-foreground">YO</span>
                                      </div>
                                      <div className="flex-1 flex gap-2">
                                        <input
                                          type="text"
                                          value={newComment}
                                          onChange={(e) => setNewComment(e.target.value)}
                                          placeholder="Add a comment..."
                                          className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                              e.preventDefault();
                                              handleAddComment(clause.id);
                                            }
                                          }}
                                        />
                                        <Button 
                                          size="sm" 
                                          onClick={() => handleAddComment(clause.id)}
                                          className="bg-primary hover:bg-primary/90"
                                        >
                                          <Send className="w-3 h-3 mr-1" />
                                          Post
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}

                  {activeTab === "stakeholders" && (
                    <motion.div
                      key="stakeholders"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid grid-cols-2 gap-4"
                    >
                      {/* Principal Side */}
                      <div className="bg-muted/50 rounded-xl p-4 border border-border">
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">Principal (Buyer)</span>
                        </div>
                        <div className="space-y-2">
                          {STAKEHOLDERS.principal.map((s, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <s.icon className="w-3 h-3 text-muted-foreground/60" />
                              {s.role}
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Contractor Side */}
                      <div className="bg-muted/50 rounded-xl p-4 border border-border">
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 className="w-4 h-4 text-secondary" />
                          <span className="text-sm font-medium text-foreground">Contractor (Supplier)</span>
                        </div>
                        <div className="space-y-2">
                          {STAKEHOLDERS.contractor.map((s, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <s.icon className="w-3 h-3 text-muted-foreground/60" />
                              {s.role}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "copilot" && (
                    <motion.div
                      key="copilot"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-muted/50 rounded-xl p-4 border border-border"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4 text-warning" />
                        <span className="text-sm font-medium text-foreground">AI Summary</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <p className="text-2xl font-bold text-foreground">142</p>
                          <p className="text-xs text-muted-foreground">Clauses</p>
                        </div>
                        <div className="text-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                          <p className="text-2xl font-bold text-destructive">3</p>
                          <p className="text-xs text-muted-foreground">High Risk</p>
                        </div>
                        <div className="text-center p-3 bg-warning/10 rounded-lg border border-warning/20">
                          <p className="text-2xl font-bold text-warning">5</p>
                          <p className="text-xs text-muted-foreground">Review Needed</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This contract contains non-standard payment terms and is missing a variation clause. 
                        Legal review recommended before signing.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Panel - Copilot Assistant */}
        <div className="w-full md:w-[300px] flex-shrink-0 flex flex-col bg-muted/20">
          {/* Copilot Header */}
          <div className="px-3 py-2 border-b border-border flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-xs font-medium text-foreground">Contract Copilot</span>
            <Sparkles className="w-3 h-3 text-primary ml-auto" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scroll-smooth max-h-[250px] md:max-h-none">
            <AnimatePresence mode="popLayout">
              {copilotMessages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`${
                    msg.type === "system" 
                      ? "text-center" 
                      : ""
                  }`}
                >
                  {msg.type === "system" && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-xs text-muted-foreground">
                      <FileText className="w-3 h-3" />
                      {msg.content}
                    </div>
                  )}
                  
                  {msg.type === "ai" && (
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-3 h-3 text-primary" />
                      </div>
                      <div className="bg-muted/50 rounded-xl rounded-tl-sm px-3 py-2">
                        <DemoMarkdown content={msg.content} className="text-sm" />
                      </div>
                    </div>
                  )}
                  
                  {msg.type === "suggestion" && (
                    <div className={`ml-8 p-3 rounded-xl border ${
                      msg.severity === "high" 
                        ? "bg-destructive/10 border-destructive/30" 
                        : "bg-warning/10 border-warning/30"
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className={`w-3 h-3 ${
                          msg.severity === "high" ? "text-destructive" : "text-warning"
                        }`} />
                        <span className={`text-xs font-medium ${
                          msg.severity === "high" ? "text-destructive" : "text-warning"
                        }`}>
                          {msg.title}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{msg.content}</p>
                    </div>
                  )}
                  
                  {msg.type === "action" && (
                    <div className="ml-8 p-3 rounded-xl bg-secondary/10 border border-secondary/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-3 h-3 text-secondary" />
                        <span className="text-xs font-medium text-secondary">{msg.title}</span>
                      </div>
                      <div className="space-y-1.5">
                        {msg.items?.map((item, i) => (
                          <button
                            key={i}
                            className="w-full flex items-center gap-2 px-2 py-1.5 bg-muted/50 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors text-left"
                            onClick={() => toast.info("Demo Mode", { description: `In production, this would execute: "${item}"` })}
                          >
                            <CheckSquare className="w-3 h-3 text-secondary" />
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-muted/50 rounded-xl rounded-tl-sm px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* User conversation with AI */}
            {userMessages.map((msg, idx) => (
              <motion.div
                key={`user-msg-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-sm" 
                    : "bg-muted/50 rounded-tl-sm"
                }`}>
                  {msg.role === "assistant" ? (
                    <DemoMarkdown content={msg.content} className="text-sm" />
                  ) : (
                    <span className="text-sm">{msg.content}</span>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Users className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}

            {isAskingQuestion && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-muted/50 rounded-xl rounded-tl-sm px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
                placeholder="Ask about contract..."
                className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                disabled={isAskingQuestion}
              />
              <Button 
                size="icon" 
                className="h-8 w-8 bg-primary hover:bg-primary/90 disabled:opacity-50"
                onClick={() => handleAskQuestion()}
                disabled={isAskingQuestion || !userQuestion.trim()}
              >
                {isAskingQuestion ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              <button 
                className="text-[10px] text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                onClick={() => handleAskQuestion("What are the main risks in this contract?")}
                disabled={isAskingQuestion}
              >
                Risks
              </button>
              <span className="text-muted-foreground/50">•</span>
              <button 
                className="text-[10px] text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                onClick={() => handleAskQuestion("How does this contract compare to standard AS4000 terms?")}
                disabled={isAskingQuestion}
              >
                Compare
              </button>
              <span className="text-muted-foreground/50">•</span>
              <button 
                className="text-[10px] text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                onClick={() => handleAskQuestion("Draft a negotiation response for the payment terms issue")}
                disabled={isAskingQuestion}
              >
                Draft
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Integrations */}
      <div className="border-t border-border px-3 py-2 bg-muted/30">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
            <span className="text-[10px] text-muted-foreground flex-shrink-0">Integrations:</span>
            <div className="flex items-center gap-1">
              {["Gmail", "Dropbox", "DocuSign"].map(name => (
                <Badge key={name} variant="outline" className="text-[9px] px-1.5 py-0 border-border text-muted-foreground">
                  {name}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 px-2 text-muted-foreground hover:text-foreground text-xs"
              onClick={() => toast.info("Demo Mode", { description: "In production, this would open sharing options." })}
            >
              <Share2 className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button 
              size="sm" 
              className="h-7 px-2 bg-primary hover:bg-primary/90 text-xs"
              onClick={() => toast.info("Demo Mode", { description: "In production, this would assign the review." })}
            >
              <Mail className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Assign</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractReviewDemo;
