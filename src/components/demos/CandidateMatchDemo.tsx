import { useState, useEffect, useRef, useCallback } from "react";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import {
  Users,
  Briefcase,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Building2,
  Sparkles,
  Bot,
  Target,
  Shield,
  Globe,
  MessageSquare,
  Mail,
  Award,
  Star,
  ChevronRight,
  Play,
  RefreshCw,
  Zap,
  AlertTriangle,
  UserCheck,
  Plane,
  FileCheck,
  TrendingUp,
  Filter,
  ThumbsUp,
  ThumbsDown,
  Send,
  Calendar,
  MapPin,
  DollarSign,
  GraduationCap,
  Languages,
  BadgeCheck,
  CircleAlert,
  Eye,
  UserPlus
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
  icon: typeof Users;
  description: string;
  details: string[];
  color: string;
};

const workflowSteps: WorkflowStep[] = [
  {
    id: "job-intake",
    step: "1",
    title: "Job Intake & Analysis",
    icon: Briefcase,
    description: "New role added, AI interprets requirements",
    details: [
      "Parse job from email, CRM, or job board",
      "Extract skills, experience, certifications",
      "Clarify ambiguous requirements"
    ],
    color: "from-blue-500/20 to-cyan-500/10"
  },
  {
    id: "candidate-scan",
    step: "2",
    title: "Candidate Pool Scan",
    icon: Search,
    description: "Instantly scan active, past, and potential candidates",
    details: [
      "Check active candidate database",
      "Review historical candidates",
      "Identify 'almost suitable' matches"
    ],
    color: "from-purple-500/20 to-violet-500/10"
  },
  {
    id: "cv-parsing",
    step: "3",
    title: "CV & Profile Parsing",
    icon: FileText,
    description: "Extract structured data from unstructured CVs",
    details: [
      "Parse PDF, Word, LinkedIn exports",
      "Extract skills, work history, qualifications",
      "No reformatting required"
    ],
    color: "from-emerald-500/20 to-green-500/10"
  },
  {
    id: "migration-check",
    step: "4",
    title: "Migration Eligibility Check",
    icon: Plane,
    description: "Assess visa status and sponsorship needs",
    details: [
      "Check visa type and expiry",
      "Assess sponsorship eligibility",
      "Flag occupation alignment issues"
    ],
    color: "from-orange-500/20 to-amber-500/10"
  },
  {
    id: "matchmaking",
    step: "5",
    title: "AI Matchmaking & Ranking",
    icon: Target,
    description: "Score candidates on fit + migration reality",
    details: [
      "Skill match scoring",
      "Experience relevance analysis",
      "Visa suitability weighting"
    ],
    color: "from-pink-500/20 to-rose-500/10"
  },
  {
    id: "explanation",
    step: "6",
    title: "Match Explanation",
    icon: MessageSquare,
    description: "Clear reasons for each ranking decision",
    details: [
      "Why they fit the role",
      "What's missing or risky",
      "Migration constraints impact"
    ],
    color: "from-indigo-500/20 to-blue-500/10"
  },
  {
    id: "review",
    step: "7",
    title: "Recruiter Review",
    icon: UserCheck,
    description: "Human-in-the-loop validation and adjustment",
    details: [
      "Review top candidates first",
      "Adjust preferences if needed",
      "AI supports, doesn't replace judgment"
    ],
    color: "from-teal-500/20 to-cyan-500/10"
  },
  {
    id: "shortlist",
    step: "8",
    title: "Shortlist & Action",
    icon: Send,
    description: "Generate employer shortlist with one click",
    details: [
      "Generate professional shortlist",
      "Trigger interview outreach",
      "Flag visa consultation needs"
    ],
    color: "from-yellow-500/20 to-orange-500/10"
  }
];

type Candidate = {
  id: string;
  name: string;
  currentRole: string;
  location: string;
  experience: string;
  skills: string[];
  visaStatus: string;
  visaExpiry?: string;
  sponsorshipNeeded: boolean;
  englishLevel: string;
  qualifications: string[];
  overallScore: number;
  skillMatch: number;
  experienceMatch: number;
  migrationFit: number;
  strengths: string[];
  concerns: string[];
  recommendation: "strong" | "good" | "consider" | "risky";
};

