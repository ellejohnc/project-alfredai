import { useState } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  FileCheck, 
  X, 
  Building2, 
  Home, 
  Briefcase, 
  Users, 
  CheckCircle2,
  Sparkles,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface DemoIntroModalProps {
  isOpen: boolean;
  onDismiss: (startTour: boolean, dontShowAgain: boolean) => void;
}

export function DemoIntroModal({ isOpen, onDismiss }: DemoIntroModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const isMobile = useIsMobile();

  // Use the centralized scroll lock hook
  useBodyScrollLock(isOpen && isMobile);

  if (!isOpen) return null;

  const handleStartTour = () => {
    onDismiss(true, dontShowAgain);
  };

  const handleSkip = () => {
    onDismiss(false, dontShowAgain);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleSkip();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onKeyDown={handleKeyDown}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-h-[85vh] md:max-h-none flex flex-col"
          >
            {/* Header gradient */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent pointer-events-none" />
            
            {/* Close button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="relative p-4 md:p-6 space-y-4 md:space-y-5 overflow-y-auto flex-1">

              {/* Icon + Title */}
              <div className="text-center space-y-2 md:space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-lg">
                  <FileCheck className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">AI Purchase Bill Intake</h2>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-1.5 max-w-sm mx-auto">
                    Automate accounts payable with AI-powered invoice extraction, discrepancy detection, and ERP sync.
                  </p>
                </div>
              </div>

              {/* Who this is for - Collapsed on mobile */}
              <div className="bg-muted/30 border border-border rounded-lg p-3 md:p-4 space-y-2 md:space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-xs md:text-sm font-semibold text-foreground">Who this is for</span>
                </div>
                
                {/* Condensed on mobile - show inline */}
                <div className="hidden md:block space-y-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground font-medium">CFOs & Finance Directors</span> managing cash flow visibility
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground font-medium">AP Managers</span> processing 50–500 invoices/month
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground font-medium">Ops Leads</span> tracking subcontractor spend
                    </p>
                  </div>
                </div>
                
                {/* Mobile: simplified inline list */}
                <p className="md:hidden text-xs text-muted-foreground">
                  <span className="text-foreground font-medium">CFOs</span>, <span className="text-foreground font-medium">AP Managers</span>, and <span className="text-foreground font-medium">Ops Leads</span> processing invoices
                </p>

                {/* Industries */}
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2 pt-2 border-t border-border/50">
                  <span className="text-[10px] md:text-xs text-muted-foreground">Industries:</span>
                  <div className="flex items-center gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md bg-background/50 text-[10px] md:text-xs">
                    <Building2 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span className="text-foreground">Construction</span>
                  </div>
                  <div className="flex items-center gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md bg-background/50 text-[10px] md:text-xs">
                    <Home className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span className="text-foreground">Real Estate</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md bg-background/50 text-[10px] md:text-xs">
                    <Briefcase className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    <span className="text-foreground">Prof. Services</span>
                  </div>
                </div>
              </div>

              {/* Why this is better - Collapsed on mobile */}
              <div className="bg-muted/30 border border-border rounded-lg p-3 md:p-4 space-y-2 md:space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs md:text-sm font-semibold text-foreground">Why this is better</span>
                </div>
                
                {/* Desktop: full list */}
                <div className="hidden md:block space-y-2">
                  {[
                    "AI extracts invoice data — no manual entry",
                    "Auto-matches POs and flags variances instantly",
                    "Detects duplicate invoices and bank detail changes",
                    "Batch approve high-confidence bills in one click",
                    "Real-time cash forecasting and discount capture"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
                
                {/* Mobile: shortened list */}
                <div className="md:hidden space-y-1.5">
                  {[
                    "AI extracts invoice data automatically",
                    "Auto-matches POs & flags variances",
                    "Batch approve in one click"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTAs - Always visible, sticky on mobile */}
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-2 sticky bottom-0 bg-card pb-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="flex-1 order-2 sm:order-1 h-9 md:h-10"
                >
                  Skip Intro
                </Button>
                <Button
                  onClick={handleStartTour}
                  size="sm"
                  className="flex-1 order-1 sm:order-2 glow-pulse gap-2 h-9 md:h-10"
                >
                  <Play className="w-4 h-4" />
                  Start Guided Tour
                </Button>
              </div>

              {/* Don't show again */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <Checkbox
                  id="dont-show-again"
                  checked={dontShowAgain}
                  onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                  className="h-3.5 w-3.5 md:h-4 md:w-4"
                />
                <label
                  htmlFor="dont-show-again"
                  className="text-[10px] md:text-xs text-muted-foreground cursor-pointer"
                >
                  Don't show this again
                </label>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DemoIntroModal;
