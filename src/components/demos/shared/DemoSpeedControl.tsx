import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gauge } from "lucide-react";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { cn } from "@/lib/utils";

export function DemoSpeedControl() {
  const { speedMultiplier, setSpeedMultiplier } = useDemoSpeed();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mb-2 bg-card/95 backdrop-blur-sm border border-border rounded-xl p-3 shadow-lg min-w-[200px]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Demo Speed</span>
              <span className="text-xs font-bold text-primary">{speedMultiplier.toFixed(1)}x</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">🐇</span>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={speedMultiplier}
                onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                className="flex-1 h-2 accent-primary cursor-pointer"
                style={{ minHeight: '44px' }}
              />
              <span className="text-[10px] text-muted-foreground">🐢</span>
            </div>
            <div className="flex justify-between mt-1">
              {[0.5, 1, 1.5, 2, 3].map((v) => (
                <button
                  key={v}
                  onClick={() => setSpeedMultiplier(v)}
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded transition-colors min-h-[28px]",
                    Math.abs(speedMultiplier - v) < 0.05
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {v}x
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all",
          "bg-card/95 backdrop-blur-sm border border-border hover:border-primary/50",
          isExpanded && "ring-2 ring-primary/30"
        )}
        title="Demo speed control"
      >
        <Gauge className="w-5 h-5 text-primary" />
      </button>
    </div>
  );
}