const mockCandidates: Candidate[] = [
  {
    id: "1",
    name: "Jane Smith",
    currentRole: "Senior Software Engineer",
    location: "Capital Region, NSW",
    experience: "7 years",
    skills: ["Python", "AWS", "Machine Learning", "Django", "PostgreSQL"],
    visaStatus: "Skilled Worker (482)",
    visaExpiry: "Dec 2025",
    sponsorshipNeeded: false,
    englishLevel: "Native",
    qualifications: ["BSc Computer Science", "AWS Solutions Architect"],
    overallScore: 94,
    skillMatch: 96,
    experienceMatch: 92,
    migrationFit: 95,
    strengths: [
      "Direct skill match on all required technologies",
      "7 years experience exceeds 5-year requirement",
      "Current visa allows immediate start",
      "Located in Sydney (no relocation needed)"
    ],
    concerns: [
      "Visa expires Dec 2025 - pathway planning recommended"
    ],
    recommendation: "strong"
  },
  {
    id: "2",
    name: "James Wilson",
    currentRole: "Full Stack Developer",
    location: "Southern Region, VIC",
    experience: "5 years",
    skills: ["JavaScript", "React", "Node.js", "Python", "AWS"],
    visaStatus: "Permanent Resident",
    sponsorshipNeeded: false,
    englishLevel: "Fluent",
    qualifications: ["BSc Information Technology"],
    overallScore: 87,
    skillMatch: 82,
    experienceMatch: 88,
    migrationFit: 100,
    strengths: [
      "PR status - no sponsorship or visa constraints",
      "Strong JavaScript/React (primary stack match)",
      "AWS experience aligns with cloud requirements"
    ],
    concerns: [
      "Python listed but not as primary skill",
      "Would need relocation from Melbourne"
    ],
    recommendation: "good"
  },
  {
    id: "3",
    name: "Priya Sharma",
    currentRole: "Data Engineer",
    location: "Northern Region, QLD",
    experience: "4 years",
    skills: ["Python", "SQL", "Spark", "AWS", "Airflow"],
    visaStatus: "Student (500)",
    visaExpiry: "Mar 2025",
    sponsorshipNeeded: true,
    englishLevel: "Proficient (IELTS 7.5)",
    qualifications: ["MSc Data Science", "AWS Data Analytics"],
    overallScore: 72,
    skillMatch: 85,
    experienceMatch: 68,
    migrationFit: 58,
    strengths: [
      "Strong Python and AWS skills",
      "Masters in Data Science (relevant qualification)",
      "High English proficiency"
    ],
    concerns: [
      "Student visa expiring Mar 2025 - requires sponsorship",
      "4 years experience (below 5-year preference)",
      "Sponsorship application timing is tight"
    ],
    recommendation: "consider"
  },
  {
    id: "4",
    name: "Michael Torres",
    currentRole: "Backend Developer",
    location: "Western Region, WA",
    experience: "6 years",
    skills: ["Java", "Spring Boot", "MySQL", "Docker"],
    visaStatus: "Working Holiday (417)",
    visaExpiry: "Feb 2025",
    sponsorshipNeeded: true,
    englishLevel: "Fluent",
    qualifications: ["BSc Software Engineering"],
    overallScore: 45,
    skillMatch: 42,
    experienceMatch: 75,
    migrationFit: 28,
    strengths: [
      "6 years backend experience",
      "Strong engineering background"
    ],
    concerns: [
      "Primary stack is Java - role requires Python/Django",
      "Working Holiday visa expiring soon",
      "Occupation may not align for 482 sponsorship",
      "Significant upskilling required for role fit"
    ],
    recommendation: "risky"
  }
];

type JobRole = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  urgency: string;
  skills: string[];
  experience: string;
  sponsorshipOpen: boolean;
};

