import { cn } from "@/lib/utils";
import { BillStatus, getStatusDisplay } from "./purchaseBillData";
import { CheckCircle2 } from "lucide-react";

interface StatusStepperProps {
  currentStatus: BillStatus;
}

const STATUS_ORDER: BillStatus[] = [
  "received",
  "extracted", 
  "matched",
  "needs_review",
  "approved",
  "synced",
  "paid"
];

export function StatusStepper({ currentStatus }: StatusStepperProps) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  // Simplified flow - skip needs_review if not applicable
  const displayStatuses = STATUS_ORDER.filter((status, idx) => {
    if (status === "needs_review") {
      return currentStatus === "needs_review" || currentIndex < STATUS_ORDER.indexOf("needs_review");
    }
    return true;
  });

  return (
    <div className="flex items-center justify-between w-full px-2">
      {displayStatuses.map((status, idx) => {
        const info = getStatusDisplay(status);
        const statusIndex = STATUS_ORDER.indexOf(status);
        const isComplete = statusIndex < currentIndex;
        const isCurrent = status === currentStatus;
        const isUpcoming = statusIndex > currentIndex;

        return (
          <div key={status} className="flex items-center flex-1 last:flex-none">
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                  isComplete && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary/20 text-primary border-2 border-primary ring-4 ring-primary/10",
                  isUpcoming && "bg-muted text-muted-foreground border border-border"
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span>{info.icon}</span>
                )}
              </div>
              <span 
                className={cn(
                  "text-[10px] mt-1.5 whitespace-nowrap",
                  isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {info.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < displayStatuses.length - 1 && (
              <div className="flex-1 mx-2 relative h-0.5 min-w-[30px]">
                <div className="absolute inset-0 bg-border rounded-full" />
                <div 
                  className={cn(
                    "absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500",
                    isComplete ? "right-0" : "right-full"
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StatusStepper;
