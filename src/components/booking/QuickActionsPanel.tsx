import { memo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Plus, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickAction, MAX_OTHER_INPUT_LENGTH } from "./BookingConstants";

interface QuickActionsPanelProps {
  actions: QuickAction[] | null;
  onAction: (action: QuickAction) => void;
  showOtherInput: boolean;
  otherInput: string;
  onOtherInputChange: (value: string) => void;
  onOtherSubmit: () => void;
  onOtherCancel: () => void;
  disabled?: boolean;
}

export const QuickActionsPanel = memo(function QuickActionsPanel({
  actions,
  onAction,
  showOtherInput,
  otherInput,
  onOtherInputChange,
  onOtherSubmit,
  onOtherCancel,
  disabled = false,
}: QuickActionsPanelProps) {
  const otherInputRef = useRef<HTMLInputElement>(null);

  // Focus other input when shown
  useEffect(() => {
    if (showOtherInput && otherInputRef.current) {
      otherInputRef.current.focus();
    }
  }, [showOtherInput]);

  const handleOtherKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onOtherSubmit();
    } else if (e.key === "Escape") {
      onOtherCancel();
    }
  };

  if (!actions) return null;

  return (
    <div className="px-3 sm:px-5 pb-3 sm:pb-4 shrink-0 space-y-2 sm:space-y-3">
      <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Select:</p>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {actions.map((action, idx) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={disabled ? {} : { scale: 1.03, y: -1 }}
            whileTap={disabled ? {} : { scale: 0.97 }}
            onClick={() => !disabled && onAction(action)}
            disabled={disabled}
            className={cn(
              "text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-muted/60 hover:bg-muted text-foreground border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-sm",
              disabled && "opacity-50 cursor-not-allowed hover:bg-muted/60 hover:border-border/50 hover:shadow-none"
            )}
          >
            {action.label}
          </motion.button>
        ))}
        {/* Other option button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: actions.length * 0.05 }}
          whileHover={disabled ? {} : { scale: 1.03, y: -1 }}
          whileTap={disabled ? {} : { scale: 0.97 }}
          onClick={() => !disabled && onAction({ label: "Other", type: "other" })}
          disabled={disabled}
          className={cn(
            "text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-dashed border-border/70 hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center gap-1",
            disabled && "opacity-50 cursor-not-allowed hover:border-border/70 hover:text-muted-foreground"
          )}
        >
          <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          Other
        </motion.button>
        {/* Skip option button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (actions.length + 1) * 0.05 }}
          whileHover={disabled ? {} : { scale: 1.03, y: -1 }}
          whileTap={disabled ? {} : { scale: 0.97 }}
          onClick={() => !disabled && onAction({ label: "Skip", type: "skip" })}
          disabled={disabled}
          className={cn(
            "text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-muted-foreground/70 hover:text-muted-foreground transition-all duration-200 flex items-center gap-1",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          Skip
        </motion.button>
      </div>
      
      {/* Other input field */}
      <AnimatePresence>
        {showOtherInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center gap-2">
                <input
                  ref={otherInputRef}
                  type="text"
                  value={otherInput}
                  onChange={(e) => onOtherInputChange(e.target.value.slice(0, MAX_OTHER_INPUT_LENGTH))}
                  onKeyDown={handleOtherKeyDown}
                  maxLength={MAX_OTHER_INPUT_LENGTH}
                  placeholder="Type your answer..."
                  className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onOtherSubmit}
                  disabled={!otherInput.trim()}
                  className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all"
                >
                  Submit
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onOtherCancel}
                  className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
              {otherInput.length > 0 && (
                <span className="text-xs text-muted-foreground text-right pr-1">
                  {otherInput.length}/{MAX_OTHER_INPUT_LENGTH}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
