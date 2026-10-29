import { useState, useEffect, useRef, useCallback } from "react";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { motion, PanInfo } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import {
  Target,
  UserPlus,
  Sparkles,
  TrendingUp,
  LayoutGrid,
  Lightbulb,
  FileText,
  LineChart,
  Trophy,
  Play,
  Pause,
  RotateCcw,
  Mail,
  Phone,
  Linkedin,
  Building2,
  MapPin,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  BarChart3,
  Zap,
  ChevronLeft,
  ChevronRight,
  Hand,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FingerClickIndicator from "@/components/demos/shared/FingerClickIndicator";
import { InlineDemoSpeedControl } from "@/components/demos/shared/InlineDemoSpeedControl";

interface CRMStep {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  duration: number;
  clickPrompt?: string;
}

interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  size: string;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  score: number;
  scoreFactors: { factor: string; impact: number; positive: boolean }[];
  signals: string[];
  status: "new" | "enriching" | "qualified" | "contacted";
}

interface PipelineDeal {
  id: string;
  name: string;
  company: string;
  value: number;
  daysInStage: number;
  stage: string;
}

const CRM_STEPS: CRMStep[] = [
  { id: "capture", title: "Lead Capture", icon: UserPlus, description: "New lead from web form", duration: 5000, clickPrompt: "Tap to analyze lead" },
  { id: "enrich", title: "AI Enrichment", icon: Sparkles, description: "Auto-populating company data", duration: 5500, clickPrompt: "Tap to enrich data" },
  { id: "score", title: "Lead Scoring", icon: TrendingUp, description: "Calculating win probability", duration: 5000, clickPrompt: "Tap to score lead" },
  { id: "pipeline", title: "Pipeline View", icon: LayoutGrid, description: "Kanban with deal health", duration: 5000, clickPrompt: "Tap to view pipeline" },
  { id: "suggest", title: "Activity Suggestions", icon: Lightbulb, description: "AI recommends next actions", duration: 5000, clickPrompt: "Tap for suggestions" },
  { id: "prep", title: "Meeting Prep", icon: FileText, description: "Auto-generated briefing", duration: 4500, clickPrompt: "Tap to prepare" },
  { id: "forecast", title: "Deal Forecast", icon: LineChart, description: "Revenue projection", duration: 5000, clickPrompt: "Tap to forecast" },
  { id: "analysis", title: "Win Analysis", icon: Trophy, description: "Pattern recognition insights", duration: 4000 },
];

const MOCK_LEAD: Lead = {
  id: "lead-001",
  name: "Marcus Chen",
  title: "VP of Operations",
  company: "NexGen Manufacturing",
  industry: "Industrial Manufacturing",
  size: "500-1000 employees",
  location: "Austin, TX",
  email: "m.chen@nexgen.io",
  phone: "+1 (512) 555-0147",
  linkedin: "linkedin.com/in/marcuschen",
  score: 87,
  scoreFactors: [
    { factor: "Company Size Match", impact: 25, positive: true },
    { factor: "Recent Funding ($45M Series C)", impact: 20, positive: true },
    { factor: "Tech Adoption Score", impact: 18, positive: true },
    { factor: "Website Engagement", impact: 14, positive: true },
    { factor: "Industry Fit", impact: 10, positive: true },
  ],
  signals: [
    "Downloaded automation whitepaper",
    "Visited pricing page 3x this week",
    "Company hiring for automation roles",
    "Competitor contract ending Q2",
  ],
  status: "new",
};

const PIPELINE_DEALS: PipelineDeal[] = [
  { id: "d1", name: "Enterprise Suite", company: "GlobalTech", value: 125000, daysInStage: 3, stage: "Discovery" },
  { id: "d2", name: "Platform License", company: "InnovateCo", value: 85000, daysInStage: 12, stage: "Proposal" },
  { id: "d3", name: "Full Stack Deploy", company: "ScaleUp Inc", value: 210000, daysInStage: 45, stage: "Negotiation" },
  { id: "d4", name: "Starter Package", company: "FreshStart", value: 35000, daysInStage: 2, stage: "Qualified" },
];

const ACTIVITY_SUGGESTIONS = [
  { type: "email", action: "Send case study", reason: "Lead downloaded automation whitepaper", priority: "high" },
  { type: "call", action: "Schedule discovery call", reason: "High engagement score, ready for outreach", priority: "high" },
  { type: "linkedin", action: "Connect on LinkedIn", reason: "Build relationship before call", priority: "medium" },
];

