import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Database, 
  Cloud, 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  Loader2,
  X
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SyncStage {
  id: string;
  source: string;
  icon: React.ElementType;
  description: string;
  subSteps: string[];
  duration: number;
  itemsFound?: { label: string; count: number }[];
}

const syncStages: SyncStage[] = [
  {
    id: "email",
    source: "Email Inbox",
    icon: Mail,
    description: "Scanning compliance@manteena.com.au",
    subSteps: [
      "Connecting to Microsoft 365...",
      "Scanning inbox for attachments...",
      "Extracting PDF and image files...",
    ],
    duration: 1500,
    itemsFound: [
      { label: "emails with attachments", count: 31 },
      { label: "documents extracted", count: 47 },
    ],
  },
  {
    id: "knowledge",
    source: "Knowledge Base",
    icon: Database,
    description: "Loading vendor requirements database",
    subSteps: [
      "Loading vendor master data...",
      "Syncing document requirements...",
      "Mapping compliance rules...",
    ],
    duration: 1200,
    itemsFound: [
      { label: "vendors loaded", count: 247 },
      { label: "documents tracked", count: 2847 },
    ],
  },
  {
    id: "sharepoint",
    source: "SharePoint",
    icon: Cloud,
    description: "Indexing document library",
    subSteps: [
      "Connecting to SharePoint Online...",
      "Indexing Vendors folder...",
      "Building file manifest...",
    ],
    duration: 1000,
    itemsFound: [
      { label: "verified files indexed", count: 2103 },
    ],
  },
  {
    id: "erp",
    source: "ERP System",
    icon: Building2,
    description: "Syncing vendor master from Xero",
    subSteps: [
      "Authenticating with Xero API...",
      "Fetching active suppliers...",
      "Mapping ABN and contact data...",
    ],
    duration: 800,
    itemsFound: [
      { label: "active vendors synced", count: 247 },
    ],
  },
  {
    id: "ai",
    source: "AI Learning",
    icon: Sparkles,
    description: "Loading verification patterns",
    subSteps: [
      "Analyzing historical decisions...",
      "Loading document templates...",
      "Calibrating confidence thresholds...",
    ],
    duration: 600,
    itemsFound: [
      { label: "patterns learned", count: 15420 },
    ],
  },
];

type StageStatus = "pending" | "active" | "completed";

interface SyncStageCardProps {
  stage: SyncStage;
  status: StageStatus;
  progress: number;
  currentSubStep: number;
}

function SyncStageCard({ stage, status, progress, currentSubStep }: SyncStageCardProps) {
  const Icon = stage.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "rounded-lg border p-3 sm:p-4 transition-colors duration-300",
        status === "completed" && "bg-green-500/10 border-green-500/30",
        status === "active" && "bg-primary/5 border-primary/30",
        status === "pending" && "bg-muted/30 border-border/50 opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center",
          status === "completed" && "bg-green-500/20 text-green-600",
          status === "active" && "bg-primary/20 text-primary",
          status === "pending" && "bg-muted text-muted-foreground"
        )}>
          {status === "completed" ? (
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : status === "active" ? (
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          ) : (
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={cn(
              "font-medium text-sm sm:text-base truncate",
              status === "completed" && "text-green-600",
              status === "active" && "text-foreground",
              status === "pending" && "text-muted-foreground"
            )}>
              {stage.source}
            </h4>
            {status === "active" && (
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {Math.round(progress)}%
              </span>
            )}
          </div>
          
          {/* Description / Sub-step */}
          <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
            {status === "active" 
              ? stage.subSteps[currentSubStep] || stage.description
              : status === "completed" && stage.itemsFound
                ? stage.itemsFound.map(item => `${item.count.toLocaleString()} ${item.label}`).join(" • ")
                : stage.description
            }
          </p>
          
          {/* Progress bar for active stage */}
          {status === "active" && (
            <div className="mt-2">
              <Progress value={progress} className="h-1.5" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface InitialSyncOverlayProps {
  isActive: boolean;
  onComplete: () => void;
}

export function InitialSyncOverlay({ isActive, onComplete }: InitialSyncOverlayProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const [currentSubStep, setCurrentSubStep] = useState(0);
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleSkip = useCallback(() => {
    sessionStorage.setItem('vendor-compliance-sync-skipped', 'true');
    setIsCompleting(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  }, [onComplete]);

  // Check for session skip
  useEffect(() => {
    if (sessionStorage.getItem('vendor-compliance-sync-skipped') === 'true') {
      onComplete();
    }
  }, [onComplete]);

  // Stage progression logic
  useEffect(() => {
    if (!isActive || isCompleting) return;
    if (currentStage >= syncStages.length) {
      // All stages complete
      setIsCompleting(true);
      setTimeout(() => {
        onComplete();
      }, 500);
      return;
    }

    const stage = syncStages[currentStage];
    const progressInterval = stage.duration / 100;
    const subStepInterval = stage.duration / stage.subSteps.length;

    // Progress increment
    const progressTimer = setInterval(() => {
      setStageProgress(prev => {
        if (prev >= 100) return 100;
        // Add some realistic variation
        const increment = Math.random() * 3 + 1;
        return Math.min(prev + increment, 100);
      });
    }, progressInterval);

    // Sub-step cycling
    const subStepTimer = setInterval(() => {
      setCurrentSubStep(prev => (prev + 1) % stage.subSteps.length);
    }, subStepInterval);

    // Stage completion
    const stageTimer = setTimeout(() => {
      clearInterval(progressTimer);
      clearInterval(subStepTimer);
      setCompletedStages(prev => [...prev, stage.id]);
      setStageProgress(0);
      setCurrentSubStep(0);
      setCurrentStage(prev => prev + 1);
    }, stage.duration);

    return () => {
      clearInterval(progressTimer);
      clearInterval(subStepTimer);
      clearTimeout(stageTimer);
    };
  }, [isActive, currentStage, isCompleting, onComplete]);

  const getStageStatus = (index: number): StageStatus => {
    if (completedStages.includes(syncStages[index].id)) return "completed";
    if (index === currentStage) return "active";
    return "pending";
  };

  const overallProgress = Math.round(
    ((completedStages.length / syncStages.length) * 100) +
    ((stageProgress / 100) * (100 / syncStages.length))
  );

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isCompleting ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] bg-background backdrop-blur-md flex flex-col"
        >
          {/* Skip Button */}
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <span className="hidden sm:inline">Skip</span>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto w-full">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-6 sm:mb-8"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary animate-pulse" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-1">
                Initializing AI Compliance Agent
              </h2>
              <p className="text-sm text-muted-foreground">
                Connecting to integrated data sources...
              </p>
            </motion.div>

            {/* Stage Cards */}
            <div className="w-full space-y-2 sm:space-y-3 mb-6 sm:mb-8 overflow-y-auto max-h-[50vh]">
              {syncStages.map((stage, idx) => (
                <SyncStageCard
                  key={stage.id}
                  stage={stage}
                  status={getStageStatus(idx)}
                  progress={idx === currentStage ? stageProgress : 0}
                  currentSubStep={idx === currentStage ? currentSubStep : 0}
                />
              ))}
            </div>

            {/* Overall Progress */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full"
            >
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Overall Progress</span>
                <span className="font-medium">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
