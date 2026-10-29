import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export function ProgressIndicator({ currentStep, totalSteps, labels }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNumber = i + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        
        return (
          <div key={i} className="flex items-center gap-2">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ 
                scale: isActive ? 1.1 : 1,
              }}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                isActive && "bg-primary text-primary-foreground",
                isCompleted && "bg-primary/20 text-primary",
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}
            >
              {stepNumber}
            </motion.div>
            
            {/* Connector line */}
            {i < totalSteps - 1 && (
              <div className="w-8 h-0.5 bg-muted">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: isCompleted ? "100%" : "0%" }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </div>
        );
      })}
      
      {/* Step label */}
      <span className="ml-3 text-sm text-muted-foreground">
        {labels?.[currentStep - 1] || `Step ${currentStep} of ${totalSteps}`}
      </span>
    </div>
  );
}
