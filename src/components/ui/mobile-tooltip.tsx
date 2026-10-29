import { useState, useCallback, ReactNode } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { useLongPress } from "@/hooks/useLongPress";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileTooltipProps {
  children: ReactNode;
  label: string;
  className?: string;
}

export function MobileTooltip({ children, label, className }: MobileTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isMobile = useIsMobile();

  const handleLongPress = useCallback(() => {
    setShowTooltip(true);
    // Auto-hide after 2 seconds
    setTimeout(() => setShowTooltip(false), 2000);
  }, []);

  const longPressHandlers = useLongPress({
    delay: 500,
    onLongPress: handleLongPress,
  });

  // On desktop, just render children without tooltip wrapper
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className={`relative inline-flex ${className || ""}`} {...longPressHandlers}>
      {children}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50"
          >
            <div className="bg-popover text-popover-foreground text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg border border-border whitespace-nowrap">
              {label}
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-popover" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
