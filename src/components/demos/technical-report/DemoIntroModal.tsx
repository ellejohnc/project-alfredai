import { useState } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  FileBarChart, 
  X, 
  HardHat, 
  Building2, 
  Users, 
  Compass,
  Hammer,
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
                  <FileBarChart className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">AI Technical Report Agent</h2>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-1.5 max-w-sm mx-auto">
                    A technical report drafting agent for high-volume professional services firms — generates compliant first drafts so engineers can focus on review and decisions, not typing.
                  </p>
                </div>
              </div>

              {/* Who this is for */}
              <div className="bg-muted/30 border border-border rounded-lg p-3 md:p-4 space-y-2 md:space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-xs md:text-sm font-semibold text-foreground">Who this is for</span>
                </div>
                
                {/* Desktop view */}
                <div className="hidden md:block space-y-2">
                  <div className="flex items-start gap-2.5">
                    <HardHat className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground font-medium">Engineers</span> preparing inspection and compliance reports
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Building2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground font-medium">Building Certifiers</span> issuing certificates and compliance statements
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Compass className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground font-medium">Builder Surveyors</span> documenting site conditions
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Hammer className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground font-medium">Contractors</span> producing handover documentation
                    </p>
                  </div>
                </div>

                {/* Mobile condensed view */}
                <div className="md:hidden">
                  <p className="text-xs text-muted-foreground">
                    Engineers, Building Certifiers, Consultants, Builder Surveyors, and Contractors.
                  </p>
                </div>
                
                {/* Industries */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="inline-flex items-center gap-1 text-[10px] md:text-xs bg-background/80 text-muted-foreground px-2 py-1 rounded-full border border-border">
                    <HardHat className="w-3 h-3" />
                    Engineering
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] md:text-xs bg-background/80 text-muted-foreground px-2 py-1 rounded-full border border-border">
                    <Building2 className="w-3 h-3" />
                    Construction
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] md:text-xs bg-background/80 text-muted-foreground px-2 py-1 rounded-full border border-border">
                    <Compass className="w-3 h-3" />
                    Surveying
                  </span>
                </div>
              </div>

              {/* Why this is better */}
              <div className="bg-muted/30 border border-border rounded-lg p-3 md:p-4 space-y-2 md:space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs md:text-sm font-semibold text-foreground">Why this is better</span>
                </div>
                <ul className="space-y-1.5 md:space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-xs md:text-sm text-muted-foreground">Ingests regulation docs, field notes, photos, and sensor data automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-xs md:text-sm text-muted-foreground">Generates compliant first drafts matching industry templates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-xs md:text-sm text-muted-foreground">Built-in version control tracks every edit and reviewer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-xs md:text-sm text-muted-foreground">Integrated workflow: review, sign, approve, send to client, invoice</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border p-4 md:p-6 space-y-3 md:space-y-4 bg-muted/20">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  onClick={handleStartTour}
                  className="flex-1 gap-2 glow-pulse min-h-[44px]"
                  size="lg"
                >
                  <Play className="w-4 h-4" />
                  Start Guided Tour
                </Button>
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  className="flex-1 min-h-[44px]"
                  size="lg"
                >
                  Skip Intro
                </Button>
              </div>
              
              <div className="flex items-center gap-2 justify-center">
                <Checkbox
                  id="dont-show"
                  checked={dontShowAgain}
                  onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                />
                <label 
                  htmlFor="dont-show" 
                  className="text-xs text-muted-foreground cursor-pointer select-none"
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
