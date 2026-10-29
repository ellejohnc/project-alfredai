import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import {
  Settings, FileText, BarChart3, ClipboardList, CheckSquare, List,
  PenTool, Sparkles, ExternalLink, Calendar, ChevronRight, ChevronLeft,
  Play, CheckCircle2, Upload, Zap, Clock, Users, Building2, Hash,
  FileSearch, AlertTriangle, Star, Brain, Send, Loader2, X,
  ThumbsUp, ThumbsDown, Shield, Target, ChevronDown, ChevronUp,
  BookOpen, MessageSquare, TrendingUp, MapPin, UserCheck, Info,
  Radar, DollarSign, Check, Pause
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── STEPS ───
const STEPS = [
  { id: "setup", label: "Setup", icon: Settings },
  { id: "scan", label: "AlfredSCAN", icon: Radar },
  { id: "analysis", label: "Analysis", icon: BarChart3 },
  { id: "inputs", label: "Inputs", icon: ClipboardList },
  { id: "checklist", label: "Checklist", icon: CheckSquare },
  { id: "outline", label: "Outline", icon: List },
  { id: "writing", label: "Writing", icon: PenTool },
  { id: "generate", label: "Generate", icon: Sparkles },
];

// ─── DEMO DATA ───
const EXTRACTED_FIELDS = [
  { field: "Project Name", value: "City Metro West – Station Fit-Out Package 3", confidence: 98 },
  { field: "Principal", value: "State Transport Authority", confidence: 96 },
  { field: "Contract Type", value: "Design & Construct (D&C)", confidence: 94 },
  { field: "Closing Date", value: "15 March 2026, 2:00 PM AEST", confidence: 93 },
  { field: "Estimated Value", value: "$12,400,000", confidence: 88 },
  { field: "Site Access", value: "1 June 2026", confidence: 91 },
  { field: "Practical Completion", value: "30 November 2027", confidence: 89 },
  { field: "Liquidated Damages", value: "$15,000 / calendar day", confidence: 79 },
];

const PERSONNEL_REQUIREMENTS = [
  { role: "Project Director", requirement: "Min. 15 years exp., 2 similar rail projects", confidence: 85 },
  { role: "Design Manager", requirement: "Registered Architect or CPEng, BIM Level 3", confidence: 83 },
  { role: "Safety Manager", requirement: "Cert IV WHS, Rail Safety Worker competency", confidence: 82 },
  { role: "Construction Manager", requirement: "10+ years, rail or heavy civil", confidence: 80 },
];

const INSURANCE_REQUIREMENTS = [
  { type: "Professional Indemnity", value: "$20,000,000", confidence: 90 },
  { type: "Public Liability", value: "$50,000,000", confidence: 88 },
  { type: "Workers Compensation", value: "As per legislation", confidence: 95 },
  { type: "Contract Works", value: "Full contract value", confidence: 86 },
];

const CHECKLIST_ITEMS = [
  { id: "c1", section: "Mandatory", label: "Company registration & ABN", done: true },
  { id: "c2", section: "Mandatory", label: "Insurance certificates uploaded", done: true },
  { id: "c3", section: "Mandatory", label: "WHS Management Plan", done: false },
  { id: "c4", section: "Mandatory", label: "Financial statements (3 years)", done: true },
  { id: "c5", section: "Technical", label: "Project methodology statement", done: false },
  { id: "c6", section: "Technical", label: "Key personnel CVs (3 required)", done: false },
  { id: "c7", section: "Technical", label: "Organisational chart", done: true },
  { id: "c8", section: "Technical", label: "Preliminary program (Gantt)", done: false },
  { id: "c9", section: "Pricing", label: "Bill of Quantities completed", done: false },
  { id: "c10", section: "Pricing", label: "Pricing schedule signed", done: false },
];

const OUTLINE_SECTIONS = [
  { id: "o1", section: "1.0", title: "Executive Summary", wordLimit: 500, status: "ready" as const },
  { id: "o2", section: "2.0", title: "Project Understanding & Methodology", wordLimit: 1200, status: "ready" as const },
  { id: "o3", section: "2.1", title: "Approach to Live Rail Environment", wordLimit: 500, status: "ready" as const },
  { id: "o4", section: "2.2", title: "Design Management & BIM", wordLimit: 400, status: "ready" as const },
  { id: "o5", section: "3.0", title: "Key Personnel & Experience", wordLimit: 800, status: "ready" as const },
  { id: "o6", section: "4.0", title: "Social Procurement & Indigenous Engagement", wordLimit: 350, status: "ready" as const },
  { id: "o7", section: "5.0", title: "Risk Management", wordLimit: 600, status: "ready" as const },
  { id: "o8", section: "6.0", title: "Program & Delivery Timeline", wordLimit: 400, status: "ready" as const },
];

const WRITING_SECTIONS = [
  {
    id: "w1", section: "2.1", title: "Approach to Live Rail Environment", wordLimit: 500, wordCount: 342,
    draft: "Our approach to managing works within a live rail environment is built on three pillars: rigorous safety protocols, experienced personnel, and proven track possession planning.\n\nWe have delivered 3 comparable rail projects in the last 4 years, maintaining a zero Lost Time Injury record across all. Our proprietary SWMS for live rail environments has been refined through 120+ personnel deployments on City Rail and Metro projects.\n\nKey elements of our methodology include:\n• Dedicated Rail Safety Manager embedded from Day 1\n• Pre-approved track possession schedules aligned with Transport Authority windows\n• Real-time worker tracking via SafeZone proximity alerts\n• Weekly interface coordination meetings with rail operator",
  },
  {
    id: "w2", section: "4.0", title: "Social Procurement & Indigenous Engagement", wordLimit: 350, wordCount: 287,
    draft: "We commit to exceeding the 60% local workforce target with an 85% engagement rate within the Riverside LGA. Our partnership with Supply Nation-certified suppliers will ensure a minimum 3% Indigenous procurement spend.\n\nOur Indigenous Engagement Plan includes:\n• Cultural awareness training for all site personnel\n• Naming consultation with local local Indigenous custodians\n• Trainee positions allocated for Indigenous candidates\n• Quarterly reporting to client on procurement targets",
  },
];

const CHAT_MESSAGES = [
  { role: "user" as const, content: "What are the key risks for this project?" },
  { role: "assistant" as const, content: "Based on the RFT analysis, I've identified **5 key risks**:\n\n1. **Live Rail Interface** — Works adjacent to operational corridor. Requires Track Possession and Rail Safety Worker accreditation.\n\n2. **Heritage Constraints** — Station precinct includes State Heritage structures. Façade modifications need Heritage Council approval (8-12 week lead time).\n\n3. **Ground Conditions** — Geotechnical report flags potential acid sulfate soils at 3.2m depth.\n\n4. **Program Risk** — 18-month construction window is tight for 3 stations. Critical path: MEP coordination → platform screen doors.\n\n5. **Supply Chain** — Platform screen doors sole-sourced from Faiveley Transport (France). 16-week lead time." },
  { role: "user" as const, content: "What's our track record on similar projects?" },
  { role: "assistant" as const, content: "I found **3 comparable projects** in your library:\n\n• **Metro NW Greenfield Station** — $8.2M, Dec 2023 — ✅ On time, under budget\n• **Light Rail Eastside Terminus** — $5.6M, Mar 2024 — ⚠️ 3 weeks late (design changes)\n• **City Rail Central Platform 25** — $3.1M, Jul 2024 — ✅ Ahead of schedule\n\n**Win rate on rail bids (3 years):** 42% (5/12)\n\nRecommend referencing Greenfield as primary comparable." },
];

const SCAN_CRITERIA = {
  industries: ["Infrastructure", "Transport", "Fitout"],
  locations: ["Sydney NSW", "Melbourne VIC"],
  valueRange: "$5M – $50M",
  keywords: ["station", "rail", "metro"],
};

const TENDER_PORTALS = ["TenderHub", "GovTender", "AusTender", "VendorHub", "EstimatePro"];

const SCANNED_OPPORTUNITIES = [
  {
    title: "City Metro West – Station Fit-Out Package 3",
    client: "State Transport Authority",
    value: "$12.4M",
    deadline: "15 Mar 2026",
    location: "Sydney NSW",
    source: "GovTender",
    category: "Transport",
    pwin: 72,
    summary: "Design & construct fit-out for 3 underground metro stations including platform screen doors, wayfinding, and MEP.",
  },
  {
    title: "Central Station Platform Upgrade – Electrical",
    client: "City Rail",
    value: "$8.7M",
    deadline: "28 Mar 2026",
    location: "Sydney NSW",
    source: "TenderHub",
    category: "Infrastructure",
    pwin: 65,
    summary: "High-voltage switchgear replacement and LED lighting upgrade across platforms 18–25.",
  },
  {
    title: "Capital Airport Rail – Fit-Out Enabling Works",
    client: "State Rail Projects",
    value: "$22.1M",
    deadline: "10 Apr 2026",
    location: "Melbourne VIC",
    source: "AusTender",
    category: "Transport",
    pwin: 48,
    summary: "Enabling works for station fit-out including temporary structures, services diversions, and site establishment.",
  },
  {
    title: "Riverside Light Rail – Stop Shelters & Amenities",
    client: "State Transport Authority",
    value: "$5.3M",
    deadline: "22 Apr 2026",
    location: "Sydney NSW",
    source: "VendorHub",
    category: "Fitout",
    pwin: 58,
    summary: "Supply and install passenger shelters, seating, ticketing pods, and accessibility ramps at 12 stops.",
  },
  {
    title: "North West Metro – Station Retail Tenancy Fit-Out",
    client: "Metro Transit",
    value: "$6.8M",
    deadline: "5 May 2026",
    location: "Sydney NSW",
    source: "EstimatePro",
    category: "Fitout",
    pwin: 61,
    summary: "Retail tenancy fit-out across 4 stations including food court, convenience stores, and services areas.",
  },
];

// ─── MAIN COMPONENT ───
export default function AlfredBIDDemo() {
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const autoplayRef = useRef(true);

  // Setup
  const [setupDone, setSetupDone] = useState(false);
  // Scan
  const [scanPhase, setScanPhase] = useState<"idle" | "uploading" | "scanning" | "done">("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [scanCurrentDoc, setScanCurrentDoc] = useState(0);
  // Analysis
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [analysisTab, setAnalysisTab] = useState<"general" | "personnel" | "insurance">("general");
  // Inputs
  const [chatStep, setChatStep] = useState(0);
  const [chatTyping, setChatTyping] = useState(false);
  // Checklist
  const [checkedItems, setCheckedItems] = useState<Set<string>>(
    new Set(CHECKLIST_ITEMS.filter(c => c.done).map(c => c.id))
  );
  // Outline
  const [outlineExpanded, setOutlineExpanded] = useState<string | null>(null);
  // Writing
  const [writingDrafting, setWritingDrafting] = useState<string | null>(null);
  const [writingDrafted, setWritingDrafted] = useState<Set<string>>(new Set());
  // Generate
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  // Keep ref in sync
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

    // Step 0: Setup — confirm after 2s, advance after 3.5s
    if (currentStep === 0 && !setupDone) {
      schedule(() => setSetupDone(true), 2000);
      return () => clearTimeout(timer);
    }
    if (currentStep === 0 && setupDone) {
      schedule(goNext, 1500);
      return () => clearTimeout(timer);
    }

    // Step 1: Scan — start scan immediately, advance after done
    if (currentStep === 1 && scanPhase === "idle") {
      schedule(() => {
        // trigger scan
        setScanPhase("uploading");
        setTimeout(() => {
          setScanPhase("scanning");
          setScanProgress(0);
          setScanCurrentDoc(0);
          let p = 0;
          let docIdx = 0;
          const iv = setInterval(() => {
            p += Math.random() * 8 + 3;
            if (p > 33 && docIdx === 0) { docIdx = 1; setScanCurrentDoc(1); }
            if (p > 66 && docIdx === 1) { docIdx = 2; setScanCurrentDoc(2); }
            if (p >= 100) {
              p = 100;
              clearInterval(iv);
              setTimeout(() => setScanPhase("done"), 600);
            }
            setScanProgress(Math.min(p, 100));
          }, 250);
        }, 1200);
      }, 800);
      return () => clearTimeout(timer);
    }
    if (currentStep === 1 && scanPhase === "done") {
      schedule(goNext, 3000);
      return () => clearTimeout(timer);
    }

    // Step 2: Analysis — start, then advance
    if (currentStep === 2 && analysisProgress === 0 && !analysisDone) {
      schedule(() => {
        let p = 0;
        const iv = setInterval(() => {
          p += Math.random() * 15 + 5;
          if (p >= 100) { p = 100; clearInterval(iv); setTimeout(() => setAnalysisDone(true), 400); }
          setAnalysisProgress(Math.min(p, 100));
        }, 300);
      }, 800);
      return () => clearTimeout(timer);
    }
    if (currentStep === 2 && analysisDone) {
      schedule(goNext, 2500);
      return () => clearTimeout(timer);
    }

    // Step 3: Inputs — auto-advance chat messages
    if (currentStep === 3 && chatStep < CHAT_MESSAGES.length && !chatTyping) {
      schedule(() => {
        setChatTyping(true);
        setTimeout(() => {
          setChatStep(s => s + 1);
          setChatTyping(false);
        }, CHAT_MESSAGES[chatStep].role === "assistant" ? 1800 : 400);
      }, chatStep === 0 ? 800 : 1200);
      return () => clearTimeout(timer);
    }
    if (currentStep === 3 && chatStep >= CHAT_MESSAGES.length && !chatTyping) {
      schedule(goNext, 2000);
      return () => clearTimeout(timer);
    }

    // Step 4: Checklist — auto-check remaining items then advance
    if (currentStep === 4) {
      const unchecked = CHECKLIST_ITEMS.filter(c => !checkedItems.has(c.id));
      if (unchecked.length > 0) {
        schedule(() => {
          setCheckedItems(prev => {
            const n = new Set(prev);
            n.add(unchecked[0].id);
            return n;
          });
        }, 600);
        return () => clearTimeout(timer);
      } else {
        schedule(goNext, 1500);
        return () => clearTimeout(timer);
      }
    }

    // Step 5: Outline — expand a couple, then advance
    if (currentStep === 5 && outlineExpanded === null) {
      schedule(() => setOutlineExpanded("o1"), 800);
      return () => clearTimeout(timer);
    }
    if (currentStep === 5 && outlineExpanded === "o1") {
      schedule(() => setOutlineExpanded("o3"), 2000);
      return () => clearTimeout(timer);
    }
    if (currentStep === 5 && outlineExpanded === "o3") {
      schedule(goNext, 2000);
      return () => clearTimeout(timer);
    }

    // Step 6: Writing — auto-draft sections then advance
    if (currentStep === 6) {
      const undrafted = WRITING_SECTIONS.filter(s => !writingDrafted.has(s.id) && writingDrafting !== s.id);
      if (undrafted.length > 0 && writingDrafting === null) {
        schedule(() => {
          const id = undrafted[0].id;
          setWritingDrafting(id);
          setTimeout(() => {
            setWritingDrafted(prev => { const n = new Set(prev); n.add(id); return n; });
            setWritingDrafting(null);
          }, 2200);
        }, 800);
        return () => clearTimeout(timer);
      }
      if (undrafted.length === 0 && writingDrafting === null) {
        schedule(goNext, 1500);
        return () => clearTimeout(timer);
      }
    }

    // Step 7: Generate — auto-generate
    if (currentStep === 7 && !generating && !generated) {
      schedule(() => {
        setGenerating(true);
        setTimeout(() => { setGenerating(false); setGenerated(true); }, 3000);
      }, 800);
      return () => clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [started, autoplay, currentStep, setupDone, scanPhase, analysisProgress, analysisDone, chatStep, chatTyping, checkedItems, outlineExpanded, writingDrafting, writingDrafted, generating, generated, goNext]);

  // Manual action callbacks (for when autoplay is off)
  const runScan = useCallback(() => {
    setScanPhase("uploading");
    setTimeout(() => {
      setScanPhase("scanning");
      setScanProgress(0);
      setScanCurrentDoc(0);
      let p = 0;
      let docIdx = 0;
      const iv = setInterval(() => {
        p += Math.random() * 8 + 3;
        if (p > 33 && docIdx === 0) { docIdx = 1; setScanCurrentDoc(1); }
        if (p > 66 && docIdx === 1) { docIdx = 2; setScanCurrentDoc(2); }
        if (p >= 100) {
          p = 100;
          clearInterval(iv);
          setTimeout(() => setScanPhase("done"), 600);
        }
        setScanProgress(Math.min(p, 100));
      }, 250);
    }, 1200);
  }, []);

  const runAnalysis = useCallback(() => {
    setAnalysisProgress(0);
    setAnalysisDone(false);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 15 + 5;
      if (p >= 100) { p = 100; clearInterval(iv); setTimeout(() => setAnalysisDone(true), 400); }
      setAnalysisProgress(Math.min(p, 100));
    }, 300);
  }, []);

  const advanceChat = useCallback(() => {
    if (chatStep < CHAT_MESSAGES.length) {
      setChatTyping(true);
      setTimeout(() => {
        setChatStep(s => s + 1);
        setChatTyping(false);
      }, CHAT_MESSAGES[chatStep].role === "assistant" ? 1800 : 400);
    }
  }, [chatStep]);

  const toggleChecklist = useCallback((id: string) => {
    setCheckedItems(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }, []);

  const draftSection = useCallback((id: string) => {
    setWritingDrafting(id);
    setTimeout(() => {
      setWritingDrafted(prev => { const n = new Set(prev); n.add(id); return n; });
      setWritingDrafting(null);
    }, 2200);
  }, []);

  const runGenerate = useCallback(() => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 3000);
  }, []);

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
          <Target className="w-10 h-10 text-primary" />
        </motion.div>
        <motion.h2
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold text-foreground mb-2 tracking-tight"
        >
          AlfredBID – AI Bid Management
        </motion.h2>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground mb-6 max-w-md leading-relaxed"
        >
          Experience the complete bid workflow — from opportunity scanning to document generation.
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

      {/* Step label + count */}
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
            autoplay
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
          title={autoplay ? "Pause autoplay" : "Resume autoplay"}
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
          {currentStep === 0 && <SetupStep done={setupDone} onDone={() => setSetupDone(true)} onNext={goNext} />}
          {currentStep === 1 && <ScanStep phase={scanPhase} progress={scanProgress} currentDoc={scanCurrentDoc} onScan={runScan} onNext={goNext} />}
          {currentStep === 2 && <AnalysisStep progress={analysisProgress} done={analysisDone} onStart={runAnalysis} onNext={goNext} tab={analysisTab} onTabChange={setAnalysisTab} />}
          {currentStep === 3 && <InputsStep chatStep={chatStep} chatTyping={chatTyping} onAdvance={advanceChat} onNext={goNext} />}
          {currentStep === 4 && <ChecklistStep checked={checkedItems} onToggle={toggleChecklist} onNext={goNext} />}
          {currentStep === 5 && <OutlineStep expanded={outlineExpanded} onExpand={setOutlineExpanded} onNext={goNext} />}
          {currentStep === 6 && <WritingStep drafting={writingDrafting} drafted={writingDrafted} onDraft={draftSection} onNext={goNext} />}
          {currentStep === 7 && <GenerateStep generating={generating} generated={generated} onGenerate={runGenerate} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Shared Components ───
function StepHeader({ icon: Icon, title, subtitle }: { icon: typeof Settings; title: string; subtitle?: string }) {
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
    <div className={cn(
      "rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-4 shadow-sm",
      className
    )}>
      {children}
    </div>
  );
}

