import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { cn } from "@/lib/utils";
import { Gauge } from "lucide-react";

const PRESETS = [0.5, 1, 1.5, 2, 3] as const;

interface InlineDemoSpeedControlProps {
  /** Use compact mode for tight toolbars */
  compact?: boolean;
  /** Optional className override */
  className?: string;
}

export function InlineDemoSpeedControl({ compact = false, className }: InlineDemoSpeedControlProps) {
  const { speedMultiplier, setSpeedMultiplier } = useDemoSpeed();

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {!compact && (
        <Gauge className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      )}
      <div className="flex items-center gap-0.5">
        {PRESETS.map((v) => (
          <button
            key={v}
            onClick={() => setSpeedMultiplier(v)}
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded transition-colors min-h-[28px] min-w-[28px] font-medium",
              Math.abs(speedMultiplier - v) < 0.05
                ? "bg-primary text-primary-foreground font-bold"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {v}x
          </button>
        ))}
      </div>
    </div>
  );
}
