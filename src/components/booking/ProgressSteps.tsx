import { memo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { STAGES } from "./BookingConstants";

interface ProgressStepsProps {
  currentStage: number;
}

export const ProgressSteps = memo(function ProgressSteps({ currentStage }: ProgressStepsProps) {
  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      {STAGES.map((stage, idx) => (
        <div key={stage.id} className="flex-1 flex flex-col items-center relative">
          {/* Connector line */}
          {idx < STAGES.length - 1 && (
            <div className={cn(
              "absolute top-3 sm:top-4 left-1/2 w-full h-0.5 transition-colors duration-300",
              idx < currentStage ? "bg-primary" : "bg-border"
            )} />
          )}
          
          <motion.div
            className={cn(
              "relative z-10 w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-300",
              idx < currentStage
                ? "bg-primary text-primary-foreground"
                : idx === currentStage
                ? "bg-primary/15 text-primary ring-1 sm:ring-2 ring-primary ring-offset-1 sm:ring-offset-2 ring-offset-background"
                : "bg-muted text-muted-foreground"
            )}
          >
            {idx < currentStage ? (
              <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
            ) : (
              <stage.icon className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
          </motion.div>
          <span className={cn(
            "text-[10px] mt-1.5 font-medium hidden sm:block transition-colors",
            idx < currentStage ? "text-primary" : idx === currentStage ? "text-foreground" : "text-muted-foreground"
          )}>
            {stage.label}
          </span>
        </div>
      ))}
    </div>
  );
});