// ─── Step 1: Setup ───
function SetupStep({ done, onDone, onNext }: { done: boolean; onDone: () => void; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <StepHeader icon={Settings} title="Project Setup" subtitle="Configure the project before uploading RFP documents." />

      <GlassCard>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wider mb-1.5 block">Project Name</label>
            <div className="p-3 rounded-xl bg-muted/40 border border-border/30 text-sm font-medium text-foreground">
              City Metro West – Station Fit-Out Package 3
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wider mb-1.5 block">Client</label>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/30 text-sm text-foreground flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground/60" />
                Test Client Pty Ltd
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wider mb-1.5 block">Project ID</label>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/30 text-xs text-muted-foreground font-mono flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-muted-foreground/60" />
                PRJ-824d3382124a
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wider mb-1.5 block">Sector</label>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/30 text-sm text-foreground">
                Transport Infrastructure
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wider mb-1.5 block">Due Date</label>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/30 text-sm text-foreground flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
                15 Mar 2026
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2.5">
              <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/15">Preparing</Badge>
              <span className="text-[10px] text-muted-foreground/60">5m since creation</span>
            </div>
            {!done ? (
              <Button size="sm" onClick={onDone} className="min-h-[40px] gap-1.5 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Setup
              </Button>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-3"
              >
                <span className="text-xs text-emerald-600 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Setup confirmed
                </span>
                <Button size="sm" onClick={onNext} className="min-h-[40px] gap-1.5 rounded-xl shadow-sm">
                  Scan for Opportunities <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Step 2: AlfredSCAN ───
function ScanStep({
  phase, progress, currentDoc, onScan, onNext,
}: {
  phase: "idle" | "uploading" | "scanning" | "done"; progress: number; currentDoc: number;
  onScan: () => void; onNext: () => void;
}) {
  const [importedIds, setImportedIds] = useState<Set<number>>(new Set());
  const [selectedOpp, setSelectedOpp] = useState<number | null>(null);
  const portalIndex = Math.min(Math.floor(progress / 20), TENDER_PORTALS.length - 1);

  // Auto-import first opportunity when phase is done
  useEffect(() => {
    if (phase === "done" && importedIds.size === 0) {
      const timer = setTimeout(() => setImportedIds(new Set([0])), 1200);
      return () => clearTimeout(timer);
    }
  }, [phase, importedIds.size]);

  return (
    <div className="space-y-4">
      <StepHeader
        icon={Radar}
        title="AlfredSCAN"
        subtitle="Scan tender portals to discover new bid opportunities matching your criteria."
      />

      {phase === "idle" && (
        <div className="space-y-4">
          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-foreground">Scan Profile: Infrastructure NSW</p>
              <Badge variant="secondary" className="text-[10px] rounded-lg">Saved</Badge>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-1.5">Industries</p>
                <div className="flex flex-wrap gap-1.5">
                  {SCAN_CRITERIA.industries.map(ind => (
                    <span key={ind} className="text-[10px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium">{ind}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-1.5">Locations</p>
                <div className="flex flex-wrap gap-1.5">
                  {SCAN_CRITERIA.locations.map(loc => (
                    <span key={loc} className="text-[10px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" />{loc}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-1">Value Range</p>
                  <span className="text-xs text-foreground font-medium flex items-center gap-1"><DollarSign className="w-3 h-3 text-muted-foreground/50" />{SCAN_CRITERIA.valueRange}</span>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-1">Keywords</p>
                  <div className="flex gap-1.5">
                    {SCAN_CRITERIA.keywords.map(kw => (
                      <Badge key={kw} variant="outline" className="text-[10px] rounded-lg">{kw}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          <div className="text-center">
            <Button onClick={onScan} className="gap-2.5 min-h-[48px] px-6 rounded-xl shadow-md shadow-primary/15">
              <Radar className="w-4 h-4" /> Scan Tender Portals
            </Button>
            <p className="text-[10px] text-muted-foreground/60 mt-2">Searches TenderHub, GovTender, AusTender, VendorHub & EstimatePro</p>
          </div>
        </div>
      )}

      {phase === "uploading" && (
        <div className="flex flex-col items-center justify-center py-10 gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Radar className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div className="absolute -inset-2 rounded-3xl border-2 border-primary/15 animate-ping" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Connecting to tender portals...</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Authenticating with 5 platforms</p>
          </div>
        </div>
      )}

      {phase === "scanning" && (
        <GlassCard>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Scanning {TENDER_PORTALS[portalIndex]}...</span>
                <span className="font-semibold text-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="space-y-2">
              {TENDER_PORTALS.map((portal, i) => (
                <motion.div
                  key={portal}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: i <= portalIndex ? 1 : 0.3, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-2.5 text-xs py-1"
                >
                  {i < portalIndex ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : i === portalIndex ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-border/40 shrink-0" />
                  )}
                  <span className={cn("font-medium", i <= portalIndex ? "text-foreground" : "text-muted-foreground/50")}>{portal}</span>
                  {i < portalIndex && <span className="text-[10px] text-emerald-600 ml-auto font-medium">{Math.floor(Math.random() * 3 + 1)} found</span>}
                </motion.div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      {phase === "done" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-semibold">Scan complete — {SCANNED_OPPORTUNITIES.length} opportunities found</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Radar, label: "Portals", value: "5", color: "text-primary" },
              { icon: FileText, label: "Found", value: String(SCANNED_OPPORTUNITIES.length), color: "text-emerald-600" },
              { icon: DollarSign, label: "Total Value", value: "$55.3M", color: "text-blue-600" },
              { icon: TrendingUp, label: "Avg Pwin", value: "61%", color: "text-amber-600" },
            ].map(stat => (
              <GlassCard key={stat.label} className="!p-3 text-center">
                <stat.icon className={cn("w-4 h-4 mx-auto mb-1.5", stat.color)} />
                <p className={cn("text-sm font-bold", stat.color)}>{stat.value}</p>
                <p className="text-[10px] text-muted-foreground/60">{stat.label}</p>
              </GlassCard>
            ))}
          </div>

          {/* Opportunities */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {SCANNED_OPPORTUNITIES.map((opp, i) => {
              const imported = importedIds.has(i);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={cn(
                    "rounded-xl p-3.5 transition-all cursor-pointer border",
                    imported
                      ? "border-emerald-500/30 bg-emerald-500/5 shadow-sm shadow-emerald-500/5"
                      : "border-border/40 bg-card/60 hover:border-primary/30 hover:bg-card/90"
                  )}
                  onClick={() => setSelectedOpp(selectedOpp === i ? null : i)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-foreground line-clamp-1">{opp.title}</h4>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">{opp.client}</p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-lg shrink-0",
                      opp.pwin >= 65 ? "text-emerald-600 bg-emerald-500/10" : opp.pwin >= 55 ? "text-amber-600 bg-amber-500/10" : "text-muted-foreground bg-muted/50"
                    )}>
                      ~{opp.pwin}% Pwin
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60 mb-2">
                    <span className="flex items-center gap-0.5 font-medium"><DollarSign className="h-2.5 w-2.5" />{opp.value}</span>
                    <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{opp.location}</span>
                    <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{opp.deadline}</span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-2">
                    <Badge variant="outline" className="text-[9px] h-5 rounded-md border-border/30">{opp.source}</Badge>
                    <Badge variant="outline" className="text-[9px] h-5 rounded-md border-border/30">{opp.category}</Badge>
                  </div>

                  {selectedOpp === i && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-[10px] text-muted-foreground/70 mb-2 leading-relaxed"
                    >{opp.summary}</motion.p>
                  )}

                  <div className="flex items-center gap-2">
                    {imported ? (
                      <motion.span
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" /> Imported to Pipeline
                      </motion.span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 gap-1 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImportedIds(prev => new Set(prev).add(i));
                        }}
                      >
                        <Check className="h-3 w-3" /> Import Lead
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {importedIds.size > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-[10px] text-muted-foreground/60 text-center">{importedIds.size} lead{importedIds.size > 1 ? "s" : ""} imported</p>
              <Button onClick={onNext} className="w-full gap-1.5 min-h-[44px] rounded-xl shadow-sm">
                Analyse Lead <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Analysis ───
function AnalysisStep({
  progress, done, onStart, onNext, tab, onTabChange,
}: {
  progress: number; done: boolean; onStart: () => void; onNext: () => void;
  tab: "general" | "personnel" | "insurance"; onTabChange: (t: "general" | "personnel" | "insurance") => void;
}) {
  const hasStarted = progress > 0;

  return (
    <div className="space-y-4">
      <StepHeader icon={BarChart3} title="AI Analysis" subtitle="Alfred extracts structured data from the tender documents for this opportunity." />

      {!hasStarted && (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center ring-1 ring-primary/10">
            <FileSearch className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Tender documents ready for analysis</p>
          <Button onClick={onStart} className="gap-2 min-h-[48px] rounded-xl shadow-md shadow-primary/15">
            <Zap className="w-4 h-4" /> Analyse Tender
          </Button>
        </div>
      )}

      {hasStarted && !done && (
        <GlassCard className="py-8">
          <div className="space-y-4 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <div>
              <p className="text-sm font-medium text-foreground">Analysing documents...</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Extracting dates, requirements, personnel, and compliance data</p>
            </div>
            <div className="max-w-xs mx-auto">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground/60 mt-1.5">{Math.round(progress)}%</p>
            </div>
          </div>
        </GlassCard>
      )}

      {done && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-semibold">Analysis complete — {EXTRACTED_FIELDS.length + PERSONNEL_REQUIREMENTS.length + INSURANCE_REQUIREMENTS.length} data points extracted</span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border/30">
            {([
              { key: "general" as const, label: "General", count: EXTRACTED_FIELDS.length },
              { key: "personnel" as const, label: "Personnel", count: PERSONNEL_REQUIREMENTS.length },
              { key: "insurance" as const, label: "Insurance", count: INSURANCE_REQUIREMENTS.length },
            ]).map(t => (
              <button
                key={t.key}
                onClick={() => onTabChange(t.key)}
                className={cn(
                  "px-4 py-2.5 text-xs font-medium border-b-2 transition-all",
                  tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground/60 hover:text-foreground"
                )}
              >
                {t.label} <span className="text-[10px] opacity-60 ml-0.5">({t.count})</span>
              </button>
            ))}
          </div>

          {/* Results table */}
          <div className="rounded-xl border border-border/30 overflow-hidden max-h-[260px] overflow-y-auto">
            <div className="grid grid-cols-[1fr,1.5fr,auto] gap-0 text-xs">
              <div className="px-3.5 py-2.5 bg-muted/50 font-semibold text-muted-foreground/70 border-b border-border/30 sticky top-0 z-10 text-[11px] uppercase tracking-wider">Field</div>
              <div className="px-3.5 py-2.5 bg-muted/50 font-semibold text-muted-foreground/70 border-b border-border/30 sticky top-0 z-10 text-[11px] uppercase tracking-wider">Value</div>
              <div className="px-3.5 py-2.5 bg-muted/50 font-semibold text-muted-foreground/70 border-b border-border/30 text-right sticky top-0 z-10 text-[11px] uppercase tracking-wider">Conf.</div>
              {(tab === "general" ? EXTRACTED_FIELDS : tab === "personnel" ? PERSONNEL_REQUIREMENTS.map(p => ({ field: p.role, value: p.requirement, confidence: p.confidence })) : INSURANCE_REQUIREMENTS.map(p => ({ field: p.type, value: p.value, confidence: p.confidence }))).map((r, i) => (
                <motion.div key={i} className="contents" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                  <div className="px-3.5 py-2.5 border-b border-border/20 text-muted-foreground/70">{r.field}</div>
                  <div className="px-3.5 py-2.5 border-b border-border/20 font-medium text-foreground">{r.value}</div>
                  <div className={cn(
                    "px-3.5 py-2.5 border-b border-border/20 text-right font-semibold",
                    r.confidence >= 90 ? "text-emerald-600" : r.confidence >= 80 ? "text-amber-600" : "text-orange-500"
                  )}>{r.confidence}%</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button onClick={onNext} size="sm" className="gap-1.5 min-h-[44px] px-5 rounded-xl shadow-sm">
              Add Inputs <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Inputs ───
function InputsStep({
  chatStep, chatTyping, onAdvance, onNext,
}: {
  chatStep: number; chatTyping: boolean; onAdvance: () => void; onNext: () => void;
}) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const visible = CHAT_MESSAGES.slice(0, chatStep);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatStep, chatTyping]);

  return (
    <div className="space-y-4">
      <StepHeader icon={ClipboardList} title="Inputs & Research" subtitle="Add context, ask questions, and research against your documents and company library." />

      <div className="rounded-2xl border border-border/30 bg-muted/5 max-h-[320px] overflow-y-auto">
        <div className="p-4 space-y-3">
          {visible.length === 0 && !chatTyping && (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground/50">Tap "Send Message" to simulate a research conversation</p>
            </div>
          )}
          {visible.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={cn("rounded-xl p-3.5 text-xs leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground ml-8 rounded-br-md"
                  : "bg-card border border-border/30 mr-4 rounded-bl-md shadow-sm"
              )}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-2 text-[10px] text-muted-foreground/60">
                  <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
                    <Brain className="w-3 h-3 text-primary" />
                  </div>
                  <span className="font-semibold">alfred ai</span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </motion.div>
          ))}
          {chatTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border/30 rounded-xl p-3.5 mr-4 rounded-bl-md shadow-sm">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 mb-2">
                <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
                  <Brain className="w-3 h-3 text-primary" />
                </div>
                <span className="font-semibold">alfred ai</span>
              </div>
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <Button onClick={onAdvance} disabled={chatTyping || chatStep >= CHAT_MESSAGES.length}
          variant="outline" size="sm" className="flex-1 gap-1.5 min-h-[44px] rounded-xl">
          <Send className="w-3.5 h-3.5" />
          {chatStep === 0 ? "Send First Question" : chatStep < CHAT_MESSAGES.length ? "Send Follow-up" : "Chat Complete"}
        </Button>
        <Button onClick={onNext} size="sm" className="gap-1.5 min-h-[44px] px-5 rounded-xl shadow-sm shrink-0">
          Checklist <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 5: Checklist ───
function ChecklistStep({ checked, onToggle, onNext }: { checked: Set<string>; onToggle: (id: string) => void; onNext: () => void }) {
  const sections = ["Mandatory", "Technical", "Pricing"];
  const total = CHECKLIST_ITEMS.length;
  const done = checked.size;

  return (
    <div className="space-y-4">
      <StepHeader icon={CheckSquare} title="Submission Checklist" subtitle="Track all mandatory and technical requirements before submission." />

      <GlassCard className="!p-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground/60 font-medium">Completion</span>
              <span className="font-semibold text-foreground">{done}/{total} items</span>
            </div>
            <Progress value={(done / total) * 100} className="h-2" />
          </div>
          {done === total && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </motion.div>
          )}
        </div>
      </GlassCard>

      {sections.map(section => {
        const items = CHECKLIST_ITEMS.filter(c => c.section === section);
        return (
          <div key={section}>
            <p className="text-[11px] font-semibold text-foreground mb-2 flex items-center gap-2 uppercase tracking-wider">
              <span className={cn(
                "w-2 h-2 rounded-full",
                section === "Mandatory" ? "bg-red-500" : section === "Technical" ? "bg-blue-500" : "bg-emerald-500"
              )} />
              {section}
            </p>
            <div className="space-y-1.5">
              {items.map(item => {
                const isChecked = checked.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => onToggle(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all min-h-[44px]",
                      isChecked
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-border/30 hover:border-primary/30 hover:bg-muted/20"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                      isChecked ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground/20"
                    )}>
                      {isChecked && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={cn("text-xs", isChecked ? "text-muted-foreground/50 line-through" : "text-foreground")}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex justify-end pt-1">
        <Button onClick={onNext} size="sm" className="gap-1.5 min-h-[44px] px-5 rounded-xl shadow-sm">
          View Outline <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 6: Outline ───
function OutlineStep({ expanded, onExpand, onNext }: { expanded: string | null; onExpand: (id: string | null) => void; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <StepHeader icon={List} title="Response Outline" subtitle="AI-generated outline mapped to RFT evaluation criteria." />

      <div className="space-y-2">
        {OUTLINE_SECTIONS.map((s, index) => {
          const isExpanded = expanded === s.id;
          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
              <button
                onClick={() => onExpand(isExpanded ? null : s.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 p-3.5 rounded-xl border transition-all text-left min-h-[48px]",
                  isExpanded
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/30 hover:border-primary/20 hover:bg-muted/20"
                )}
              >
                <Badge variant="secondary" className="text-[10px] shrink-0 font-mono rounded-md">{s.section}</Badge>
                <span className="text-xs font-medium text-foreground flex-1 min-w-0">{s.title}</span>
                <span className="text-[10px] text-muted-foreground/50 shrink-0 font-medium">{s.wordLimit}w</span>
                <ChevronDown className={cn(
                  "w-3.5 h-3.5 text-muted-foreground/40 shrink-0 transition-transform duration-200",
                  isExpanded && "rotate-180"
                )} />
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3.5 ml-4 border-l-2 border-primary/20 mt-1.5 space-y-2">
                      <p className="text-xs text-muted-foreground/70 leading-relaxed">
                        This section will address the evaluation criteria for {s.title.toLowerCase()}. Alfred will draft content using extracted requirements, accepted strategies, and your company library.
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Max {s.wordLimit} words</span>
                        <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Ready for drafting</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <div className="flex justify-end pt-1">
        <Button onClick={onNext} size="sm" className="gap-1.5 min-h-[44px] px-5 rounded-xl shadow-sm">
          Start Writing <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 7: Writing ───
function WritingStep({
  drafting, drafted, onDraft, onNext,
}: {
  drafting: string | null; drafted: Set<string>; onDraft: (id: string) => void; onNext: () => void;
}) {
  return (
    <div className="space-y-4">
      <StepHeader icon={PenTool} title="AI-Assisted Writing" subtitle="Alfred drafts each section using your inputs, strategies, and library." />

      <div className="space-y-2.5">
        {WRITING_SECTIONS.map((s, index) => {
          const isDrafted = drafted.has(s.id);
          const isDrafting = drafting === s.id;
          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
              <GlassCard className={cn(
                "transition-all",
                isDrafted && "!border-emerald-500/20 !bg-emerald-500/5",
                isDrafting && "!border-primary/30 !bg-primary/5"
              )}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px] font-mono rounded-md">{s.section}</Badge>
                      {isDrafted && (
                        <motion.span
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-semibold flex items-center gap-0.5"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" /> Drafted
                        </motion.span>
                      )}
                      {isDrafting && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold flex items-center gap-0.5">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Writing...
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground font-medium">{s.title}</p>
                  </div>
                  {!isDrafted && !isDrafting && (
                    <Button variant="outline" size="sm" onClick={() => onDraft(s.id)} className="shrink-0 text-[10px] h-8 px-3 gap-1 rounded-lg">
                      <Zap className="w-3 h-3" /> Draft
                    </Button>
                  )}
                </div>

                {isDrafted && (
                  <div className="mt-2 p-3 rounded-xl bg-muted/30 border border-border/20">
                    <p className="text-[10px] text-muted-foreground/70 leading-relaxed whitespace-pre-wrap line-clamp-4">{s.draft}</p>
                    <div className="flex items-center justify-between mt-2.5 text-[10px]">
                      <span className="text-muted-foreground/50">{s.wordCount} / {s.wordLimit} words</span>
                      <span className="text-primary cursor-pointer font-semibold hover:underline">Edit →</span>
                    </div>
                  </div>
                )}

                {isDrafting && (
                  <div className="mt-2 p-3 rounded-xl bg-muted/30 border border-border/20 space-y-2">
                    <div className="h-2 bg-primary/15 rounded-full animate-pulse w-full" />
                    <div className="h-2 bg-primary/15 rounded-full animate-pulse w-4/5" />
                    <div className="h-2 bg-primary/15 rounded-full animate-pulse w-3/5" />
                    <div className="h-2 bg-primary/15 rounded-full animate-pulse w-5/6" />
                  </div>
                )}
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      <div className="flex justify-end pt-1">
        <Button onClick={onNext} size="sm" className="gap-1.5 min-h-[44px] px-5 rounded-xl shadow-sm">
          Generate Document <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 8: Generate ───
function GenerateStep({ generating, generated, onGenerate }: { generating: boolean; generated: boolean; onGenerate: () => void }) {
  return (
    <div className="space-y-5">
      <StepHeader icon={Sparkles} title="Generate Final Document" subtitle="Compile all sections into a submission-ready bid document." />

      {!generating && !generated && (
        <div className="text-center py-8 space-y-5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto ring-1 ring-primary/10">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">Ready to generate</p>
            <p className="text-xs text-muted-foreground/60 mt-1">8 sections • 2 drafted responses • 3 source documents</p>
          </div>
          <Button onClick={onGenerate} size="lg" className="gap-2.5 min-h-[52px] px-8 rounded-xl shadow-lg shadow-primary/20">
            <Sparkles className="w-4 h-4" /> Generate Bid Document
          </Button>
        </div>
      )}

      {generating && (
        <GlassCard className="py-8">
          <div className="text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Generating bid document...</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Compiling sections, formatting tables, and applying branding</p>
            </div>
            <div className="max-w-xs mx-auto space-y-2.5">
              {["Compiling executive summary", "Formatting methodology section", "Inserting CV profiles", "Generating risk register", "Applying document template"].map((task, i) => (
                <motion.div
                  key={task}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.5 }}
                  className="flex items-center gap-2.5 text-xs text-muted-foreground/70"
                >
                  {i < 3 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />}
                  <span>{task}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      {generated && (
        <div className="space-y-4">
          {/* Document Preview — styled like a real PDF page */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-border/50 shadow-lg overflow-hidden"
          >
            {/* PDF Header Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">SMW_StationFitOut_Pkg3_Submission.pdf</p>
                  <p className="text-[9px] text-muted-foreground/50">8 sections • 4,200 words</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] h-5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Ready</Badge>
            </div>

            {/* Simulated Document Body */}
            <div className="px-6 py-5 space-y-4 max-h-[420px] overflow-y-auto text-foreground" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
              <div className="text-center pb-3 border-b border-border/20">
                <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Tender Submission</p>
                <h4 className="text-base font-bold leading-tight text-foreground">City Metro West — Station Fit-Out Package 3</h4>
                <p className="text-[10px] text-muted-foreground mt-1">Prepared for: City Metro Authority &nbsp;|&nbsp; Ref: SMW-PKG3-2026</p>
                <p className="text-[10px] text-muted-foreground/70">March 2026 &nbsp;|&nbsp; Confidential</p>
              </div>

              {/* Table of Contents */}
              <div className="bg-muted/20 rounded-lg p-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-foreground mb-2">Table of Contents</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  {["1. Executive Summary", "2. Methodology & Approach", "3. Key Personnel", "4. Risk Register", "5. WHS Management Plan", "6. Programme & Milestones", "7. Pricing Schedule", "8. Appendices"].map((s, i) => (
                    <p key={i} className="text-[9px] text-foreground/80 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-primary/40" />
                      {s}
                    </p>
                  ))}
                </div>
              </div>

              {/* Section 1 */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80 mb-1">1. Executive Summary</p>
                <p className="text-[10px] leading-relaxed text-foreground/90">
                  We are pleased to submit our response to City Metro West Station Fit-Out Package 3. Our team brings 15+ years of tier-1 rail fit-out experience, delivering $280M+ in comparable projects across NSW and VIC. This submission demonstrates our capacity to meet the accelerated 18-month programme with a safety-first approach and proven local supply chain.
                </p>
                <div className="mt-2 bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-2">
                  <p className="text-[9px] font-semibold text-emerald-700 mb-1">Key Differentiators</p>
                  <ul className="text-[9px] text-foreground/80 space-y-0.5 list-disc list-inside">
                    <li>Delivered 4 similar station fit-outs valued $50M–$120M each</li>
                    <li>In-house BIM capability with Level 2 certification</li>
                    <li>90%+ local subcontractor network within Greater Sydney</li>
                  </ul>
                </div>
              </div>

              {/* Section 2 */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80 mb-1">2. Methodology & Approach</p>
                <p className="text-[10px] leading-relaxed text-foreground/90">
                  Our delivery methodology centres on a phased mobilisation across three stations, commencing with early procurement of long-lead items (Months 1–3). BIM-coordinated installation sequences will be managed through a digital twin, enabling real-time clash detection and progress tracking.
                </p>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {[
                    { phase: "Phase 1: Mobilisation", time: "Months 1–3", desc: "Procurement & staging" },
                    { phase: "Phase 2: Installation", time: "Months 4–14", desc: "Station-by-station rollout" },
                    { phase: "Phase 3: Commissioning", time: "Months 15–18", desc: "Testing & handover" },
                  ].map((p) => (
                    <div key={p.phase} className="bg-muted/30 rounded-lg p-2">
                      <p className="text-[9px] font-semibold text-foreground">{p.phase}</p>
                      <p className="text-[8px] text-foreground/70">{p.time}</p>
                      <p className="text-[8px] text-foreground/60">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3 */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80 mb-1">3. Key Personnel</p>
                <div className="space-y-1.5">
                  {[
                    { name: "Sarah Mitchell", role: "Project Director", exp: "22 yrs rail infrastructure", quals: "CPEng, RPEQ" },
                    { name: "John Smith", role: "Construction Manager", exp: "Metro NW, Western Highway", quals: "Cert IV WHS" },
                    { name: "Priya Sharma", role: "Design Manager", exp: "BIM Level 2 certified", quals: "B.Eng (Hons)" },
                    { name: "David Thompson", role: "WHS Manager", exp: "12 yrs rail safety", quals: "Dip WHS, Lead Auditor" },
                  ].map((p) => (
                    <div key={p.name} className="flex items-center gap-2 bg-muted/20 rounded-lg p-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[8px] font-bold text-primary">{p.name.split(" ").map(n => n[0]).join("")}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] font-semibold text-foreground">{p.name} — {p.role}</p>
                        <p className="text-[8px] text-foreground/70">{p.exp} &nbsp;•&nbsp; {p.quals}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4 */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80 mb-1">4. Risk Register</p>
                <div className="space-y-1">
                  {[
                    { risk: "Supply chain delays on imported finishes", rating: "High", mitigation: "Pre-order + local alternatives identified", owner: "SM" },
                    { risk: "Interface clash with services contractor", rating: "Med", mitigation: "Weekly BIM coordination meetings", owner: "JC" },
                    { risk: "Heritage overlay restrictions at Station B", rating: "Med", mitigation: "Heritage advisor engaged from Day 1", owner: "PS" },
                    { risk: "Labour shortages during peak construction", rating: "High", mitigation: "Workforce pipeline via 3 labour hire partners", owner: "JC" },
                    { risk: "Commissioning delays due to defects", rating: "Low", mitigation: "Progressive commissioning with early completion incentives", owner: "DT" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-[9px]">
                      <Badge variant="outline" className={cn(
                        "text-[8px] h-4 shrink-0 mt-0.5",
                        r.rating === "High" ? "border-red-300 text-red-600 bg-red-50" : r.rating === "Med" ? "border-amber-300 text-amber-600 bg-amber-50" : "border-emerald-300 text-emerald-600 bg-emerald-50"
                      )}>{r.rating}</Badge>
                      <div className="flex-1">
                      <span className="font-medium text-foreground">{r.risk}</span>
                      <span className="text-foreground/70"> — {r.mitigation}</span>
                      </div>
                      <span className="text-[8px] text-foreground/60 shrink-0">{r.owner}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: WHS */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80 mb-1">5. WHS Management Plan</p>
                <p className="text-[10px] leading-relaxed text-foreground/90">
                  Our WHS management system is certified to ISO 45001:2018. The project-specific WHS Plan addresses rail corridor safety, working at heights, electrical isolation, and public interface management across all three station sites.
                </p>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {[
                    { label: "LTIFR Target", value: "0.0" },
                    { label: "Toolbox Talks", value: "Daily" },
                    { label: "Safety Audits", value: "Weekly" },
                    { label: "ISO Cert", value: "45001" },
                  ].map((s) => (
                    <div key={s.label} className="text-center bg-muted/20 rounded-lg p-1.5">
                      <p className="text-[10px] font-bold text-foreground tabular-nums">{s.value}</p>
                      <p className="text-[8px] text-foreground/70">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 6: Programme */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80 mb-1">6. Programme & Milestones</p>
                <div className="space-y-1">
                  {[
                    { milestone: "Contract Award & Mobilisation", date: "Apr 2026", status: "Planned" },
                    { milestone: "Station A — Fit-Out Complete", date: "Oct 2026", status: "Planned" },
                    { milestone: "Station B — Fit-Out Complete", date: "Apr 2027", status: "Planned" },
                    { milestone: "Station C — Fit-Out Complete", date: "Aug 2027", status: "Planned" },
                    { milestone: "Final Commissioning & Handover", date: "Oct 2027", status: "Planned" },
                  ].map((m) => (
                    <div key={m.milestone} className="flex items-center gap-2 text-[9px]">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                      <span className="font-medium text-foreground flex-1">{m.milestone}</span>
                      <span className="text-foreground/70 shrink-0">{m.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 7: Pricing */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80 mb-1">7. Pricing Schedule</p>
                <div className="bg-muted/20 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-3 text-[8px] font-semibold text-foreground bg-muted/40 p-2 gap-2">
                    <span>Item</span><span className="text-right">Amount</span><span className="text-right">% of Total</span>
                  </div>
                  {[
                    { item: "Preliminaries & General", amount: "$1,240,000", pct: "10%" },
                    { item: "Architectural Finishes", amount: "$3,720,000", pct: "30%" },
                    { item: "M&E Services", amount: "$2,976,000", pct: "24%" },
                    { item: "Platform Screen Doors", amount: "$1,860,000", pct: "15%" },
                    { item: "Signage & Wayfinding", amount: "$744,000", pct: "6%" },
                    { item: "Commissioning & Testing", amount: "$620,000", pct: "5%" },
                    { item: "Contingency (10%)", amount: "$1,240,000", pct: "10%" },
                  ].map((row) => (
                    <div key={row.item} className="grid grid-cols-3 text-[9px] p-2 gap-2 border-t border-border/10">
                      <span className="text-foreground">{row.item}</span>
                      <span className="text-right font-medium text-foreground">{row.amount}</span>
                      <span className="text-right text-foreground/70">{row.pct}</span>
                    </div>
                  ))}
                  <div className="grid grid-cols-3 text-[9px] p-2 gap-2 border-t-2 border-primary/20 bg-primary/5">
                    <span className="font-bold text-foreground">Total (excl. GST)</span>
                    <span className="text-right font-bold text-foreground tabular-nums">$12,400,000</span>
                    <span className="text-right font-bold text-foreground tabular-nums">100%</span>
                  </div>
                </div>
              </div>

              {/* Section 8 */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80 mb-1">8. Appendices</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    "A — Company Profile & Org Chart",
                    "B — Relevant Project Experience",
                    "C — CVs of Key Personnel",
                    "D — Insurance Certificates",
                    "E — Quality Management Plan",
                    "F — Environmental Management Plan",
                  ].map((a) => (
                    <div key={a} className="flex items-center gap-1.5 text-[9px] text-muted-foreground/70 bg-muted/15 rounded-lg p-1.5">
                      <FileText className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                      {a}
                    </div>
                  ))}
                </div>
              </div>

              {/* Document footer */}
              <div className="text-center pt-3 border-t border-border/20">
                <p className="text-[8px] text-muted-foreground/40">This document is commercial-in-confidence. Prepared by AlfredBID AI • Page 1 of 42</p>
              </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 border-t border-border/30">
              <div className="text-center py-2.5 border-r border-border/20">
                <p className="text-sm font-bold text-emerald-600 tabular-nums">8/8</p>
                <p className="text-[9px] text-muted-foreground/50">Sections</p>
              </div>
              <div className="text-center py-2.5 border-r border-border/20">
                <p className="text-sm font-bold text-primary tabular-nums">100%</p>
                <p className="text-[9px] text-muted-foreground/50">Complete</p>
              </div>
              <div className="text-center py-2.5">
                <p className="text-sm font-bold text-amber-600 tabular-nums">2</p>
                <p className="text-[9px] text-muted-foreground/50">Flagged</p>
              </div>
            </div>
          </motion.div>

          {/* CTAs */}
          <div className="pt-2 border-t border-border/20">
            <Button size="lg" className="w-full gap-2 min-h-[48px] rounded-xl shadow-lg shadow-primary/20" onClick={() => window.open("https://bid.alfredai.app", "_blank")}>
              <ExternalLink className="w-4 h-4" /> Try AlfredBID — Full Version
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
