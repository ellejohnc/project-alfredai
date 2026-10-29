import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import {
  LayoutDashboard, Scale, Wrench, DollarSign, Bot, BarChart3,
  CalendarDays, Store, Play, CheckCircle2, ChevronRight, ChevronLeft,
  Pause, Building2, AlertTriangle, TrendingUp, Shield, Users,
  MessageSquare, FileText, Activity, Zap, Bell, Globe, Vote,
  CircleDollarSign, Search, Settings, Eye, Clock, Sparkles,
  ArrowUpRight, CheckSquare, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── STEPS ───
const STEPS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "operations", label: "Operations", icon: Wrench },
  { id: "governance", label: "Governance", icon: Scale },
  { id: "agents", label: "AI Agents", icon: Bot },
  { id: "insights", label: "Insights", icon: BarChart3 },
  { id: "automation", label: "Automation", icon: Zap },
];

// ─── DEMO DATA ───
const PORTFOLIO_METRICS = [
  { label: "Buildings", value: "15", icon: Building2, trend: "+2", sparkline: [8, 10, 11, 12, 13, 14, 15] },
  { label: "Open Issues", value: "73", icon: AlertTriangle, trend: "-12", trendDown: true, sparkline: [95, 88, 85, 80, 78, 75, 73] },
  { label: "Active Motions", value: "6", icon: Scale, trend: "+3", sparkline: [2, 3, 3, 4, 5, 5, 6] },
  { label: "Levy Rate", value: "89.7%", icon: TrendingUp, trend: "+2.1%", sparkline: [82, 84, 85, 86, 87, 88, 89.7] },
];

const PREDICTED_ISSUES = [
  {
    title: "Fire Safety Certificate Expiry Gap",
    confidence: 95, timeframe: "24 days", category: "compliance",
    detail: "Annual fire safety statement due in 45 days. No inspection booking detected.",
    recommendation: "Immediately engage accredited fire safety practitioner.",
  },
  {
    title: "Roof Membrane Deterioration — Water Ingress Likely",
    confidence: 92, timeframe: "1 month", category: "defect",
    detail: "Membrane age (12 years) exceeds 80% of expected lifespan.",
    recommendation: "Commission full roof survey and budget $85,000–$120,000.",
  },
  {
    title: "Lift Motor Bearing Failure Risk",
    confidence: 87, timeframe: "3 months", category: "defect",
    detail: "Increased vibration patterns consistent with pre-failure degradation.",
    recommendation: "Schedule preventive bearing replacement during next shutdown.",
  },
];

const WORK_ORDERS = [
  { title: "Intercom system failure — North Wing", building: "Riverside Square", priority: "HIGH", status: "Issue Logged", cost: "$8,500", ai: 85 },
  { title: "Lift vibration issue — Shaft 2", building: "Harbour Tower", priority: "CRITICAL", status: "Investigation", cost: "$35,000", ai: 95 },
  { title: "Gym equipment maintenance", building: "Waterfront Residences", priority: "LOW", status: "Work Scheduled", cost: "$2,400", ai: 28 },
  { title: "HVAC efficiency below threshold", building: "Central Plaza", priority: "MEDIUM", status: "Issue Logged", cost: "$12,000", ai: 72 },
  { title: "Pool pump replacement", building: "Coastal Apartments", priority: "MEDIUM", status: "Investigation", cost: "$6,800", ai: 55 },
];

const MOTIONS = [
  {
    title: "Initiate debt recovery — Lot AC009",
    building: "Central Plaza", type: "Ordinary (>50%)",
    votesFor: 18, votesAgainst: 8, totalVotes: 78, votesCast: 31,
    closes: "16/04/2026", status: "active",
    aiInsight: "Multiple reminder notices sent without response. Debt recovery is appropriate next step per the Act.",
  },
  {
    title: "Approve 2026 Annual Budget — $1.24M",
    building: "Central Plaza", type: "Ordinary (>50%)",
    votesFor: 22, votesAgainst: 3, totalVotes: 78, votesCast: 28,
    closes: "20/04/2026", status: "active",
    aiInsight: "Budget increase of 4.2% is below industry average of 5.8%. Recommend approval.",
  },
];

