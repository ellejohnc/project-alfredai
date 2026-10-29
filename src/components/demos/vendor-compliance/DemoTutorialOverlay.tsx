import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UseVendorComplianceTutorialReturn } from "@/hooks/useVendorComplianceTutorial";

interface DemoTutorialOverlayProps {
  tutorial: UseVendorComplianceTutorialReturn;
}

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function DemoTutorialOverlay({ tutorial }: DemoTutorialOverlayProps) {
  const { isActive, currentStep, totalSteps, currentStepData, next, back, skip } = tutorial;
  const [targetRect, setTargetRect] = useState<ElementRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const rafRef = useRef<number | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  const updatePosition = useCallback(() => {
    if (!currentStepData) return;

    const element = document.getElementById(currentStepData.elementId);
    if (!element) {
      setTargetRect(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    const padding = 8;
    
    setTargetRect({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Calculate tooltip position based on step position preference
    const tooltipWidth = 320;
    const tooltipHeight = 180;
    const gap = 16;
    
    let top = 0;
    let left = 0;

    switch (currentStepData.position) {
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'top':
        top = rect.top - tooltipHeight - gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - gap;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + gap;
        break;
    }

    // Keep tooltip within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (left < 16) left = 16;
    if (left + tooltipWidth > viewportWidth - 16) left = viewportWidth - tooltipWidth - 16;
    if (top < 16) top = 16;
    if (top + tooltipHeight > viewportHeight - 16) top = viewportHeight - tooltipHeight - 16;

    setTooltipPosition({ top, left });
  }, [currentStepData]);

  // RAF loop for smooth updates
  useEffect(() => {
    if (!isActive) return;

    const animate = () => {
      updatePosition();
      rafRef.current = requestAnimationFrame(animate);
    };
    
    rafRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isActive, updatePosition]);

  // Mutation observer for DOM changes
  useEffect(() => {
    if (!isActive) return;

    observerRef.current = new MutationObserver(() => {
      updatePosition();
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isActive, updatePosition]);

  // Listen for resize/scroll
  useEffect(() => {
    if (!isActive) return;

    const handleResize = () => updatePosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isActive, updatePosition]);

  if (!isActive || !currentStepData) return null;

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] pointer-events-none">
        {/* SVG Mask for spotlight */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left}
                  y={targetRect.top}
                  width={targetRect.width}
                  height={targetRect.height}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width={viewportWidth}
            height={viewportHeight}
            fill="rgba(0, 0, 0, 0.6)"
            mask="url(#spotlight-mask)"
            className="pointer-events-auto"
            onClick={skip}
          />
        </svg>

        {/* Highlight ring around target */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute border-2 border-primary rounded-lg shadow-[0_0_0_4px_rgba(var(--primary),0.2)]"
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="absolute pointer-events-auto bg-card border border-border rounded-xl shadow-2xl w-[320px]"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                Step {currentStep + 1} of {totalSteps}
              </span>
            </div>
            <button
              onClick={skip}
              className="p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="Close tutorial"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 pb-3">
            <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {currentStepData.description}
            </p>
            {currentStepData.action && (
              <p className="text-xs text-primary mt-2 font-medium">
                👉 {currentStepData.action}
              </p>
            )}
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 px-4 pb-3">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  idx === currentStep
                    ? "bg-primary w-4"
                    : idx < currentStep
                    ? "bg-primary/50"
                    : "bg-muted"
                )}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between p-4 pt-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={back}
              disabled={currentStep === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <Button
              size="sm"
              onClick={next}
              className="gap-1 min-w-[80px]"
            >
              {currentStep === totalSteps - 1 ? "Finish" : "Next"}
              {currentStep < totalSteps - 1 && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default DemoTutorialOverlay;