const mockJob: JobRole = {
  id: "JOB-2024-0156",
  title: "Senior Python Developer",
  company: "TechVentures",
  location: "Capital Region, NSW",
  salary: "$140,000 - $160,000",
  type: "Full-time, Permanent",
  urgency: "High - Start within 4 weeks",
  skills: ["Python", "Django", "AWS", "PostgreSQL", "REST APIs"],
  experience: "5+ years",
  sponsorshipOpen: true
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  action?: string;
  candidates?: Candidate[];
  job?: JobRole;
  workflowStep?: string;
  stats?: { scanned: number; qualified: number; shortlisted: number };
};

const demoConversation: ChatMessage[] = [
  {
    role: "assistant",
    content: "📧 New Job Alert Received\n\n**TechVentures**\nSenior Python Developer\n\nParsing job requirements and employer preferences...",
    action: "Step 1: Job intake processing",
    workflowStep: "job-intake"
  },
  {
    role: "assistant",
    content: "✅ Job Requirements Analyzed\n\n**Role:** Senior Python Developer\n**Company:** TechVentures\n**Location:** Capital Region, NSW\n**Salary:** $140,000 - $160,000\n\n**Required Skills:**\n• Python (primary)\n• Django framework\n• AWS cloud services\n• PostgreSQL\n• REST API development\n\n**Requirements:**\n• 5+ years experience\n• Immediate start preferred\n• Sponsorship available if needed\n\n🎯 Urgency: High - Start within 4 weeks",
    action: "Job parsed successfully",
    job: mockJob,
    workflowStep: "job-intake"
  },
  {
    role: "user",
    content: "Find matching candidates"
  },
  {
    role: "assistant",
    content: "🔍 Scanning Candidate Database...\n\n**Searching across:**\n• Active candidates (last 90 days)\n• Historical database (2+ years)\n• Flagged 'almost suitable' profiles\n\n**Filters applied:**\n• Python experience\n• 4+ years (allowing near-matches)\n• Australia-based or willing to relocate\n• Visa status: All (sponsorship available)",
    action: "Step 2: Candidate pool scan initiated",
    workflowStep: "candidate-scan",
    stats: { scanned: 847, qualified: 23, shortlisted: 0 }
  },
  {
    role: "assistant",
    content: "📄 Parsing Candidate Profiles...\n\n**Processing:**\n• 23 qualified candidates identified\n• Extracting skills from CVs and LinkedIn\n• Normalizing experience descriptions\n• Mapping qualifications to requirements\n\n✅ 4 high-potential matches found\n⚠️ 8 partial matches (missing 1-2 skills)\n📋 11 candidates need upskilling",
    action: "Step 3: CV parsing complete",
    workflowStep: "cv-parsing"
  },
  {
    role: "assistant",
    content: "🛂 Migration Eligibility Assessment\n\n**Checking for each candidate:**\n• Current visa type and validity\n• Sponsorship pathway eligibility\n• Occupation list alignment (ANZSCO)\n• English proficiency evidence\n• Timing risks (expiry, processing)\n\n**Results Summary:**\n✅ 2 candidates: No visa constraints\n⚠️ 1 candidate: Sponsorship needed but eligible\n🚨 1 candidate: High migration risk",
    action: "Step 4: Migration check complete",
    workflowStep: "migration-check"
  },
  {
    role: "assistant",
    content: "🎯 AI Matchmaking Complete!\n\n**Ranking Methodology:**\n• Skill match (40% weight)\n• Experience relevance (30% weight)\n• Migration fit (30% weight)\n\n**Top 4 Candidates Ranked:**",
    action: "Step 5: Candidates ranked",
    candidates: mockCandidates,
    workflowStep: "matchmaking"
  },
  {
    role: "user",
    content: "Show me why Jane Smith is the top match"
  },
  {
    role: "assistant",
    content: "📊 Match Explanation: Jane Smith\n\n**Overall Score: 94/100** ⭐ Strong Match\n\n**Why She Fits:**\n✅ Direct skill match on ALL required technologies\n   • Python (7 years) • Django • AWS • PostgreSQL\n✅ 7 years experience exceeds 5-year requirement\n✅ Current 482 visa allows immediate start\n✅ Already in Sydney - no relocation needed\n✅ Native English speaker\n\n**Considerations:**\n⚠️ Visa expires Dec 2025\n   → Recommend discussing PR pathway during placement\n\n**Recruiter Insight:**\nJane is a near-perfect technical and migration fit. The only action item is visa pathway planning, which can be positioned as a value-add to both candidate and employer.",
    action: "Step 6: Match explained",
    workflowStep: "explanation"
  },
  {
    role: "user",
    content: "What about Priya Sharma - is she worth considering?"
  },
  {
    role: "assistant",
    content: "📊 Match Explanation: Priya Sharma\n\n**Overall Score: 72/100** ⚡ Consider with Caution\n\n**Why She Could Fit:**\n✅ Strong Python and AWS skills\n✅ Masters in Data Science (relevant qualification)\n✅ High English proficiency (IELTS 7.5)\n✅ Enthusiastic about permanent role\n\n**Migration Reality Check:**\n🚨 Student visa (500) expiring March 2025\n🚨 Requires employer sponsorship (482)\n🚨 Sponsorship processing: 2-3 months typical\n⚠️ Timeline is TIGHT for 4-week start requirement\n\n**Experience Gap:**\n• 4 years vs. 5-year preference\n• Data Engineering focus, not pure development\n\n**Recruiter Decision Point:**\nIf employer is flexible on start date AND willing to sponsor, Priya is a viable option. Otherwise, prioritize Jane or James who can start immediately.",
    action: "Migration risk flagged",
    workflowStep: "explanation"
  },
  {
    role: "user",
    content: "I want to proceed with Jane and James"
  },
  {
    role: "assistant",
    content: "✅ Recruiter Selection Confirmed\n\n**Shortlist Updated:**\n1. Jane Smith - 94/100 ⭐\n2. James Wilson - 87/100 ✓\n\n**Review Notes Added:**\n• Jane: Primary recommendation, immediate availability\n• James: Strong backup, relocation discussion needed\n\n**Excluded with Reason:**\n• Priya Sharma: Timeline risk (visa expiry)\n• Michael Torres: Skill mismatch + visa risk\n\n🎯 Human judgment applied - AI ranking adjusted",
    action: "Step 7: Review complete",
    workflowStep: "review"
  },
  {
    role: "user",
    content: "Generate shortlist for the employer"
  },
  {
    role: "assistant",
    content: "📋 Employer Shortlist Generated!\n\n**TechVentures - Senior Python Developer**\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**Candidate 1: Jane Smith** ⭐ Recommended\n• Current: Senior Software Engineer\n• Experience: 7 years Python/Django/AWS\n• Visa: 482 Skilled Worker (valid)\n• Availability: Immediate\n• Fit Score: 94%\n\n**Candidate 2: James Wilson**\n• Current: Full Stack Developer  \n• Experience: 5 years Python/JavaScript/AWS\n• Visa: Permanent Resident\n• Availability: 2 weeks notice\n• Fit Score: 87%\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**Actions Triggered:**\n📧 Shortlist email drafted for employer\n📅 Interview slots requested from candidates\n📋 Visa summary attached for HR reference",
    action: "Step 8: Shortlist ready!",
    workflowStep: "shortlist",
    stats: { scanned: 847, qualified: 23, shortlisted: 2 }
  },
  {
    role: "assistant",
    content: "🎉 Workflow Complete!\n\n**Summary:**\n• 847 candidates scanned in seconds\n• 23 qualified matches identified\n• 2 candidates shortlisted with confidence\n• Migration risks pre-screened\n• Employer shortlist ready to send\n\n**Time Saved:**\n⏱️ Traditional process: 4-6 hours\n⚡ With AI: Under 5 minutes\n\n**Business Impact:**\n• 50-70% faster shortlisting\n• Zero candidates missed\n• Visa risks caught early\n• Employer confidence increased",
    action: "Workflow complete!",
    workflowStep: "shortlist"
  }
];