const PIPELINE_STAGES = ["Qualified", "Discovery", "Proposal", "Negotiation", "Closed Won"];

const SWIPE_THRESHOLD = 50;

export default function AICRMInsightsDemo() {
  const { applySpeed } = useDemoSpeed();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepProgress, setStepProgress] = useState(0);
  const [lead, setLead] = useState<Lead>({ ...MOCK_LEAD, status: "new" });
  const [enrichedFields, setEnrichedFields] = useState<string[]>([]);
  const [scoreAnimating, setScoreAnimating] = useState(false);
  const [displayedScore, setDisplayedScore] = useState(0);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [showClickPrompt, setShowClickPrompt] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const stepScrollRef = useRef<HTMLDivElement>(null);

  // Scroll active step into view
  useEffect(() => {
    if (stepScrollRef.current) {
      const activeButton = stepScrollRef.current.querySelector('[data-active="true"]');
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentStep]);

  const advanceStep = useCallback(() => {
    if (currentStep < CRM_STEPS.length - 1) {
      const step = CRM_STEPS[currentStep];
      
      // Step-specific actions
      if (step.id === "enrich") {
        setLead(prev => ({ ...prev, status: "enriching" }));
        const fields = ["company", "industry", "size", "location", "linkedin"];
        fields.forEach((field, idx) => {
          setTimeout(() => {
            setEnrichedFields(prev => [...prev, field]);
          }, applySpeed(idx * 300));
        });
      }
      if (step.id === "score") {
        setLead(prev => ({ ...prev, status: "qualified" }));
        setScoreAnimating(true);
        let score = 0;
        const scoreInterval = setInterval(() => {
          score += 3;
          setDisplayedScore(score);
          if (score >= MOCK_LEAD.score) {
            clearInterval(scoreInterval);
            setDisplayedScore(MOCK_LEAD.score);
          }
        }, 25);
      }
      
      setCurrentStep(prev => prev + 1);
      setStepProgress(0);
      setShowClickPrompt(true);
      setSwipeDirection(null);
    }
  }, [currentStep]);

  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setStepProgress(0);
      setShowClickPrompt(true);
      setSwipeDirection(null);
    }
  }, [currentStep]);

  // Autoplay with progress
  useEffect(() => {
    if (!isPlaying) return;

    const step = CRM_STEPS[currentStep];
    if (!step) {
      setIsPlaying(false);
      return;
    }

    // Show click indicator during autoplay
    const showClickIndicator = () => {
      if (contentRef.current && currentStep < CRM_STEPS.length - 1) {
        const rect = contentRef.current.getBoundingClientRect();
        setClickPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
        setTimeout(() => setClickPosition(null), 800);
      }
    };

    const progressInterval = setInterval(() => {
      setStepProgress(prev => {
        if (prev >= 100) return 100;
        return prev + (100 / (applySpeed(step.duration) / 50));
      });
    }, 50);

    const clickIndicatorTimeout = setTimeout(() => {
      showClickIndicator();
    }, applySpeed(step.duration - 800));

    const stepTimeout = setTimeout(() => {
      advanceStep();
    }, applySpeed(step.duration));

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimeout);
      clearTimeout(clickIndicatorTimeout);
    };
  }, [isPlaying, currentStep, advanceStep]);

  // Handle swipe gesture
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      setSwipeDirection("left");
      advanceStep();
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      setSwipeDirection("right");
      goToPrevStep();
    }
  };

  // Handle click to advance
  const handleContentClick = () => {
    if (currentStep < CRM_STEPS.length - 1) {
      setIsPlaying(false);
      setShowClickPrompt(false);
      
      if (contentRef.current) {
        const rect = contentRef.current.getBoundingClientRect();
        setClickPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
        setTimeout(() => setClickPosition(null), 600);
      }
      
      setTimeout(() => {
        advanceStep();
        setIsPlaying(true);
      }, 300);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setStepProgress(0);
    setIsPlaying(true);
    setLead({ ...MOCK_LEAD, status: "new" });
    setEnrichedFields([]);
    setScoreAnimating(false);
    setDisplayedScore(0);
    setShowClickPrompt(true);
    setSwipeDirection(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 40) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 70) return "from-green-500 to-emerald-600";
    if (score >= 40) return "from-amber-500 to-orange-600";
    return "from-red-500 to-rose-600";
  };

  const getDealHealth = (days: number) => {
    if (days <= 7) return { status: "healthy", color: "text-green-500", bg: "bg-green-500/20" };
    if (days <= 21) return { status: "attention", color: "text-amber-500", bg: "bg-amber-500/20" };
    return { status: "at risk", color: "text-red-500", bg: "bg-red-500/20" };
  };

  const currentStepData = CRM_STEPS[currentStep];

  const renderStepContent = () => {
    const step = CRM_STEPS[currentStep];
    if (!step) return null;

    switch (step.id) {
      case "capture":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    <UserPlus className="w-3 h-3 mr-1" />
                    New Lead
                  </Badge>
                  <span className="text-xs text-muted-foreground">Just now</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {lead.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">{lead.title}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{lead.phone}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">Source: Website Contact Form</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">Message: "Interested in automation solutions for our manufacturing line"</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case "enrich":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              AI enriching lead data...
            </div>
            <Card>
              <CardContent className="p-3 sm:p-4 space-y-3">
                {[
                  { field: "company", icon: Building2, label: "Company", value: lead.company },
                  { field: "industry", icon: BarChart3, label: "Industry", value: lead.industry },
                  { field: "size", icon: Users, label: "Size", value: lead.size },
                  { field: "location", icon: MapPin, label: "Location", value: lead.location },
                  { field: "linkedin", icon: Linkedin, label: "LinkedIn", value: "Connected" },
                ].map(({ field, icon: Icon, label, value }) => (
                  <motion.div
                    key={field}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: enrichedFields.includes(field) ? 1 : 0.5 }}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      {enrichedFields.includes(field) ? (
                        <>
                          <span className="text-sm font-medium truncate">{value}</span>
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        </>
                      ) : (
                        <div className="w-20 h-4 bg-muted animate-pulse rounded" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-3">
                <p className="text-xs font-medium mb-2">Signals Detected:</p>
                <div className="space-y-1">
                  {lead.signals.slice(0, 3).map((signal, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.15 }}
                      className="flex items-start gap-2 text-xs"
                    >
                      <Zap className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{signal}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case "score":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Score Gauge */}
            <div className="flex flex-col items-center py-2">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                  <motion.circle
                    cx="64" cy="64" r="56"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8" fill="none" strokeLinecap="round"
                    strokeDasharray={352}
                    initial={{ strokeDashoffset: 352 }}
                    animate={{ strokeDashoffset: 352 - (displayedScore / 100) * 352 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl sm:text-3xl font-bold ${getScoreColor(displayedScore)}`}>
                    {displayedScore}
                  </span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">Lead Score</span>
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lead.scoreFactors.slice(0, 4).map((factor, idx) => (
                  <motion.div
                    key={factor.factor}
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "100%" }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-[10px] sm:text-xs text-muted-foreground flex-1 truncate">
                      {factor.factor}
                    </span>
                    <div className="w-12 sm:w-16 h-2 bg-muted rounded-full overflow-hidden flex-shrink-0">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(factor.impact / 25) * 100}%` }}
                        transition={{ delay: idx * 0.1 + 0.2 }}
                        className={`h-full bg-gradient-to-r ${getScoreGradient(87)}`}
                      />
                    </div>
                    <Badge variant="secondary" className="text-[10px] w-8 justify-center flex-shrink-0">
                      +{factor.impact}
                    </Badge>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        );

      case "pipeline":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              Pipeline view with deal health
            </div>
            
            {/* Mini Kanban - horizontally scrollable */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory">
              {PIPELINE_STAGES.slice(0, 4).map(stage => {
                const stageDeals = PIPELINE_DEALS.filter(d => d.stage === stage);
                return (
                  <div key={stage} className="flex-shrink-0 w-32 sm:w-40 snap-start">
                    <div className="text-xs font-medium mb-2 flex items-center justify-between">
                      <span className="truncate">{stage}</span>
                      <Badge variant="secondary" className="text-[10px]">{stageDeals.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {stageDeals.map(deal => {
                        const health = getDealHealth(deal.daysInStage);
                        return (
                          <Card key={deal.id} className={`border ${health.bg} border-opacity-50`}>
                            <CardContent className="p-2">
                              <p className="text-xs font-medium truncate">{deal.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{deal.company}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs font-medium">${(deal.value / 1000)}K</span>
                                <div className={`flex items-center gap-1 text-[10px] ${health.color}`}>
                                  {deal.daysInStage > 21 && <AlertTriangle className="w-3 h-3" />}
                                  <Clock className="w-3 h-3" />
                                  {deal.daysInStage}d
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <Card className="bg-muted/30">
              <CardContent className="p-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-base sm:text-lg font-bold text-primary tabular-nums">$455K</p>
                  <p className="text-[10px] text-muted-foreground">Pipeline</p>
                </div>
                <div>
                  <p className="text-base sm:text-lg font-bold text-amber-500 tabular-nums">1</p>
                  <p className="text-[10px] text-muted-foreground">At Risk</p>
                </div>
                <div>
                  <p className="text-base sm:text-lg font-bold text-green-500 tabular-nums">68%</p>
                  <p className="text-[10px] text-muted-foreground">Win Rate</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case "suggest":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              AI recommends next actions
            </div>
            {ACTIVITY_SUGGESTIONS.map((suggestion, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.15 }}
              >
                <Card className={`border ${suggestion.priority === "high" ? "border-primary/30 bg-primary/5" : ""}`}>
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      suggestion.type === "email" ? "bg-blue-500/20 text-blue-500" :
                      suggestion.type === "call" ? "bg-green-500/20 text-green-500" :
                      "bg-cyan-500/20 text-cyan-500"
                    }`}>
                      {suggestion.type === "email" ? <Mail className="w-4 h-4" /> :
                       suggestion.type === "call" ? <Phone className="w-4 h-4" /> :
                       <Linkedin className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{suggestion.action}</p>
                        {suggestion.priority === "high" && (
                          <Badge className="text-[10px] bg-primary/20 text-primary">Priority</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{suggestion.reason}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        );

      case "prep":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  AI Meeting Brief
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Lead Overview</p>
                  <p className="text-sm">{lead.name}, {lead.title}</p>
                  <p className="text-xs text-muted-foreground">{lead.company}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Key Talking Points</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Recent $45M Series C funding</li>
                    <li>• Evaluating automation solutions</li>
                    <li>• Competitor contract ending Q2</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Suggested Questions</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>1. What are your automation priorities?</li>
                    <li>2. How is your current solution falling short?</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case "forecast":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-primary" />
                  Q1 2026 Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-28 flex items-end justify-between gap-2 mb-2">
                  {[
                    { month: "Jan", value: 85, projected: 95 },
                    { month: "Feb", value: 92, projected: 110 },
                    { month: "Mar", value: 78, projected: 125 },
                  ].map((bar, idx) => (
                    <div key={bar.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex gap-1 h-20 items-end">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${bar.value}%` }}
                          transition={{ delay: idx * 0.15 }}
                          className="flex-1 bg-primary/40 rounded-t"
                        />
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${bar.projected}%` }}
                          transition={{ delay: idx * 0.15 + 0.1 }}
                          className="flex-1 bg-primary rounded-t"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{bar.month}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-primary/40" />
                    <span className="text-muted-foreground">Committed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-primary" />
                    <span className="text-muted-foreground">Forecast</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-3 grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg sm:text-xl font-bold text-primary tabular-nums">$330K</p>
                  <p className="text-xs text-muted-foreground">Projected Q1</p>
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-bold text-green-500 tabular-nums">+18%</p>
                  <p className="text-xs text-muted-foreground">vs Last Q1</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case "analysis":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Win Pattern Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs font-medium">Top Win Factors</p>
                {[
                  { factor: "Early stakeholder engagement", score: 92 },
                  { factor: "Proof of concept demo", score: 87 },
                  { factor: "ROI documentation", score: 84 },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex-1 truncate">{item.factor}</span>
                    <Progress value={item.score} className="w-16 sm:w-20 h-2" />
                    <span className="text-xs font-medium w-8">{item.score}%</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    <Sparkles className="w-3 h-3 inline mr-1 text-primary" />
                    Deals with early stakeholder engagement close 2.3x faster
                  </p>
                </div>
              </CardContent>
            </Card>
            <div className="text-center py-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2"
              >
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </motion.div>
              <p className="text-sm font-medium">Insights Complete</p>
              <p className="text-xs text-muted-foreground">Lead ready for outreach</p>
              <Button onClick={handleReset} size="sm" className="mt-3 gap-2">
                <RotateCcw className="w-4 h-4" />
                Run Again
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Click indicator for autoplay */}
      <AnimatePresence>
        {clickPosition && (
          <FingerClickIndicator position={clickPosition} label={currentStepData?.clickPrompt || "Tap to continue"} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-sm sm:text-base">AI CRM Insights Engine</h2>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Intelligent lead management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <InlineDemoSpeedControl compact className="hidden sm:flex" />
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1 h-8 px-2 sm:px-3">
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button size="sm" onClick={() => setIsPlaying(!isPlaying)} className="gap-1 h-8 px-2 sm:px-3">
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="hidden sm:inline">{isPlaying ? "Pause" : "Play"}</span>
          </Button>
        </div>
      </div>

      {/* Step Progress - Horizontal scrollable with arrows */}
      <div className="mb-4 sm:mb-6 relative">
        {/* Left arrow */}
        <button
          onClick={goToPrevStep}
          disabled={currentStep === 0}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div ref={stepScrollRef} className="overflow-x-auto pb-2 px-8 scrollbar-hide">
          <div className="flex gap-1 min-w-max">
            {CRM_STEPS.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const StepIcon = step.icon;

              return (
                <motion.button
                  key={step.id}
                  data-active={isCurrent}
                  onClick={() => {
                    if (index === currentStep && currentStep < CRM_STEPS.length - 1) {
                      handleContentClick();
                    }
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs whitespace-nowrap transition-all ${
                    isCompleted
                      ? "bg-cyan-500/20 text-cyan-500"
                      : isCurrent
                      ? "bg-cyan-500 text-white cursor-pointer"
                      : "bg-muted text-muted-foreground"
                  }`}
                  animate={isCurrent ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <StepIcon className="w-3 h-3" />
                  <span>{step.title}</span>
                  {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Right arrow */}
        <button
          onClick={advanceStep}
          disabled={currentStep >= CRM_STEPS.length - 1}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      {currentStep < CRM_STEPS.length && (
        <div className="mb-4">
          <Progress value={stepProgress} className="h-1" />
        </div>
      )}

      {/* Main Content - Swipeable and Clickable */}
      <motion.div
        ref={contentRef}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 cursor-pointer touch-pan-y"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        onClick={handleContentClick}
      >
        {/* Left: Step Content */}
        <div className="min-h-[350px] sm:min-h-[400px] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: swipeDirection === "left" ? 50 : swipeDirection === "right" ? -50 : 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: swipeDirection === "left" ? -50 : 50 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
          
          {/* Click/swipe prompt */}
          {showClickPrompt && currentStep < CRM_STEPS.length - 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs">
                <Hand className="w-3 h-3 animate-bounce" />
                <span className="hidden sm:inline">{currentStepData?.clickPrompt || "Tap or swipe to continue"}</span>
                <span className="sm:hidden">Tap or swipe</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Lead Card - Sticky on desktop */}
        <Card className="h-fit md:sticky md:top-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4" />
              Lead Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm sm:text-base">
                {lead.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <p className="font-medium text-sm sm:text-base">{lead.name}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{lead.title}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{lead.company}</span>
              </div>
              {enrichedFields.includes("industry") && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{lead.industry}</span>
                </motion.div>
              )}
              {enrichedFields.includes("location") && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span>{lead.location}</span>
                </motion.div>
              )}
            </div>

            {scoreAnimating && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Lead Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 sm:w-20 h-2 rounded-full overflow-hidden bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${displayedScore}%` }}
                        className={`h-full bg-gradient-to-r ${getScoreGradient(displayedScore)}`}
                      />
                    </div>
                    <span className={`font-bold text-sm ${getScoreColor(displayedScore)}`}>{displayedScore}</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {lead.status === "new" ? "New" : lead.status === "enriching" ? "Enriching..." : lead.status === "qualified" ? "Qualified" : "Contacted"}
              </Badge>
              {scoreAnimating && displayedScore >= 70 && (
                <Badge className="text-xs bg-green-500/20 text-green-500">Hot Lead</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg bg-muted/30 border border-border"
      >
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div>
            <p className="text-lg sm:text-2xl font-bold text-muted-foreground line-through">15 min</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Manual Research</p>
          </div>
          <div>
            <p className="text-lg sm:text-2xl font-bold text-cyan-500">45 sec</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">AI-Powered</p>
          </div>
          <div>
            <p className="text-lg sm:text-2xl font-bold text-green-500">95%</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Time Saved</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
