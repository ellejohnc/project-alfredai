import { useState, useEffect, useRef, useCallback } from "react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import {
  Handshake,
  Users,
  Building2,
  Target,
  Sparkles,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Star,
  Zap,
  Award,
  TrendingUp,
  Calendar,
  Mail,
  Heart,
  Briefcase,
  BarChart3,
  Grid3X3,
  List,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Upload,
  FileText,
  Settings2,
  ArrowLeft,
  Linkedin,
  ExternalLink,
  Phone,
  Search,
  UserPlus,
  X,
  Volume2,
  VolumeX,
  Play,
  MapPin,
  DollarSign,
  Globe,
  Clock,
  Database,
  RefreshCw,
  Link2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ConfettiCelebration } from "@/components/results/ConfettiCelebration";

// Types
type MatchSignal = {
  type: string;
  title: string;
  description: string;
  date: string;
};

type MatchContact = {
  name: string;
  title: string;
  email: string;
  phone: string;
};

type MatchMetrics = {
  strategicFit: number;
  operationalReadiness: number;
  financialCapability: number;
  relationshipTiming: number;
  decisionPower: number;
  legalContractual: number;
  trustRisk: number;
};

type CompanyScale = {
  employees: number;
  linkedinFollowers: number;
  yrGrowth: string;
  headquarters: string;
  locations: number;
  countries: string;
  revenueRange: string;
  valuation: string;
  revGrowthYoY: string;
  webVisitors: number;
  digitalScore: number;
};

type Match = {
  id: string;
  name: string;
  industries: string[];
  matchScore: number;
  industryFit: number;
  techMatch: number;
  signals: { status: string; hiring: boolean; funded?: string };
  description: string;
  metrics: MatchMetrics;
  scale: CompanyScale;
  topSignals: MatchSignal[];
  contacts: MatchContact[];
  linkedinUrl: string;
  websiteUrl: string;
};

type DemoStep = "source" | "processing" | "results";
type ResultView = "matches" | "heatmap" | "radial";
type SortOrder = "score-desc" | "score-asc" | "a-z" | "z-a";
type ViewMode = "grid" | "list";
type DataSource = "csv" | "crm" | null;

// Inline hint component
const InlineHint = ({ message, show }: { message: string; show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: -5, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -5, scale: 0.95 }}
        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50"
      >
        <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 rotate-45" />
          <span className="relative">{message}</span>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Sound hook
const useDemoSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number = 0.1, volume: number = 0.12) => {
    if (!enabledRef.current) return;
    try {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") ctx.resume();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration + 0.05);
    } catch (e) {
      console.debug("Audio not supported:", e);
    }
  }, [getAudioContext]);

  const playClick = useCallback(() => playTone(880, 0.05, 0.08), [playTone]);
  const playSuccess = useCallback(() => {
    playTone(528, 0.15, 0.1);
    setTimeout(() => playTone(660, 0.15, 0.1), 80);
  }, [playTone]);
  const playCelebration = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      const chord = [523.25, 659.25, 783.99];
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, now + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.5);
      });
    } catch (e) {
      console.debug("Audio not supported:", e);
    }
  }, [getAudioContext]);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  return { playClick, playSuccess, playCelebration, setEnabled, isEnabled: () => enabledRef.current };
};

