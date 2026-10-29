import { motion } from "framer-motion";
import { CheckCircle2, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { InlineDemoSpeedControl } from "@/components/demos/shared/InlineDemoSpeedControl";
import { cn } from "@/lib/utils";
import { REPORT_STEPS } from "./demoData";

interface StepProgressBarProps {
  currentStep: number;
  stepProgress: number;
  isPlaying: boolean;
  onStepClick: (stepIndex: number) => void;
  onPlayPause: () => void;
  onReset: () => void;
}

export function StepProgressBar({
  currentStep,
  stepProgress,
  isPlaying,
  onStepClick,
  onPlayPause,
  onReset,
}: StepProgressBarProps) {
  return (
    <div className="space-y-3">
      {/* Step indicators */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 flex-1">
          {REPORT_STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => onStepClick(index)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-all min-h-[36px]",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isComplete
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <StepIcon className="w-3.5 h-3.5" />
                  )}
                  <span className="text-[10px] font-medium hidden sm:inline whitespace-nowrap">
                    {step.shortTitle}
                  </span>
                </button>
                {index < REPORT_STEPS.length - 1 && (
                  <div className="w-2 h-0.5 bg-border mx-0.5" />
                )}
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <InlineDemoSpeedControl compact className="hidden sm:flex" />
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlayPause}
            className="h-8 w-8"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onReset}
            className="h-8 w-8"
            aria-label="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={stepProgress} className="h-1" />

      {/* Current step info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            {REPORT_STEPS[currentStep] && (
              <>
                {(() => {
                  const Icon = REPORT_STEPS[currentStep].icon;
                  return <Icon className="w-4 h-4 text-primary" />;
                })()}
                {REPORT_STEPS[currentStep].title}
              </>
            )}
          </h3>
          <p className="text-xs text-muted-foreground">
            {REPORT_STEPS[currentStep]?.description}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          Step {currentStep + 1} of {REPORT_STEPS.length}
        </span>
      </div>
    </div>
  );
}