const AI_AGENTS = [
  {
    name: "Alfred", role: "Chief AI Officer", color: "text-rose-500", bgColor: "bg-rose-500",
    personality: "Strategic, articulate, always sees the big picture",
    skills: ["Portfolio Strategy", "Cross-Agent Coordination", "Executive Briefings"],
    stats: { actions: 1240, confidence: "97%", escalations: 0, buildings: "All" },
  },
  {
    name: "Gordon", role: "Governance Agent", color: "text-violet-500", bgColor: "bg-violet-500",
    personality: "Precise, methodical, cites regulations by clause",
    skills: ["Motion Drafting", "Async Voting", "Committee Briefings"],
    stats: { actions: 142, confidence: "93%", escalations: 2, buildings: "All" },
  },
  {
    name: "Maya", role: "Maintenance Agent", color: "text-amber-500", bgColor: "bg-amber-500",
    personality: "Practical, action-oriented, speaks in clear priorities",
    skills: ["Predictive Maintenance", "Incident Triage", "Vendor Procurement"],
    stats: { actions: 167, confidence: "87%", escalations: 6, buildings: "All" },
  },
  {
    name: "Felix", role: "Finance Agent", color: "text-emerald-500", bgColor: "bg-emerald-500",
    personality: "Numbers-driven, conservative, flags risks early",
    skills: ["Budget Forecasting", "Levy Intelligence", "Invoice Anomaly Detection"],
    stats: { actions: 218, confidence: "96%", escalations: 4, buildings: "All" },
  },
  {
    name: "Coco", role: "Community Concierge", color: "text-blue-500", bgColor: "bg-blue-500",
    personality: "Warm, empathetic, always follows up",
    skills: ["Owner Engagement", "Query Resolution", "Sentiment Tracking"],
    stats: { actions: 384, confidence: "91%", escalations: 1, buildings: "All" },
  },
];

const INSIGHT_METRICS = [
  { label: "Avg Levy Collection", value: "89.7%", color: "text-emerald-500" },
  { label: "Total Arrears", value: "$368K", color: "text-rose-500" },
  { label: "Open Issues", value: "73", color: "text-amber-500" },
  { label: "High Risk Buildings", value: "6", color: "text-rose-500" },
];

const BENCHMARKS = [
  { name: "Civic Quarter", location: "Civic, ACT", rank: "1st", scores: [75, 100, 80, 100] },
  { name: "Waterfront Residences", location: "Waterfront, NSW", rank: "2nd", scores: [75, 100, 90, 100] },
  { name: "Coastal Apartments", location: "Coastal, NSW", rank: "3rd", scores: [75, 100, 80, 100] },
];

const AUTOMATION_LOG = [
  { action: "AGM Pack auto-generated for Central Plaza", agent: "Gordon", time: "21 days ago", status: "completed" },
  { action: "Tenant vacancy risk flagged — Lot AC006", agent: "Felix", time: "21 days ago", status: "pending" },
  { action: "Fire safety certificate reminder sent", agent: "Maya", time: "18 days ago", status: "completed" },
  { action: "Levy arrears notice — 3 owners notified", agent: "Felix", time: "14 days ago", status: "completed" },
  { action: "Community sentiment report generated", agent: "Coco", time: "7 days ago", status: "completed" },
  { action: "Work order created for lift vibration", agent: "Maya", time: "3 days ago", status: "completed" },
  { action: "Budget variance alert — maintenance overspend", agent: "Felix", time: "2 days ago", status: "pending" },
  { action: "Committee meeting minutes drafted", agent: "Gordon", time: "1 day ago", status: "completed" },
];

