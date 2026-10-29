import { useState, useRef, useCallback, ReactNode } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
  className?: string;
  threshold?: number;
}

export default function PullToRefresh({
  children,
  onRefresh,
  className,
  threshold = 80,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  
  const pullDistance = useMotionValue(0);
  const pullProgress = useTransform(pullDistance, [0, threshold], [0, 1]);
  const indicatorOpacity = useTransform(pullDistance, [0, 30, threshold], [0, 0.5, 1]);
  const indicatorScale = useTransform(pullDistance, [0, threshold], [0.5, 1]);
  const indicatorRotation = useTransform(pullDistance, [0, threshold * 2], [0, 360]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only enable if at top of page
    if (window.scrollY > 5 || isRefreshing) return;
    
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    // Only allow pulling down, with resistance
    if (diff > 0 && window.scrollY <= 0) {
      // Apply resistance curve for natural feel
      const resistance = 0.4;
      const resistedPull = diff * resistance;
      pullDistance.set(Math.min(resistedPull, threshold * 1.5));
      
      // Prevent default scroll when pulling
      if (diff > 10) {
        e.preventDefault();
      }
    }
  }, [isPulling, isRefreshing, pullDistance, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    const distance = pullDistance.get();
    
    if (distance >= threshold && !isRefreshing) {
      // Trigger refresh
      setIsRefreshing(true);
      animate(pullDistance, threshold * 0.6, { duration: 0.2 });
      
      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          // Default: just wait a moment
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } finally {
        setIsRefreshing(false);
        animate(pullDistance, 0, { 
          type: "spring", 
          stiffness: 400, 
          damping: 30 
        });
      }
    } else {
      // Snap back
      animate(pullDistance, 0, { 
        type: "spring", 
        stiffness: 400, 
        damping: 30 
      });
    }
    
    setIsPulling(false);
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center pointer-events-none md:hidden"
        style={{ 
          height: pullDistance,
          opacity: indicatorOpacity,
        }}
      >
        <motion.div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            isRefreshing 
              ? "bg-primary text-primary-foreground" 
              : "bg-background border border-border shadow-lg"
          )}
          style={{ scale: indicatorScale }}
        >
          <motion.div
            style={{ rotate: isRefreshing ? undefined : indicatorRotation }}
            animate={isRefreshing ? { rotate: 360 } : undefined}
            transition={isRefreshing ? { 
              duration: 1, 
              repeat: Infinity, 
              ease: "linear" 
            } : undefined}
          >
            <RefreshCw className={cn(
              "w-5 h-5",
              isRefreshing ? "text-primary-foreground" : "text-primary"
            )} />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Content with pull transform */}
      <motion.div style={{ y: pullDistance }}>
        {children}
      </motion.div>
    </div>
  );
}
