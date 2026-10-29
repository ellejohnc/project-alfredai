import { memo } from "react";
import { motion } from "framer-motion";
import { MousePointer2 } from "lucide-react";

interface ClickIndicatorProps {
  position: { x: number; y: number } | null;
  label?: string;
}

/**
 * Animated finger click indicator for autoplay demos
 * Shows a visual click effect at the specified position
 */
const FingerClickIndicator = memo(function FingerClickIndicator({ position, label }: ClickIndicatorProps) {
  if (!position) return null;
  
  return (
    <motion.div
      className="fixed z-[100] pointer-events-none"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.2 }}
    >
      {/* Click ripple effect */}
      <motion.div
        className="absolute -inset-4 rounded-full bg-orange-500/20"
        initial={{ scale: 0.5, opacity: 0.8 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      <motion.div
        className="absolute -inset-2 rounded-full bg-orange-500/30"
        initial={{ scale: 0.5, opacity: 0.8 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      />
      
      {/* Finger pointer icon */}
      <motion.div
        className="relative"
        initial={{ y: -10, rotate: -15 }}
        animate={{ y: 0, rotate: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg flex items-center justify-center border-2 border-white">
          <MousePointer2 className="w-5 h-5 text-white -rotate-12" />
        </div>
        
        {/* Tap animation circle */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-orange-500"
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.4, repeat: 1, repeatDelay: 0.2 }}
        />
      </motion.div>
      
      {/* Label */}
      {label && (
        <motion.div
          className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-lg">
            {label}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
});

export default FingerClickIndicator;
