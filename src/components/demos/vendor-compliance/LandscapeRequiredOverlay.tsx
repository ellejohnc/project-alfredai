import { motion } from "framer-motion";
import { Smartphone, Monitor, RotateCcw } from "lucide-react";
import { useOrientation } from "@/hooks/useOrientation";

export function LandscapeRequiredOverlay() {
  const { isPortrait, isMobileDevice } = useOrientation();
  
  // Only show on mobile devices in portrait mode
  if (!isMobileDevice || !isPortrait) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md 
                 flex flex-col items-center justify-center p-6 text-center"
    >
      {/* Animated phone with rotate indicator */}
      <div className="relative mb-6">
        <Smartphone 
          className="w-20 h-20 text-primary animate-phone-rotate" 
          strokeWidth={1.5}
        />
      </div>

      {/* Desktop icon + heading */}
      <div className="flex items-center gap-2 mb-3">
        <Monitor className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-semibold">Designed for Desktop</h2>
      </div>
      
      {/* Main message */}
      <p className="text-muted-foreground max-w-xs mb-4">
        For the best experience, view this demo on a desktop or laptop.
      </p>
      
      {/* Secondary message with emphasis */}
      <p className="text-sm text-muted-foreground">
        Landscape mode works, but{" "}
        <span className="text-primary font-medium">desktop is even better!</span>
      </p>

      {/* Divider and rotate instruction */}
      <div className="mt-6 pt-6 border-t border-border w-full max-w-xs">
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
          <RotateCcw className="w-4 h-4" />
          Rotate to continue on mobile
        </p>
      </div>
    </motion.div>
  );
}

export default LandscapeRequiredOverlay;
