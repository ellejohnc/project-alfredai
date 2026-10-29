import { motion } from "framer-motion";
import { 
  FileText, 
  Users, 
  PenTool, 
  Send, 
  Receipt, 
  CheckCircle2,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowStep } from "./types";

interface WorkflowStatusStepperProps {
  steps: WorkflowStep[];
  currentStepIndex: number;
}

const STEP_ICONS: Record<string, typeof FileText> = {
  draft: FileText,
  review: Users,
  sign: PenTool,
  send: Send,
  invoice: Receipt,
  complete: CheckCircle2,
};

export function WorkflowStatusStepper({
  steps,
  currentStepIndex,
}: WorkflowStatusStepperProps) {
  return (
    <div className="w-full">
      {/* Horizontal stepper for desktop */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = STEP_ICONS[step.id] || FileText;
          const isComplete = step.status === "complete";
          const isActive = step.status === "active";
          const isPending = step.status === "pending";
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                {/* Step circle */}
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ 
                    scale: isActive ? 1.1 : 1,
                    transition: { type: "spring", stiffness: 300 }
                  }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isComplete && "bg-primary border-primary",
                    isActive && "bg-primary/10 border-primary",
                    isPending && "bg-muted border-border"
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                  ) : (
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  )}
                </motion.div>

                {/* Label */}
                <span
                  className={cn(
                    "mt-2 text-[10px] font-medium text-center",
                    isComplete && "text-primary",
                    isActive && "text-foreground",
                    isPending && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>

                {/* Timestamp */}
                {step.timestamp && (
                  <span className="text-[9px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {step.timestamp}
                  </span>
                )}
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 mx-2">
                  <div
                    className={cn(
                      "h-0.5 w-full transition-all",
                      index < currentStepIndex
                        ? "bg-primary"
                        : "bg-border"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Vertical stepper for mobile */}
      <div className="sm:hidden space-y-2">
        {steps.map((step, index) => {
          const Icon = STEP_ICONS[step.id] || FileText;
          const isComplete = step.status === "complete";
          const isActive = step.status === "active";
          const isPending = step.status === "pending";
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-start gap-3">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2",
                    isComplete && "bg-primary border-primary",
                    isActive && "bg-primary/10 border-primary",
                    isPending && "bg-muted border-border"
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                  ) : (
                    <Icon
                      className={cn(
                        "w-4 h-4",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  )}
                </motion.div>
                {!isLast && (
                  <div
                    className={cn(
                      "w-0.5 h-6 mt-1",
                      index < currentStepIndex ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </div>

              {/* Content */}
              <div className="pt-1">
                <span
                  className={cn(
                    "text-xs font-medium",
                    isComplete && "text-primary",
                    isActive && "text-foreground",
                    isPending && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                {step.timestamp && (
                  <span className="text-[10px] text-muted-foreground ml-2">
                    {step.timestamp}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