// Mock data
const mockMatches: Match[] = [
  {
    id: "1",
    name: "Hammond Nguyen Turnbull",
    industries: ["Legal Services", "Family Law", "Commercial Law"],
    matchScore: 85,
    industryFit: 90,
    techMatch: 70,
    signals: { status: "N/A", hiring: true },
    description: "Hammond Nguyen Turnbull is a full-service law firm in Australia offering legal services across various practice areas.",
    metrics: { strategicFit: 18, operationalReadiness: 8, financialCapability: 18, relationshipTiming: 12, decisionPower: 14, legalContractual: 9, trustRisk: 14 },
    scale: { employees: 65, linkedinFollowers: 434, yrGrowth: "10%", headquarters: "Parramatta, Australia", locations: 1, countries: "Australia", revenueRange: "$1M - $5M", valuation: "N/A", revGrowthYoY: "10%", webVisitors: 5000, digitalScore: 30 },
    topSignals: [
      { type: "Expansion", title: "Celebrating a decade of HNT", description: "Marking 10 years of service to clients across Australia.", date: "2025-01-01" },
      { type: "Hiring", title: "Expanding Legal Team", description: "Currently hiring new solicitors to meet client demand.", date: "2025-01-01" }
    ],
    contacts: [
      { name: "Hammond Nguyen Turnbull", title: "Reception", email: "reception@hntlegal.com.au", phone: "1998592992" },
      { name: "Maria Valenzuela", title: "Partner - Family & Relationship Law", email: "maria@hntlegal.com.au", phone: "+61422596887" }
    ],
    linkedinUrl: "https://linkedin.com/company/hnt-legal",
    websiteUrl: "https://hntlegal.com.au"
  },
  {
    id: "2",
    name: "Planix Projects",
    industries: ["Construction", "Project Management"],
    matchScore: 85,
    industryFit: 90,
    techMatch: 75,
    signals: { status: "N/A", hiring: true },
    description: "Planix Projects is a construction and project management firm specializing in commercial developments.",
    metrics: { strategicFit: 17, operationalReadiness: 9, financialCapability: 16, relationshipTiming: 13, decisionPower: 13, legalContractual: 8, trustRisk: 13 },
    scale: { employees: 45, linkedinFollowers: 892, yrGrowth: "15%", headquarters: "Sydney, Australia", locations: 2, countries: "Australia", revenueRange: "$5M - $10M", valuation: "N/A", revGrowthYoY: "15%", webVisitors: 3200, digitalScore: 42 },
    topSignals: [
      { type: "Growth", title: "New Office Opening", description: "Expanding operations with a new Melbourne office.", date: "2025-01-15" }
    ],
    contacts: [
      { name: "David Chen", title: "Director", email: "david@planixprojects.com.au", phone: "+61298765432" }
    ],
    linkedinUrl: "https://linkedin.com/company/planix-projects",
    websiteUrl: "https://planixprojects.com.au"
  },
  {
    id: "3",
    name: "Urban Legal",
    industries: ["Legal Services", "Planning Law"],
    matchScore: 85,
    industryFit: 95,
    techMatch: 80,
    signals: { status: "Self-funded", hiring: true },
    description: "Urban Legal specializes in planning and development law for property developers.",
    metrics: { strategicFit: 19, operationalReadiness: 10, financialCapability: 17, relationshipTiming: 14, decisionPower: 15, legalContractual: 10, trustRisk: 15 },
    scale: { employees: 28, linkedinFollowers: 567, yrGrowth: "12%", headquarters: "Brisbane, Australia", locations: 1, countries: "Australia", revenueRange: "$2M - $5M", valuation: "N/A", revGrowthYoY: "12%", webVisitors: 2800, digitalScore: 38 },
    topSignals: [
      { type: "Partnership", title: "Strategic Alliance", description: "Formed partnership with major property developer.", date: "2024-12-15" }
    ],
    contacts: [
      { name: "Sarah Thompson", title: "Managing Partner", email: "sarah@urbanlegal.com.au", phone: "+61734567890" }
    ],
    linkedinUrl: "https://linkedin.com/company/urban-legal",
    websiteUrl: "https://urbanlegal.com.au"
  },
  {
    id: "4",
    name: "Amplify HR",
    industries: ["HR Consulting", "Fractional HR"],
    matchScore: 85,
    industryFit: 90,
    techMatch: 75,
    signals: { status: "Bootstrapped", hiring: true },
    description: "Amplify HR provides fractional HR services for growing businesses.",
    metrics: { strategicFit: 16, operationalReadiness: 11, financialCapability: 15, relationshipTiming: 12, decisionPower: 12, legalContractual: 8, trustRisk: 13 },
    scale: { employees: 15, linkedinFollowers: 1234, yrGrowth: "25%", headquarters: "Melbourne, Australia", locations: 1, countries: "Australia", revenueRange: "$500K - $1M", valuation: "N/A", revGrowthYoY: "25%", webVisitors: 4500, digitalScore: 55 },
    topSignals: [
      { type: "Funding", title: "Bootstrapped Growth", description: "Achieved 25% YoY growth without external funding.", date: "2024-11-01" }
    ],
    contacts: [
      { name: "Jessica Lee", title: "Founder", email: "jessica@amplifyhr.com.au", phone: "+61412345678" }
    ],
    linkedinUrl: "https://linkedin.com/company/amplify-hr",
    websiteUrl: "https://amplifyhr.com.au"
  },
  {
    id: "5",
    name: "The Agency Accelerators",
    industries: ["B2B", "Client Acquisition"],
    matchScore: 85,
    industryFit: 90,
    techMatch: 80,
    signals: { status: "Self-funded", hiring: true },
    description: "The Agency Accelerators helps B2B companies scale their client acquisition.",
    metrics: { strategicFit: 18, operationalReadiness: 12, financialCapability: 16, relationshipTiming: 14, decisionPower: 14, legalContractual: 9, trustRisk: 14 },
    scale: { employees: 22, linkedinFollowers: 2100, yrGrowth: "30%", headquarters: "Sydney, Australia", locations: 1, countries: "Australia, UK", revenueRange: "$1M - $3M", valuation: "N/A", revGrowthYoY: "30%", webVisitors: 8500, digitalScore: 72 },
    topSignals: [
      { type: "Expansion", title: "UK Market Entry", description: "Launching operations in the United Kingdom.", date: "2025-02-01" }
    ],
    contacts: [
      { name: "Michael Roberts", title: "CEO", email: "michael@agencyaccelerators.com", phone: "+61423456789" }
    ],
    linkedinUrl: "https://linkedin.com/company/agency-accelerators",
    websiteUrl: "https://agencyaccelerators.com"
  },
  {
    id: "6",
    name: "AMR Security",
    industries: ["Security Systems", "Electronic Security"],
    matchScore: 85,
    industryFit: 90,
    techMatch: 80,
    signals: { status: "Not publicly disclosed", hiring: true },
    description: "AMR Security provides electronic security solutions for commercial properties.",
    metrics: { strategicFit: 17, operationalReadiness: 10, financialCapability: 18, relationshipTiming: 11, decisionPower: 13, legalContractual: 9, trustRisk: 14 },
    scale: { employees: 85, linkedinFollowers: 678, yrGrowth: "8%", headquarters: "Perth, Australia", locations: 3, countries: "Australia", revenueRange: "$10M - $20M", valuation: "N/A", revGrowthYoY: "8%", webVisitors: 3800, digitalScore: 45 },
    topSignals: [
      { type: "Hiring", title: "Currently hiring for various positions", description: "Expanding team across multiple locations.", date: "2025-01-10" }
    ],
    contacts: [
      { name: "Andrew Mitchell", title: "Sales Director", email: "andrew@amrsecurity.com.au", phone: "+61897654321" }
    ],
    linkedinUrl: "https://linkedin.com/company/amr-security",
    websiteUrl: "https://amrsecurity.com.au"
  }
];