// ─── MAIN COMPONENT ───
export default function StrataDemo() {
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const autoplayRef = useRef(true);

  // Dashboard
  const [dashReveal, setDashReveal] = useState(0);
  // Operations
  const [opsReveal, setOpsReveal] = useState(0);
  // Governance
  const [govReveal, setGovReveal] = useState(0);
  const [voteAnimating, setVoteAnimating] = useState(false);
  // Agents
  const [agentReveal, setAgentReveal] = useState(0);
  const [activeAgent, setActiveAgent] = useState(0);
  // Insights
  const [insightReveal, setInsightReveal] = useState(0);
  // Automation
  const [autoReveal, setAutoReveal] = useState(0);

  useEffect(() => { autoplayRef.current = autoplay; }, [autoplay]);

  const goNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) setCurrentStep(s => s + 1);
  }, [currentStep]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  }, [currentStep]);

  // ─── AUTOPLAY ENGINE ───
  useEffect(() => {
    if (!started || !autoplay) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = (fn: () => void, ms: number) => {
      timer = setTimeout(() => { if (autoplayRef.current) fn(); }, ms);
    };

    // Step 0: Dashboard — reveal metrics, then predicted issues
    if (currentStep === 0) {
      if (dashReveal < PORTFOLIO_METRICS.length + PREDICTED_ISSUES.length + 1) {
        schedule(() => setDashReveal(d => d + 1), dashReveal === 0 ? 800 : 500);
      } else {
        schedule(goNext, 2500);
      }
      return () => clearTimeout(timer);
    }

    // Step 1: Operations — reveal work orders
    if (currentStep === 1) {
      if (opsReveal < WORK_ORDERS.length + 1) {
        schedule(() => setOpsReveal(o => o + 1), opsReveal === 0 ? 600 : 400);
      } else {
        schedule(goNext, 2500);
      }
      return () => clearTimeout(timer);
    }

    // Step 2: Governance — reveal motions + vote animation
    if (currentStep === 2) {
      if (govReveal < MOTIONS.length + 2) {
        schedule(() => setGovReveal(g => g + 1), govReveal === 0 ? 600 : 700);
      } else if (!voteAnimating) {
        schedule(() => setVoteAnimating(true), 800);
      } else {
        schedule(goNext, 2500);
      }
      return () => clearTimeout(timer);
    }

    // Step 3: AI Agents — reveal agents one by one
    if (currentStep === 3) {
      if (agentReveal < AI_AGENTS.length) {
        schedule(() => {
          setAgentReveal(a => a + 1);
          setActiveAgent(agentReveal);
        }, agentReveal === 0 ? 600 : 800);
      } else {
        schedule(goNext, 3000);
      }
      return () => clearTimeout(timer);
    }

    // Step 4: Insights — reveal metrics + benchmarks
    if (currentStep === 4) {
      if (insightReveal < INSIGHT_METRICS.length + BENCHMARKS.length + 2) {
        schedule(() => setInsightReveal(i => i + 1), insightReveal === 0 ? 600 : 450);
      } else {
        schedule(goNext, 2500);
      }
      return () => clearTimeout(timer);
    }

    // Step 5: Automation — reveal log entries
    if (currentStep === 5) {
      if (autoReveal < AUTOMATION_LOG.length + 1) {
        schedule(() => setAutoReveal(a => a + 1), autoReveal === 0 ? 600 : 350);
      }
      return () => clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [started, autoplay, currentStep, dashReveal, opsReveal, govReveal, voteAnimating, agentReveal, insightReveal, autoReveal, goNext]);

  // ─── START SCREEN ───
  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 ring-1 ring-primary/10"
        >
          <Building2 className="w-10 h-10 text-primary" />
        </motion.div>
        <motion.h2
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold text-foreground mb-2 tracking-tight"
        >
          Portal Strata International
        </motion.h2>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground mb-6 max-w-md leading-relaxed"
        >
          Experience the AI operating system for multi-unit buildings — from portfolio oversight to autonomous agent operations.
        </motion.p>
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-2 mb-8 max-w-md"
        >
          {STEPS.map((s, i) => (
            <motion.span
              key={s.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.35 + i * 0.05 }}
              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-muted/60 text-muted-foreground flex items-center gap-1.5 backdrop-blur-sm border border-border/30"
            >
              <s.icon className="w-3 h-3" /> {s.label}
            </motion.span>
          ))}
        </motion.div>
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Button onClick={() => setStarted(true)} size="lg" className="gap-2.5 min-h-[52px] px-8 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
            <Play className="w-5 h-5" /> Start Demo
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ─── Step Progress Bar ─── */}
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" onClick={goPrev} disabled={currentStep === 0} className="shrink-0 h-9 w-9 rounded-xl">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-0 flex-1 min-w-0 overflow-x-auto scrollbar-none">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            return (
              <div key={step.id} className="flex items-center min-w-0">
                <button
                  onClick={() => { setAutoplay(false); setCurrentStep(i); }}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap",
                    isActive && "bg-primary text-primary-foreground shadow-md shadow-primary/25",
                    isDone && "text-primary hover:bg-primary/5",
                    !isActive && !isDone && "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <Icon className={cn("w-3.5 h-3.5", isActive && "text-primary-foreground")} />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    "w-3 sm:w-5 h-[2px] mx-0.5 rounded-full transition-colors duration-500",
                    isDone ? "bg-primary/60" : "bg-border/60"
                  )} />
                )}
              </div>
            );
          })}
        </div>
        <Button variant="ghost" size="icon" onClick={goNext} disabled={currentStep === STEPS.length - 1} className="shrink-0 h-9 w-9 rounded-xl">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Step label + autoplay */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Step {currentStep + 1} of {STEPS.length}
          </span>
          {autoplay && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Auto
            </span>
          )}
        </div>
        <button
          onClick={() => setAutoplay(p => !p)}
          className={cn(
            "h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-[10px] font-medium transition-all",
            autoplay ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          {autoplay ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          {autoplay ? "Pause" : "Play"}
        </button>
      </div>

      {/* ─── Step Content ─── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {currentStep === 0 && <DashboardStep reveal={dashReveal} onNext={goNext} />}
          {currentStep === 1 && <OperationsStep reveal={opsReveal} onNext={goNext} />}
          {currentStep === 2 && <GovernanceStep reveal={govReveal} voteAnimating={voteAnimating} onNext={goNext} />}
          {currentStep === 3 && <AgentsStep reveal={agentReveal} activeAgent={activeAgent} onSelectAgent={setActiveAgent} onNext={goNext} />}
          {currentStep === 4 && <InsightsStep reveal={insightReveal} onNext={goNext} />}
          {currentStep === 5 && <AutomationStep reveal={autoReveal} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Shared Components ───
function StepHeader({ icon: Icon, title, subtitle }: { icon: typeof LayoutDashboard; title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-[15px] leading-tight">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function NextButton({ onClick, label = "Continue" }: { onClick: () => void; label?: string }) {
  return (
    <div className="flex justify-end pt-1">
      <Button onClick={onClick} size="sm" className="gap-1.5 min-h-[44px] px-5 rounded-xl shadow-sm">
        {label} <ChevronRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-4 shadow-sm", className)}>
      {children}
    </div>
  );
}

// ─── Step 1: Dashboard ───
function DashboardStep({ reveal, onNext }: { reveal: number; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <StepHeader icon={LayoutDashboard} title="Portfolio Command Centre" subtitle="15 buildings · 1,756 lots — real-time operational overview" />

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {PORTFOLIO_METRICS.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={reveal > i ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <Icon className="w-4 h-4 text-muted-foreground/60" />
                  <div className="flex gap-[2px]">
                    {m.sparkline.map((v, si) => (
                      <div key={si} className="w-[3px] rounded-full bg-primary/40" style={{ height: `${(v / Math.max(...m.sparkline)) * 16}px` }} />
                    ))}
                  </div>
                </div>
                <p className="text-xl font-bold text-foreground leading-tight tabular-nums">{m.value}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  <span className={cn("text-[10px] font-medium", m.trendDown ? "text-emerald-500" : "text-emerald-500")}>
                    {m.trend}
                  </span>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Predicted Issues */}
      {reveal > PORTFOLIO_METRICS.length && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Predicted Issues</span>
              <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 ml-auto">
                {PREDICTED_ISSUES.length} predictions
              </Badge>
            </div>
            <div className="space-y-2.5">
              {PREDICTED_ISSUES.map((issue, i) => (
                <motion.div
                  key={issue.title}
                  initial={{ opacity: 0, x: -10 }}
                  animate={reveal > PORTFOLIO_METRICS.length + i ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.3 }}
                  className="rounded-xl border border-border/30 bg-muted/20 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground leading-tight">{issue.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{issue.detail}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15">
                            {issue.confidence}% confidence
                          </Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> in {issue.timeframe}
                          </span>
                          <Badge className="text-[9px] bg-muted text-muted-foreground border-border/30 hover:bg-muted/80">{issue.category}</Badge>
                        </div>
                        <p className="text-[11px] text-primary mt-1.5 italic">› {issue.recommendation}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0 text-[10px] h-7 rounded-lg border-primary/30 text-primary hover:bg-primary/5 min-h-[36px]">
                      <Bot className="w-3 h-3 mr-1" /> Delegate to AI
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      <NextButton onClick={onNext} label="View Operations" />
    </div>
  );
}

// ─── Step 2: Operations ───
function OperationsStep({ reveal, onNext }: { reveal: number; onNext: () => void }) {
  const priorityColors: Record<string, string> = {
    CRITICAL: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    HIGH: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    MEDIUM: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    LOW: "bg-muted text-muted-foreground border-border/30",
  };

  return (
    <div className="space-y-4">
      <StepHeader icon={Wrench} title="Operations" subtitle="26 work orders · 10 open — kanban-style issue tracking" />

      {/* Summary row */}
      {reveal > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-4 gap-2">
          {[
            { label: "Total", value: "26", icon: Activity },
            { label: "Open", value: "10", icon: AlertTriangle },
            { label: "Critical", value: "4", icon: Shield },
            { label: "In Progress", value: "7", icon: Clock },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <GlassCard key={s.label} className="p-2.5 text-center">
                <Icon className="w-3.5 h-3.5 mx-auto text-muted-foreground/60 mb-1" />
                <p className="text-lg font-bold text-foreground leading-tight">{s.value}</p>
                <p className="text-[9px] text-muted-foreground">{s.label}</p>
              </GlassCard>
            );
          })}
        </motion.div>
      )}

      {/* Work orders */}
      <div className="space-y-2">
        {WORK_ORDERS.map((wo, i) => (
          <motion.div
            key={wo.title}
            initial={{ opacity: 0, x: -10 }}
            animate={reveal > i + 1 ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{wo.title}</p>
                    <Badge className={cn("text-[9px] hover:opacity-90", priorityColors[wo.priority])}>
                      {wo.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {wo.building}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{wo.cost}</span>
                    <span className="text-[10px] text-primary flex items-center gap-1">
                      <Bot className="w-3 h-3" /> AI {wo.ai}
                    </span>
                  </div>
                </div>
                <Badge className="text-[9px] bg-muted text-muted-foreground border-border/30 hover:bg-muted/80 shrink-0">
                  {wo.status}
                </Badge>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <NextButton onClick={onNext} label="View Governance" />
    </div>
  );
}

// ─── Step 3: Governance ───
function GovernanceStep({ reveal, voteAnimating, onNext }: { reveal: number; voteAnimating: boolean; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <StepHeader icon={Scale} title="Governance" subtitle="12 motions — async voting, AI recommendations, compliance tracking" />

      {/* Summary */}
      {reveal > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-4 gap-2">
          {[
            { label: "Active Motions", value: "6" },
            { label: "Passed", value: "6" },
            { label: "Rejected", value: "0" },
            { label: "Total", value: "12" },
          ].map((s) => (
            <GlassCard key={s.label} className="p-2.5 text-center">
              <p className="text-lg font-bold text-foreground leading-tight">{s.value}</p>
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
            </GlassCard>
          ))}
        </motion.div>
      )}

      {/* AI Governance Insight */}
      {reveal > 1 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="bg-emerald-500/5 border-emerald-500/20">
            <div className="flex items-start gap-2">
              <Bot className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-emerald-600">AI Governance Insight</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Governance efficiency up 340% since AI deployment. Average decision time reduced from 38 days to 4.2 days.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Motions */}
      {MOTIONS.map((motion_item, i) => (
        reveal > i + 2 && (
          <motion.div key={motion_item.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{motion_item.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{motion_item.building} · {motion_item.closes}</p>
                </div>
                <Badge className="text-[9px] bg-violet-500/10 text-violet-600 border-violet-500/20 hover:bg-violet-500/15 shrink-0">
                  {motion_item.type}
                </Badge>
              </div>

              {/* AI Recommendation */}
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-2.5 mb-3">
                <p className="text-[10px] font-semibold text-primary flex items-center gap-1">
                  <Bot className="w-3 h-3" /> AI Recommendation
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{motion_item.aiInsight}</p>
              </div>

              {/* Vote progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{motion_item.votesCast} of {motion_item.totalVotes} votes cast</span>
                  <span>
                    <span className="text-emerald-500 font-medium">{motion_item.votesFor} for</span>
                    {" · "}
                    <span className="text-rose-500 font-medium">{motion_item.votesAgainst} against</span>
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                  <motion.div
                    className="bg-gradient-to-r from-primary to-rose-400 rounded-full"
                    initial={{ width: "0%" }}
                    animate={voteAnimating ? { width: `${(motion_item.votesFor / motion_item.totalVotes) * 100}%` } : {}}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </div>
                <p className="text-[10px] text-emerald-500 font-medium">
                  Approval rate: {((motion_item.votesFor / motion_item.votesCast) * 100).toFixed(1)}%
                </p>
              </div>
            </GlassCard>
          </motion.div>
        )
      ))}

      <NextButton onClick={onNext} label="Meet AI Agents" />
    </div>
  );
}

// ─── Step 4: AI Agents ───
function AgentsStep({ reveal, activeAgent, onSelectAgent, onNext }: { reveal: number; activeAgent: number; onSelectAgent: (i: number) => void; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <StepHeader icon={Bot} title="alfred ai Team" subtitle="5 specialist agents working 24/7 across your portfolio" />

      {/* Agent selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {AI_AGENTS.map((agent, i) => (
          <motion.button
            key={agent.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={reveal > i ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.3 }}
            onClick={() => onSelectAgent(i)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border whitespace-nowrap shrink-0 min-h-[36px]",
              activeAgent === i
                ? "bg-primary/10 border-primary/40 text-primary shadow-sm"
                : "bg-background border-border/50 text-muted-foreground hover:text-foreground"
            )}
          >
            <span className={cn("w-2 h-2 rounded-full", agent.bgColor)} />
            {agent.name}
          </motion.button>
        ))}
      </div>

      {/* Active agent detail */}
      {reveal > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeAgent}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.25 }}
          >
            <GlassCard>
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm", AI_AGENTS[activeAgent].bgColor)}>
                  {AI_AGENTS[activeAgent].name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground">{AI_AGENTS[activeAgent].name}</p>
                    <Badge className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15">Active</Badge>
                  </div>
                  <p className={cn("text-xs font-medium", AI_AGENTS[activeAgent].color)}>{AI_AGENTS[activeAgent].role}</p>
                </div>
                <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                </span>
              </div>

              <p className="text-[11px] text-muted-foreground mb-3 italic">"{AI_AGENTS[activeAgent].personality}"</p>

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {AI_AGENTS[activeAgent].skills.map((skill) => (
                  <Badge key={skill} className="text-[9px] bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">{skill}</Badge>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(AI_AGENTS[activeAgent].stats).map(([key, val]) => (
                  <div key={key} className="text-center rounded-lg bg-muted/30 p-2">
                    <p className="text-sm font-bold text-foreground">{val}</p>
                    <p className="text-[9px] text-muted-foreground capitalize">{key}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      )}

      <NextButton onClick={onNext} label="View Insights" />
    </div>
  );
}

// ─── Step 5: Insights ───
function InsightsStep({ reveal, onNext }: { reveal: number; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <StepHeader icon={BarChart3} title="Portfolio Intelligence" subtitle="Cross-building benchmarking, risk scoring, and trend analysis" />

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {INSIGHT_METRICS.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={reveal > i ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-0.5">{m.label}</p>
              <p className={cn("text-xl font-bold tabular-nums", m.color)}>{m.value}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Preservation Score */}
      {reveal > INSIGHT_METRICS.length && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Property Value Intelligence</span>
              <Badge className="text-[9px] bg-muted text-muted-foreground border-border/30 hover:bg-muted/80">Preservation Score</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary tabular-nums">87</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Preservation Score</p>
                <p className="text-[10px] text-emerald-500 font-medium">Good · ↑ Improving</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-foreground">Score Breakdown</p>
                {["Assets", "Financial", "Defect Risk", "Compliance"].map((cat) => (
                  <div key={cat} className="flex items-center gap-1.5">
                    <span className="text-[9px] text-muted-foreground w-16">{cat}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/60 rounded-full" style={{ width: `${70 + Math.random() * 25}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-foreground">Score Trend</p>
                <div className="flex items-end gap-[3px] h-12">
                  {[65, 68, 72, 74, 78, 82, 85, 87].map((v, i) => (
                    <div key={i} className="flex-1 bg-primary/40 rounded-t" style={{ height: `${(v / 100) * 100}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Benchmarks */}
      {reveal > INSIGHT_METRICS.length + 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Cross-Building Benchmarking</span>
            </div>
            <div className="space-y-2">
              {BENCHMARKS.map((b, i) => (
                <motion.div
                  key={b.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={reveal > INSIGHT_METRICS.length + 1 + i ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 rounded-xl bg-muted/20 p-2.5 border border-border/20"
                >
                  <span className="text-xs font-bold text-primary w-6">{b.rank}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{b.name}</p>
                    <p className="text-[10px] text-muted-foreground">{b.location}</p>
                  </div>
                  <div className="flex gap-[2px]">
                    {b.scores.map((s, si) => (
                      <div key={si} className="w-6 h-1.5 rounded-full" style={{ backgroundColor: `hsl(var(--primary) / ${s / 100})` }} />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      <NextButton onClick={onNext} label="View Automation" />
    </div>
  );
}

// ─── Step 6: Automation ───
function AutomationStep({ reveal }: { reveal: number }) {
  const completedCount = AUTOMATION_LOG.filter(a => a.status === "completed").length;

  return (
    <div className="space-y-4">
      <StepHeader icon={Zap} title="Automation Layer" subtitle="Autonomous task execution across your portfolio" />

      {/* Stats */}
      {reveal > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-2">
          <GlassCard className="p-2.5 text-center">
            <p className="text-lg font-bold text-foreground">{AUTOMATION_LOG.length}</p>
            <p className="text-[9px] text-muted-foreground">Recent Actions</p>
          </GlassCard>
          <GlassCard className="p-2.5 text-center">
            <p className="text-lg font-bold text-emerald-500">{completedCount}</p>
            <p className="text-[9px] text-muted-foreground">Completed</p>
          </GlassCard>
          <GlassCard className="p-2.5 text-center">
            <p className="text-lg font-bold text-amber-500">{AUTOMATION_LOG.length - completedCount}</p>
            <p className="text-[9px] text-muted-foreground">Pending</p>
          </GlassCard>
        </motion.div>
      )}

      {/* Activity log */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Recent Agent Activity</span>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 5 agents active
          </span>
        </div>
        <div className="space-y-1.5">
          {AUTOMATION_LOG.map((entry, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={reveal > i + 1 ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2.5 rounded-lg bg-muted/20 p-2.5 border border-border/20"
            >
              {entry.status === "completed" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-foreground leading-tight truncate">{entry.action}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-primary font-medium">{entry.agent}</span>
                  <span className="text-[9px] text-muted-foreground">{entry.time}</span>
                </div>
              </div>
              <Badge className={cn(
                "text-[8px] shrink-0",
                entry.status === "completed"
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/15"
              )}>
                {entry.status}
              </Badge>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Footer badge */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {["Enterprise-grade security", "Australian strata compliance", "SOC 2 aligned", "Data sovereignty"].map((label) => (
          <span key={label} className="text-[10px] text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {label}
          </span>
        ))}
      </div>
    </div>
  );
}
