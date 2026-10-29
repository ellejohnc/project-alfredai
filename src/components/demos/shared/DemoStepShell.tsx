import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { InlineDemoSpeedControl } from "@/components/demos/shared/InlineDemoSpeedControl";
import { motion } from "framer-motion";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import {
  Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Check, Mail, type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

export interface DemoStepDef {
  id: string;
  title: string;
  icon: LucideIcon;
  duration: number;
}

interface DemoStepShellProps {
  /** Header icon */
  icon: LucideIcon;
  title: string;
  subtitle: string;
  steps: DemoStepDef[];
  /** Renders the body for the active step */
  renderStep: (stepId: string, index: number) => ReactNode;
  /** Subject line for the "report an issue" mailto fallback */
  reportSubject: string;
  /** Optional persistent outcome panel rendered below the step window */
  outcome?: ReactNode;
}

/**
 * Shared shell for the construction workflow demos. Owns the stepper, swipe
 * navigation, auto-scroll, fixed-height responsive window, playback timing,
 * and the report-issue fallback so individual demos only supply step content.
 */
export function DemoStepShell({
  icon: HeaderIcon,
  title,
  subtitle,
  steps,
  renderStep,
  reportSubject,
  outcome,
}: DemoStepShellProps) {
  const { applySpeed } = useDemoSpeed();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [stepProgress, setStepProgress] = useState(0);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const stepNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nav = stepNavRef.current;
    if (!nav) return;
    const active = nav.querySelector<HTMLElement>("[data-active='true']");
    active?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [currentStep]);

  const goNext = useCallback(() => {
    setCurrentStep((p) => Math.min(p + 1, steps.length - 1));
    setStepProgress(0);
  }, [steps.length]);
  const goPrev = useCallback(() => {
    setCurrentStep((p) => Math.max(p - 1, 0));
    setStepProgress(0);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const step = steps[currentStep];
    const progress = setInterval(() => {
      setStepProgress((p) => (p >= 100 ? 100 : p + 2));
    }, applySpeed(step.duration) / 50);
    const timeout = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep((p) => p + 1);
        setStepProgress(0);
      } else {
        setIsPlaying(false);
      }
    }, applySpeed(step.duration));
    return () => {
      clearInterval(progress);
      clearTimeout(timeout);
    };
  }, [isPlaying, currentStep, applySpeed, steps]);

  const handleReset = () => {
    setCurrentStep(0);
    setStepProgress(0);
    setIsPlaying(true);
  };

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; touchEndX.current = null; };
  const onTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
  const onTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const d = touchStartX.current - touchEndX.current;
    if (d > 50) goNext();
    else if (d < -50) goPrev();
    touchStartX.current = null; touchEndX.current = null;
  };

  const reportHref = `mailto:hello@alfredai.bot?subject=${encodeURIComponent(reportSubject)}&body=${encodeURIComponent(`Page: ${typeof window !== "undefined" ? window.location.href : ""}\n\nDescribe what happened (a screenshot helps):`)}`;

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="space-y-5" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <HeaderIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <InlineDemoSpeedControl compact className="hidden sm:flex" />
          <Button variant="outline" size="sm" className="min-h-[40px]" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Reset
          </Button>
          <Button size="sm" className="min-h-[40px]" onClick={() => setIsPlaying((p) => !p)}>
            {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={goPrev} disabled={currentStep === 0} className="shrink-0 h-9 w-9">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div ref={stepNavRef} className="flex items-center gap-2 overflow-x-auto pb-2 px-1 flex-1 scrollbar-hide">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isDone = index < currentStep;
                return (
                  <button key={step.id} data-active={isActive} onClick={() => { setCurrentStep(index); setStepProgress(0); }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all shrink-0 min-h-[40px] ${
                      isActive ? "bg-primary text-primary-foreground" : isDone ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}>
                    {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    <span className="text-xs font-medium whitespace-nowrap hidden sm:inline">{step.title}</span>
                  </button>
                );
              })}
            </div>
            <Button variant="ghost" size="icon" onClick={goNext} disabled={isLastStep} className="shrink-0 h-9 w-9">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 sm:hidden">
            <span className="text-xs text-muted-foreground">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-xs font-medium text-primary">{steps[currentStep].title}</span>
          </div>
          {isPlaying && <Progress value={stepProgress} className="h-1 mt-3" />}
        </CardContent>
      </Card>

      <div className="h-[clamp(360px,52vh,640px)] overflow-y-auto overflow-x-hidden rounded-xl border border-border/50 bg-muted/10 p-3 sm:p-4 scrollbar-hide">
        <SafeAnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            {renderStep(steps[currentStep].id, currentStep)}
          </motion.div>
        </SafeAnimatePresence>
      </div>

      {outcome && isLastStep && outcome}

      <div className="text-center pt-2">
        <a href={reportHref} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
          <Mail className="w-3.5 h-3.5" /> Something not working? Report an issue
        </a>
      </div>
    </div>
  );
}