// CRM options
const crmOptions = [
  { id: "hubspot", name: "HubSpot", icon: "🟠", connected: false },
  { id: "salesforce", name: "Salesforce", icon: "☁️", connected: false },
  { id: "pipedrive", name: "Pipedrive", icon: "🟢", connected: false },
  { id: "zoho", name: "Zoho CRM", icon: "🔴", connected: false },
];

interface BusinessMatchMakerDemoProps {
  onDemoComplete?: () => void;
}

export default function BusinessMatchMakerDemo({ onDemoComplete }: BusinessMatchMakerDemoProps = {}) {
  // State
  const [step, setStep] = useState<DemoStep>("source");
  const [dataSource, setDataSource] = useState<DataSource>(null);
  const [resultView, setResultView] = useState<ResultView>("matches");
  const [sortOrder, setSortOrder] = useState<SortOrder>("score-desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [savedMatches, setSavedMatches] = useState<Set<string>>(new Set());
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [csvUploaded, setCsvUploaded] = useState(false);
  const [crmSyncing, setCrmSyncing] = useState<string | null>(null);
  const [crmConnected, setCrmConnected] = useState<string | null>(null);
  const [activeHint, setActiveHint] = useState<string | null>(null);

  const sounds = useDemoSounds();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewTabsRef = useRef<HTMLDivElement>(null);

  // Scroll arrows for view tabs
  const scrollViewTabs = (direction: "left" | "right") => {
    if (viewTabsRef.current) {
      const scrollAmount = 100;
      viewTabsRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Swipe navigation for result views
  const resultViewOrder: ResultView[] = ["matches", "heatmap", "radial"];
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeNavigation({
    items: resultViewOrder,
    activeItem: resultView,
    onNavigate: setResultView,
  });

  // Sort matches
  const sortedMatches = [...mockMatches].sort((a, b) => {
    switch (sortOrder) {
      case "score-desc": return b.matchScore - a.matchScore;
      case "score-asc": return a.matchScore - b.matchScore;
      case "a-z": return a.name.localeCompare(b.name);
      case "z-a": return b.name.localeCompare(a.name);
      default: return 0;
    }
  });

  // Processing simulation
  useEffect(() => {
    if (step === "processing") {
      const interval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setStep("results");
              setShowCelebration(true);
              if (soundEnabled) sounds.playCelebration();
              // Fire completion callback
              onDemoComplete?.();
            }, 300);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [step, soundEnabled, sounds, onDemoComplete]);

  // Show hint briefly then hide
  const showHint = (hintId: string) => {
    setActiveHint(hintId);
    setTimeout(() => setActiveHint(null), 2500);
  };

  // Handlers
  const handleCSVUpload = () => {
    if (soundEnabled) sounds.playSuccess();
    setCsvUploaded(true);
    setDataSource("csv");
  };

  const handleCRMSync = (crmId: string) => {
    if (soundEnabled) sounds.playClick();
    setCrmSyncing(crmId);
    setTimeout(() => {
      setCrmSyncing(null);
      setCrmConnected(crmId);
      setDataSource("crm");
      if (soundEnabled) sounds.playSuccess();
    }, 1500);
  };

  const handleRunMatching = () => {
    if (soundEnabled) sounds.playSuccess();
    setProcessingProgress(0);
    setStep("processing");
  };

  const handleToggleSave = (matchId: string) => {
    if (soundEnabled) sounds.playClick();
    setSavedMatches(prev => {
      const next = new Set(prev);
      if (next.has(matchId)) {
        next.delete(matchId);
      } else {
        next.add(matchId);
      }
      return next;
    });
  };

  const handleRestart = () => {
    if (soundEnabled) sounds.playClick();
    setStep("source");
    setDataSource(null);
    setCsvUploaded(false);
    setCrmConnected(null);
    setProcessingProgress(0);
  };

  // Render match card (compact for visibility)
  const renderMatchCard = (match: Match, index: number) => (
    <motion.div
      key={match.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-md transition-all cursor-pointer"
      onClick={() => {
        if (soundEnabled) sounds.playClick();
        setSelectedMatch(match);
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <h4 className="font-semibold text-slate-900 text-xs truncate">{match.name}</h4>
          <Linkedin className="w-3 h-3 text-[#0077B5] shrink-0" />
        </div>
        <Badge className="bg-rose-500 text-white font-bold text-[10px] shrink-0">{match.matchScore}%</Badge>
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {match.industries.slice(0, 2).map((ind, i) => (
          <Badge key={i} variant="outline" className="text-[9px] py-0 bg-slate-50 border-slate-200">
            {ind}
          </Badge>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 h-6 text-[10px] text-rose-500 border-rose-200 hover:bg-rose-50"
          onClick={(e) => {
            e.stopPropagation();
            if (soundEnabled) sounds.playClick();
            setSelectedMatch(match);
          }}
        >
          Details
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-6 w-6 p-0", savedMatches.has(match.id) ? "text-rose-500" : "text-slate-300")}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleSave(match.id);
          }}
        >
          <Heart className={cn("w-3 h-3", savedMatches.has(match.id) && "fill-current")} />
        </Button>
      </div>
    </motion.div>
  );

  // Render metric bar
  const renderMetricBar = (label: string, value: number, max: number) => (
    <div className="flex items-center gap-3 text-xs">
      <span className="text-slate-600 w-40 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500"
        />
      </div>
      <span className="text-slate-700 w-10 text-right">{value}/{max}</span>
    </div>
  );

  const canProceed = csvUploaded || crmConnected;

  return (
    <div 
      ref={containerRef}
      className="bg-slate-50 rounded-2xl border border-slate-200 shadow-xl overflow-hidden h-[520px] flex flex-col relative"
      onTouchStart={step === "results" ? handleTouchStart : undefined}
      onTouchMove={step === "results" ? handleTouchMove : undefined}
      onTouchEnd={step === "results" ? handleTouchEnd : undefined}
    >
      {/* Celebration */}
      <ConfettiCelebration 
        trigger={showCelebration} 
        onComplete={() => setShowCelebration(false)}
        playSound={soundEnabled ? sounds.playCelebration : undefined}
      />

      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600 flex items-center justify-center shrink-0">
              <Handshake className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm">Business Matchmaking</h3>
              <p className="text-[10px] text-slate-500">AI-Powered Partner Discovery</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-slate-400"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              sounds.setEnabled(!soundEnabled);
            }}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Toolbar - shown on results */}
      {step === "results" && (
        <div className="px-3 py-2 border-b border-slate-200 bg-white flex items-center gap-1.5 flex-wrap shrink-0">
          <Button variant="outline" size="sm" className="h-6 text-[10px] text-teal-600 border-teal-200" onClick={handleRestart}>
            <ArrowLeft className="w-3 h-3 mr-1" />
            Restart
          </Button>
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-6 text-[10px]"
              onClick={() => showHint("saved")}
            >
              <Heart className="w-3 h-3 mr-1" />
              Saved ({savedMatches.size})
            </Button>
            <InlineHint message="View your saved matches here" show={activeHint === "saved"} />
          </div>
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-6 text-[10px]"
              onClick={() => showHint("activity")}
            >
              <FileText className="w-3 h-3 mr-1" />
              Activity
            </Button>
            <InlineHint message="Activity log coming soon" show={activeHint === "activity"} />
          </div>
          <div className="relative">
            <Button 
              size="sm" 
              className="h-6 text-[10px] bg-rose-500 hover:bg-rose-600 text-white"
              onClick={() => showHint("export")}
            >
              <Upload className="w-3 h-3 mr-1" />
              Export
            </Button>
            <InlineHint message="Export to CSV or CRM" show={activeHint === "export"} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* SOURCE STEP - Data Source Selection */}
          {step === "source" && (
            <motion.div
              key="source"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col p-4"
            >
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-slate-900 mb-1">
                  Connect Your Data
                </h2>
                <p className="text-slate-500 text-xs">
                  Choose how to import your prospect list for AI matching
                </p>
              </div>

              {/* Data Source Options */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* CSV Upload */}
                <motion.div
                  className={cn(
                    "relative bg-white rounded-xl border-2 p-4 cursor-pointer transition-all",
                    csvUploaded 
                      ? "border-emerald-500 bg-emerald-50" 
                      : dataSource === null || dataSource === "csv"
                        ? "border-slate-200 hover:border-rose-300 hover:shadow-md"
                        : "border-slate-100 opacity-50"
                  )}
                  whileHover={!csvUploaded ? { scale: 1.02 } : {}}
                  whileTap={!csvUploaded ? { scale: 0.98 } : {}}
                  onClick={!csvUploaded ? handleCSVUpload : undefined}
                >
                  {!csvUploaded && dataSource === null && (
                    <motion.div
                      className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-rose-400 to-rose-500 opacity-0"
                      animate={{ opacity: [0, 0.5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  <div className="relative">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
                      csvUploaded ? "bg-emerald-500" : "bg-rose-100"
                    )}>
                      {csvUploaded ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <Upload className="w-5 h-5 text-rose-500" />
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm mb-1">Upload CSV</h3>
                    <p className="text-[10px] text-slate-500 mb-2">Import a list from spreadsheet</p>
                    {csvUploaded ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 text-xs">
                        <FileText className="w-3 h-3" />
                        <span>prospects.csv (847 rows)</span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400">Click to simulate upload</p>
                    )}
                  </div>
                </motion.div>

                {/* CRM Sync */}
                <div className={cn(
                  "bg-white rounded-xl border-2 p-4 transition-all",
                  crmConnected 
                    ? "border-emerald-500 bg-emerald-50" 
                    : dataSource === null || dataSource === "crm"
                      ? "border-slate-200"
                      : "border-slate-100 opacity-50"
                )}>
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
                    crmConnected ? "bg-emerald-500" : "bg-teal-100"
                  )}>
                    {crmConnected ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <Database className="w-5 h-5 text-teal-500" />
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-1">Sync from CRM</h3>
                  <p className="text-[10px] text-slate-500 mb-2">Connect to your CRM</p>
                  
                  {crmConnected ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs">
                      <Link2 className="w-3 h-3" />
                      <span>{crmOptions.find(c => c.id === crmConnected)?.name} synced</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                      {crmOptions.map((crm) => (
                        <button
                          key={crm.id}
                          onClick={() => handleCRMSync(crm.id)}
                          disabled={crmSyncing !== null}
                          className={cn(
                            "flex items-center gap-1.5 p-1.5 rounded-lg border text-[10px] transition-all",
                            crmSyncing === crm.id 
                              ? "border-teal-400 bg-teal-50" 
                              : "border-slate-200 hover:border-teal-300 hover:bg-teal-50"
                          )}
                        >
                          {crmSyncing === crm.id ? (
                            <RefreshCw className="w-3 h-3 text-teal-500 animate-spin" />
                          ) : (
                            <span>{crm.icon}</span>
                          )}
                          <span className="truncate">{crm.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Status indicator */}
              {(csvUploaded || crmConnected) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4"
                >
                  <div className="flex items-center gap-2 text-emerald-700 text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium">
                      {csvUploaded ? "847 prospects loaded from CSV" : `Synced 1,204 contacts from ${crmOptions.find(c => c.id === crmConnected)?.name}`}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Run Analysis Button */}
              <div className="mt-auto">
                <motion.div
                  animate={canProceed ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 1.5, repeat: canProceed ? Infinity : 0 }}
                >
                  <Button 
                    className={cn(
                      "w-full h-11 text-sm font-semibold transition-all",
                      canProceed 
                        ? "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg shadow-rose-500/30" 
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    )}
                    onClick={handleRunMatching}
                    disabled={!canProceed}
                  >
                    {canProceed ? (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run AI Match Analysis
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Select a data source to continue
                      </>
                    )}
                  </Button>
                </motion.div>
                {canProceed && (
                  <p className="text-center text-[10px] text-slate-400 mt-2">
                    Click to start the AI-powered matching analysis
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* PROCESSING STEP */}
          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center p-6"
            >
              <div className="text-center max-w-xs">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center"
                >
                  <Sparkles className="w-7 h-7 text-white" />
                </motion.div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Analyzing Matches...</h2>
                <p className="text-slate-500 text-xs mb-4">Finding the best partners for your business</p>
                
                <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                  <motion.div
                    className="bg-gradient-to-r from-rose-400 to-rose-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${processingProgress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600 mb-4">{processingProgress}% complete</p>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xl font-bold text-rose-500 tabular-nums">{Math.floor(processingProgress * 8.11)}</p>
                    <p className="text-[10px] text-slate-500">Found</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-teal-500 tabular-nums">{Math.floor(processingProgress * 4.49)}</p>
                    <p className="text-[10px] text-slate-500">High Match</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-amber-500 tabular-nums">69%</p>
                    <p className="text-[10px] text-slate-500">Avg Score</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* RESULTS STEP */}
          {step === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col"
            >
              {/* Results Header */}
              <div className="px-3 py-2 border-b border-slate-200 bg-white shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Match Results</h2>
                    <p className="text-[10px] text-slate-500">811 Prospects • {dataSource === "csv" ? "CSV Import" : "CRM Sync"}</p>
                  </div>
                </div>

                {/* View Tabs with Arrows */}
                <div className="relative group">
                  {/* Left Arrow */}
                  <button
                    onClick={() => scrollViewTabs("left")}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center bg-white/90 border border-slate-200 rounded-full shadow-sm opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-slate-50"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
                  </button>

                  <div 
                    ref={viewTabsRef}
                    className="flex items-center justify-center overflow-x-auto scrollbar-hide px-6"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div className="inline-flex bg-slate-100 rounded-lg p-0.5">
                      {[
                        { id: "matches" as ResultView, label: "Matches" },
                        { id: "heatmap" as ResultView, label: "Heatmap" },
                        { id: "radial" as ResultView, label: "Radial" }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => {
                            if (soundEnabled) sounds.playClick();
                            setResultView(tab.id);
                          }}
                          className={cn(
                            "px-3 py-1 text-[10px] font-medium rounded-md transition-colors",
                            resultView === tab.id
                              ? "bg-white text-rose-500 shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          )}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Arrow */}
                  <button
                    onClick={() => scrollViewTabs("right")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center bg-white/90 border border-slate-200 rounded-full shadow-sm opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-slate-50"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                </div>
              </div>

              {/* Results Content */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {/* MATCHES VIEW */}
                  {resultView === "matches" && (
                    <motion.div
                      key="matches-view"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-3"
                    >
                      {/* Sort Controls */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1">
                          {[
                            { id: "score-desc" as SortOrder, label: "High→Low" },
                            { id: "a-z" as SortOrder, label: "A-Z" },
                          ].map((sort) => (
                            <Button
                              key={sort.id}
                              variant={sortOrder === sort.id ? "default" : "outline"}
                              size="sm"
                              className={cn(
                                "h-6 text-[10px] px-2",
                                sortOrder === sort.id && "bg-rose-500 hover:bg-rose-600 text-white"
                              )}
                              onClick={() => {
                                if (soundEnabled) sounds.playClick();
                                setSortOrder(sort.id);
                              }}
                            >
                              {sort.label}
                            </Button>
                          ))}
                        </div>
                        <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-6 w-6 p-0", viewMode === "grid" && "bg-rose-500 text-white")}
                            onClick={() => {
                              if (soundEnabled) sounds.playClick();
                              setViewMode("grid");
                            }}
                          >
                            <Grid3X3 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-6 w-6 p-0", viewMode === "list" && "bg-slate-200")}
                            onClick={() => {
                              if (soundEnabled) sounds.playClick();
                              setViewMode("list");
                            }}
                          >
                            <List className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Match Grid */}
                      <div className={cn(
                        "gap-2",
                        viewMode === "grid" ? "grid grid-cols-2 lg:grid-cols-3" : "space-y-2"
                      )}>
                        {sortedMatches.map((match, index) => renderMatchCard(match, index))}
                      </div>
                    </motion.div>
                  )}

                  {/* HEATMAP VIEW */}
                  {resultView === "heatmap" && (
                    <motion.div
                      key="heatmap-view"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-3"
                    >
                      <div className="bg-white rounded-lg border border-slate-200 p-3">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-slate-900 text-xs">Company Matchability</h3>
                          <div className="flex items-center gap-2 text-[9px]">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-400"></span>&lt;30</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-400"></span>30-60</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500"></span>80+</span>
                          </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <div className="min-w-[300px]">
                            {mockMatches.slice(0, 6).map((row, ri) => (
                              <div key={ri} className="grid grid-cols-7 gap-0.5 mb-0.5">
                                <div className="text-[8px] text-slate-600 truncate pr-1">{row.name.split(' ')[0]}</div>
                                {mockMatches.slice(0, 6).map((col, ci) => {
                                  const score = ri === ci ? 0 : 45 + ((ri + ci) * 17) % 45;
                                  const bgColor = score === 0 ? "bg-slate-100" :
                                    score < 30 ? "bg-red-400" :
                                    score < 60 ? "bg-amber-400" :
                                    score < 80 ? "bg-teal-400" : "bg-emerald-500";
                                  return (
                                    <div
                                      key={ci}
                                      className={cn("h-5 rounded flex items-center justify-center text-[8px] font-medium", bgColor, score === 0 ? "text-slate-300" : "text-white")}
                                    >
                                      {score === 0 ? "—" : score}
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* RADIAL VIEW */}
                  {resultView === "radial" && (
                    <motion.div
                      key="radial-view"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-3"
                    >
                      <div className="bg-white rounded-lg border border-slate-200 p-3">
                        <div className="flex items-center justify-end mb-2">
                          <div className="flex items-center gap-3 text-[9px]">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-400"></span>High</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span>Mid</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400"></span>Low</span>
                          </div>
                        </div>

                        <div className="relative w-full aspect-square max-w-[200px] mx-auto">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white text-center z-10">
                            <div>
                              <p className="text-[8px] font-medium">Alfred</p>
                            </div>
                          </div>

                          {[0.9, 0.7, 0.5, 0.3].map((scale, i) => (
                            <div
                              key={i}
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200"
                              style={{ width: `${scale * 100}%`, height: `${scale * 100}%` }}
                            />
                          ))}

                          {Array.from({ length: 40 }).map((_, i) => {
                            const angle = (i / 40) * Math.PI * 2;
                            const score = 40 + Math.floor(Math.random() * 50);
                            const radius = 0.25 + (score / 100) * 0.35;
                            const x = 50 + Math.cos(angle) * radius * 50;
                            const y = 50 + Math.sin(angle) * radius * 50;
                            const color = score >= 70 ? "bg-teal-400" : score >= 50 ? "bg-amber-400" : "bg-rose-400";
                            
                            return (
                              <motion.div
                                key={i}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: i * 0.02 }}
                                className={cn("absolute w-1.5 h-1.5 rounded-full", color)}
                                style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Match Detail Drawer */}
      <AnimatePresence>
        {selectedMatch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 z-50"
            onClick={() => setSelectedMatch(null)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 p-3 z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{selectedMatch.name}</h3>
                      <Badge className="bg-rose-100 text-rose-600 text-[9px]">High</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <a href={selectedMatch.linkedinUrl} target="_blank" className="flex items-center gap-1 text-[#0077B5]">
                        <Linkedin className="w-3 h-3" />
                        LinkedIn
                      </a>
                      <a href={selectedMatch.websiteUrl} target="_blank" className="flex items-center gap-1 text-teal-600">
                        <ExternalLink className="w-3 h-3" />
                        Website
                      </a>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedMatch(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="p-3 space-y-4">
                {/* Match Score */}
                <div className="bg-rose-50 rounded-lg p-3 border border-rose-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-900 text-xs">Match Score</h4>
                    <Badge className="bg-rose-500 text-white text-sm font-bold px-2">{selectedMatch.matchScore}%</Badge>
                  </div>
                  <p className="text-[10px] text-slate-600">{selectedMatch.description}</p>
                </div>

                {/* Metrics */}
                <div>
                  <h4 className="font-semibold text-slate-900 text-xs mb-2">Matching Metrics</h4>
                  <div className="space-y-2">
                    {renderMetricBar("Strategic Fit", selectedMatch.metrics.strategicFit, 20)}
                    {renderMetricBar("Financial Capability", selectedMatch.metrics.financialCapability, 20)}
                    {renderMetricBar("Decision Power", selectedMatch.metrics.decisionPower, 15)}
                  </div>
                </div>

                {/* Suggested Actions */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <h4 className="font-semibold text-slate-900 text-xs mb-2">Next Steps</h4>
                  <div className="space-y-1">
                    {[
                      { icon: Mail, text: "Send intro email", hint: "AI will draft personalized email" },
                      { icon: UserPlus, text: "Add to CRM", hint: "Sync contact to your CRM" },
                      { icon: Calendar, text: "Schedule call", hint: "Book a discovery meeting" },
                    ].map((step, i) => (
                      <div key={i} className="relative">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-left h-8 px-2 hover:bg-white"
                          onClick={() => showHint(`action-${i}`)}
                        >
                          <step.icon className="w-3 h-3 mr-2 text-slate-400" />
                          <span className="text-[10px] text-slate-700">{step.text}</span>
                        </Button>
                        <InlineHint message={step.hint} show={activeHint === `action-${i}`} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-9 text-xs",
                    savedMatches.has(selectedMatch.id)
                      ? "border-rose-200 text-rose-500 bg-rose-50"
                      : "border-slate-200 text-slate-600"
                  )}
                  onClick={() => handleToggleSave(selectedMatch.id)}
                >
                  <Heart className={cn("w-3 h-3 mr-2", savedMatches.has(selectedMatch.id) && "fill-current")} />
                  {savedMatches.has(selectedMatch.id) ? "Saved" : "Save for Later"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