export default function CandidateMatchDemo() {
  const { applySpeed } = useDemoSpeed();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"demo" | "workflow" | "candidates">("demo");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [scanStats, setScanStats] = useState({ scanned: 0, qualified: 0, shortlisted: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { setDemoActive } = useChatContext();

  // Track demo active state
  const isDemoRunning = messages.length > 0;
  
  useEffect(() => {
    setDemoActive(isDemoRunning);
    return () => setDemoActive(false);
  }, [isDemoRunning, setDemoActive]);

  const tabOrder: ("demo" | "workflow" | "candidates")[] = ["demo", "candidates", "workflow"];
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
    msgs.forEach(msg => {
      if (msg.workflowStep) {
        completedIds.add(msg.workflowStep);
      }
      if (msg.stats) {
        setScanStats(msg.stats);
      }
    });
    setCompletedSteps(Array.from(completedIds));
    setProgress(Math.min(Math.round((completedIds.size / workflowSteps.length) * 100), 100));
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
        }, 800);
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
    setScanStats({ scanned: 0, qualified: 0, shortlisted: 0 });
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const firstMsg = demoConversation[0];
        setMessages([firstMsg]);
        updateCompletedSteps([firstMsg]);
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
    setScanStats({ scanned: 0, qualified: 0, shortlisted: 0 });
    setSelectedCandidate(null);
  };

  const getNextPrompt = () => {
    if (demoIndex >= demoConversation.length) return null;
    const next = demoConversation[demoIndex];
    return next.role === "user" ? next.content : null;
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "strong": return "bg-emerald-500";
      case "good": return "bg-blue-500";
      case "consider": return "bg-amber-500";
      case "risky": return "bg-red-500";
      default: return "bg-slate-500";
    }
  };

  const getRecommendationLabel = (rec: string) => {
    switch (rec) {
      case "strong": return "Strong Match";
      case "good": return "Good Match";
      case "consider": return "Consider";
      case "risky": return "High Risk";
      default: return "Unknown";
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-bold text-sm sm:text-lg truncate">AI Candidate Matchmaker</h3>
                <p className="text-white/80 text-xs sm:text-sm hidden sm:block">Recruitment + Migration Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              {scanStats.scanned > 0 && (
                <div className="flex items-center gap-1 sm:gap-4 text-[10px] sm:text-sm">
                  <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
                    <span className="text-white font-semibold">{scanStats.scanned}</span>
                    <span className="text-white/70 hidden sm:inline"> scanned</span>
                  </div>
                  <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-sm">
                    <span className="text-emerald-300 font-semibold">{scanStats.qualified}</span>
                    <span className="text-emerald-300/70 hidden sm:inline"> qualified</span>
                  </div>
                  {scanStats.shortlisted > 0 && (
                    <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-blue-500/20 backdrop-blur-sm hidden sm:block">
                      <span className="text-blue-300 font-semibold">{scanStats.shortlisted}</span>
                      <span className="text-blue-300/70"> shortlisted</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab("demo")}
            className={cn(
              "flex-1 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors",
              activeTab === "demo" 
                ? "text-white bg-slate-800 border-b-2 border-blue-500" 
                : "text-slate-400 hover:text-white"
            )}
          >
            <Bot className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
            Demo
          </button>
          <button
            onClick={() => setActiveTab("candidates")}
            className={cn(
              "flex-1 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors",
              activeTab === "candidates" 
                ? "text-white bg-slate-800 border-b-2 border-blue-500" 
                : "text-slate-400 hover:text-white"
            )}
          >
            <Users className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Candidate </span>Rankings
          </button>
          <button
            onClick={() => setActiveTab("workflow")}
            className={cn(
              "flex-1 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors",
              activeTab === "workflow" 
                ? "text-white bg-slate-800 border-b-2 border-blue-500" 
                : "text-slate-400 hover:text-white"
            )}
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Work</span>flow
          </button>
        </div>

        {activeTab === "workflow" ? (
          <div 
            className="p-3 sm:p-6 space-y-3 sm:space-y-4"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="text-center mb-4 sm:mb-6">
              <h4 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2">8-Step Matchmaking Workflow</h4>
              <p className="text-slate-400 text-xs sm:text-base">From job intake to employer shortlist, fully automated</p>
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
                        ? "bg-blue-500/20 border-blue-500/50"
                        : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                    )}
                    onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        isCompleted ? "bg-blue-500" : "bg-slate-700"
                      )}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        ) : (
                          <Icon className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-blue-400 font-medium">Step {step.step}</span>
                        <h5 className="text-white font-medium text-sm">{step.title}</h5>
                        <p className="text-slate-400 text-xs mt-1">{step.description}</p>
                        
                        <AnimatePresence>
                          {expandedStep === step.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-3 pt-3 border-t border-slate-700"
                            >
                              <ul className="space-y-1">
                                {step.details.map((detail, i) => (
                                  <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                                    <ChevronRight className="w-3 h-3 text-blue-400" />
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
          </div>
        ) : activeTab === "candidates" ? (
          <div 
            className="p-6"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-white mb-2">Candidate Rankings</h4>
              <p className="text-slate-400 text-sm">Click on a candidate to see detailed match explanation</p>
            </div>
            
            {messages.some(m => m.candidates) ? (
              <div className="space-y-3">
                {mockCandidates.map((candidate, index) => (
                  <motion.div
                    key={candidate.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedCandidate(selectedCandidate?.id === candidate.id ? null : candidate)}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all",
                      selectedCandidate?.id === candidate.id
                        ? "bg-blue-500/20 border-blue-500"
                        : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Rank Badge */}
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">#{index + 1}</span>
                      </div>
                      
                      {/* Candidate Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="text-white font-semibold">{candidate.name}</h5>
                          <Badge className={cn("text-white text-[10px]", getRecommendationColor(candidate.recommendation))}>
                            {getRecommendationLabel(candidate.recommendation)}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">{candidate.currentRole}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {candidate.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> {candidate.experience}
                          </span>
                          <span className="flex items-center gap-1">
                            <Plane className="w-3 h-3" /> {candidate.visaStatus}
                          </span>
                        </div>
                      </div>
                      
                      {/* Score */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold text-white tabular-nums">{candidate.overallScore}</div>
                        <div className="text-xs text-slate-400">Overall Score</div>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    <AnimatePresence>
                      {selectedCandidate?.id === candidate.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 pt-4 border-t border-slate-700"
                        >
                          {/* Score Breakdown */}
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="p-3 bg-slate-700/50 rounded-lg text-center">
                              <div className="text-lg font-bold text-blue-400">{candidate.skillMatch}%</div>
                              <div className="text-xs text-slate-400">Skill Match</div>
                            </div>
                            <div className="p-3 bg-slate-700/50 rounded-lg text-center">
                              <div className="text-lg font-bold text-emerald-400">{candidate.experienceMatch}%</div>
                              <div className="text-xs text-slate-400">Experience</div>
                            </div>
                            <div className="p-3 bg-slate-700/50 rounded-lg text-center">
                              <div className="text-lg font-bold text-purple-400">{candidate.migrationFit}%</div>
                              <div className="text-xs text-slate-400">Migration Fit</div>
                            </div>
                          </div>
                          
                          {/* Skills */}
                          <div className="mb-4">
                            <p className="text-xs text-slate-400 mb-2">Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {candidate.skills.map((skill, i) => (
                                <Badge key={i} variant="outline" className="text-xs border-slate-600 text-slate-300">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          {/* Strengths & Concerns */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-emerald-400 font-medium mb-2 flex items-center gap-1">
                                <ThumbsUp className="w-3 h-3" /> Strengths
                              </p>
                              <ul className="space-y-1">
                                {candidate.strengths.map((s, i) => (
                                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs text-amber-400 font-medium mb-2 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Concerns
                              </p>
                              <ul className="space-y-1">
                                {candidate.concerns.map((c, i) => (
                                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                    <CircleAlert className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                                    {c}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Start the demo to see candidate rankings</p>
                <Button onClick={() => { startDemo(); setActiveTab("demo"); }} className="mt-4 bg-blue-600 hover:bg-blue-700 glow-pulse animate-pulse">
                  <Play className="w-4 h-4 mr-2" />
                  Start Demo
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Demo View */
          <div 
            className="flex flex-col h-[650px]"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-8">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                  <h4 className="text-white font-semibold text-lg mb-2">AI Candidate Matchmaker</h4>
                  <p className="text-slate-400 text-sm mb-6 max-w-lg">
                    Experience instant candidate matching that combines recruitment suitability with migration reality. 
                    Find the right candidate in seconds, not hours.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    <Badge className="bg-blue-500/20 text-blue-300">CV Parsing</Badge>
                    <Badge className="bg-blue-500/20 text-blue-300">Visa Eligibility</Badge>
                    <Badge className="bg-blue-500/20 text-blue-300">AI Ranking</Badge>
                    <Badge className="bg-blue-500/20 text-blue-300">Migration Aware</Badge>
                    <Badge className="bg-blue-500/20 text-blue-300">50-70% Faster</Badge>
                  </div>
                  <Button onClick={startDemo} className="bg-blue-600 hover:bg-blue-700 glow-pulse animate-pulse">
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
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 border border-slate-700"
                      )}>
                        {msg.action && (
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-600">
                            <Zap className="w-3 h-3 text-blue-400" />
                            <span className="text-xs text-blue-400">{msg.action}</span>
                          </div>
                        )}
                        {msg.role === "assistant" ? (
                          <DemoMarkdown content={msg.content} lightText />
                        ) : (
                          <div className="text-sm whitespace-pre-wrap text-white">
                            {msg.content}
                          </div>
                        )}
                        
                        {/* Inline Candidate Cards */}
                        {msg.candidates && (
                          <div className="mt-3 pt-3 border-t border-slate-600 space-y-2">
                            {msg.candidates.map((c, i) => (
                              <div key={c.id} className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-lg">
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold",
                                  getRecommendationColor(c.recommendation)
                                )}>
                                  {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-medium">{c.name}</p>
                                  <p className="text-slate-400 text-xs">{c.visaStatus}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-white font-bold">{c.overallScore}</p>
                                  <p className="text-[10px] text-slate-400">{getRecommendationLabel(c.recommendation)}</p>
                                </div>
                              </div>
                            ))}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full mt-2 border-slate-600 text-slate-300 hover:bg-slate-700"
                              onClick={() => setActiveTab("candidates")}
                            >
                              <Eye className="w-3 h-3 mr-2" />
                              View Full Rankings
                            </Button>
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
                      <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
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
              <div className="border-t border-slate-700 p-4 bg-slate-800/50">
                {demoIndex < demoConversation.length ? (
                  <div className="flex items-center gap-2 sm:gap-3">
                    {getNextPrompt() ? (
                      <Button
                        onClick={simulateNextMessage}
                        className="flex-1 min-w-0 bg-blue-600 hover:bg-blue-700 justify-start text-xs sm:text-sm px-2 sm:px-4 overflow-hidden"
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
                      <p className="text-slate-400 text-sm">Full matchmaking workflow demonstrated</p>
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
        )}

        {/* Footer */}
        <div className="bg-slate-800/50 px-3 sm:px-6 py-2 sm:py-3 border-t border-slate-700">
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Shield className="w-3 h-3 shrink-0" /> 
                <span className="hidden sm:inline">Migration </span>Compliant
              </span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Plane className="w-3 h-3 shrink-0" /> 
                Visa<span className="hidden sm:inline">-Aware Matching</span>
              </span>
              <span className="flex items-center gap-1 whitespace-nowrap hidden sm:flex">
                <TrendingUp className="w-3 h-3" /> 50-70% Faster
              </span>
            </div>
            <span className="whitespace-nowrap shrink-0">Powered by alfred ai</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}