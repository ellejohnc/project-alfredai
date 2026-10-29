import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Play, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useHaptics } from "@/hooks/useHaptics";

interface FloatingDemoFABProps {
  /** ID of the target section to scroll to */
  targetId?: string;
  /** Threshold in pixels before showing the FAB */
  scrollThreshold?: number;
}

export function FloatingDemoFAB({ 
  targetId = "try-alfred-live",
  scrollThreshold = 600 
}: FloatingDemoFABProps) {
  const location = useLocation();
  const isHomepage = location.pathname === "/";
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { vibrate } = useHaptics();

  const handleClick = useCallback(() => {
    vibrate('medium');
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, [targetId, vibrate]);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    vibrate('light');
    setIsDismissed(true);
  }, [vibrate]);

  // Set up scroll listeners only on homepage
  useEffect(() => {
    if (!isHomepage) {
      setIsVisible(false);
      return;
    }
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroSection = document.getElementById(targetId);
      
      if (heroSection) {
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        const shouldHide = scrollY > heroBottom + 200;
        setIsVisible(scrollY > scrollThreshold && !shouldHide && !isDismissed);
      } else {
        setIsVisible(scrollY > scrollThreshold && !isDismissed);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollThreshold, targetId, isDismissed, isHomepage]);

  // Don't render anything on non-homepage routes
  if (!isHomepage) {
    return null;
  }

  // Only show on mobile/tablet (< 1024px)
  // We use CSS to hide on desktop, but also check window width for initial render
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25 
          }}
          className="fixed bottom-20 right-4 z-50 lg:hidden"
        >
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full 
              bg-background/80 backdrop-blur-sm border border-border
              flex items-center justify-center
              text-muted-foreground hover:text-foreground
              transition-colors shadow-sm z-10"
            aria-label="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>

          {/* Main FAB button */}
          <button
            onClick={handleClick}
            className="group relative flex items-center gap-2 
              px-4 py-3 rounded-full
              bg-primary text-primary-foreground
              shadow-[0_8px_30px_rgba(0,0,0,0.3)]
              touch-manipulation active:scale-95
              transition-transform"
            aria-label="Try Alfred Live"
          >
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/30"
              animate={{ 
                scale: [1, 1.15, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeOut" 
              }}
            />
            
            <Play className="w-5 h-5 fill-current relative z-10" />
            <span className="text-sm font-medium relative z-10 whitespace-nowrap">
              Try Live Demo
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FloatingDemoFAB;
