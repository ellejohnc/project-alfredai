import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseTechnicalReportTutorialReturn } from "@/hooks/useTechnicalReportTutorial";

interface DemoTutorialOverlayProps {
  tutorial: UseTechnicalReportTutorialReturn;
}

const GAP = 16;
const VIEWPORT_PADDING = 16;

export function DemoTutorialOverlay({ tutorial }: DemoTutorialOverlayProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
    transformOrigin: string;
  }>({ top: -1000, left: -1000, transformOrigin: 'center' });
  const [isPositioned, setIsPositioned] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const { isActive, currentStep, totalSteps, currentStepData, next, back, skip } = tutorial;

  // Calculate tooltip position from a given rect - pass rect directly to avoid state timing issues
  const calculatePositionFromRect = useCallback((rect: DOMRect) => {
    if (!tooltipRef.current || !currentStepData) return;
    
    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const { position } = currentStepData;
    
    let top = 0;
    let left = 0;
    let transformOrigin = 'center';

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    switch (position) {
      case 'top':
        top = rect.top - tooltipRect.height - GAP;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        transformOrigin = 'bottom center';
        break;
      case 'bottom':
        top = rect.bottom + GAP;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        transformOrigin = 'top center';
        break;
      case 'left':
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.left - tooltipRect.width - GAP;
        transformOrigin = 'center right';
        break;
      case 'right':
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.right + GAP;
        transformOrigin = 'center left';
        break;
    }

    // Keep within viewport
    if (left < VIEWPORT_PADDING) left = VIEWPORT_PADDING;
    if (left + tooltipRect.width > viewportWidth - VIEWPORT_PADDING) {
      left = viewportWidth - tooltipRect.width - VIEWPORT_PADDING;
    }
    if (top < VIEWPORT_PADDING) top = VIEWPORT_PADDING;
    if (top + tooltipRect.height > viewportHeight - VIEWPORT_PADDING) {
      top = viewportHeight - tooltipRect.height - VIEWPORT_PADDING;
    }

    setTooltipPosition({ top, left, transformOrigin });
    setIsPositioned(true);
  }, [currentStepData]);

  // Update target element position
  const updateTargetRect = useCallback(() => {
    if (!currentStepData) return;
    
    const element = document.getElementById(currentStepData.elementId);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      calculatePositionFromRect(rect);
    }
  }, [currentStepData, calculatePositionFromRect]);

  // Flash the target button for user attention
  useEffect(() => {
    if (!isActive || !currentStepData?.targetButtonText) return;
    
    const targetElement = document.getElementById(currentStepData.elementId);
    if (!targetElement) return;
    
    // Find buttons within the target element that match the text
    const buttons = targetElement.querySelectorAll('button');
    let targetButton: HTMLButtonElement | null = null;
    
    buttons.forEach(btn => {
      if (btn.textContent?.includes(currentStepData.targetButtonText || '')) {
        targetButton = btn;
      }
    });
    
    if (targetButton) {
      targetButton.classList.add('tutorial-flash-button');
    }
    
    return () => {
      if (targetButton) {
        targetButton.classList.remove('tutorial-flash-button');
      }
    };
  }, [isActive, currentStepData]);

  // RAF-based positioning with mutation observer for dynamic content
  useEffect(() => {
    if (!isActive || !currentStepData) {
      setIsPositioned(false);
      return;
    }
    
    let retryCount = 0;
    const maxRetries = 30;
    let observer: MutationObserver | null = null;
    
    const positionTooltip = () => {
      const element = document.getElementById(currentStepData.elementId);
      if (element && tooltipRef.current) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        calculatePositionFromRect(rect);
        
        // Set up mutation observer to re-measure when element content changes
        if (!observer) {
          observer = new MutationObserver(() => {
            const newRect = element.getBoundingClientRect();
            setTargetRect(newRect);
            calculatePositionFromRect(newRect);
          });
          observer.observe(element, { 
            childList: true, 
            subtree: true, 
            attributes: true 
          });
        }
      } else if (retryCount < maxRetries) {
        retryCount++;
        rafRef.current = requestAnimationFrame(positionTooltip);
      }
    };
    
    // Start immediately with RAF
    rafRef.current = requestAnimationFrame(positionTooltip);
    
    // Also re-measure after a short delay to catch late-rendering content
    const delayedMeasure = setTimeout(() => {
      const element = document.getElementById(currentStepData.elementId);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        calculatePositionFromRect(rect);
      }
    }, 150);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (observer) {
        observer.disconnect();
      }
      clearTimeout(delayedMeasure);
    };
  }, [isActive, currentStepData, calculatePositionFromRect]);

  // Handle window resize and scroll
  useEffect(() => {
    if (!isActive) return;

    const handleReposition = () => {
      updateTargetRect();
    };

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isActive, updateTargetRect]);

  if (!isActive || !currentStepData) return null;

  const padding = 8;

  // Generate clip path for rectangular cutout
  const getClipPath = () => {
    if (!targetRect) return 'none';
    
    const pad = padding;
    const top = targetRect.top - pad;
    const left = targetRect.left - pad;
    const right = targetRect.right + pad;
    const bottom = targetRect.bottom + pad;
    
    // Create a polygon that covers the entire screen except the target area
    return `polygon(
      0% 0%, 
      0% 100%, 
      ${left}px 100%, 
      ${left}px ${top}px, 
      ${right}px ${top}px, 
      ${right}px ${bottom}px, 
      ${left}px ${bottom}px, 
      ${left}px 100%, 
      100% 100%, 
      100% 0%
    )`;
  };

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Dark overlay with rectangular cutout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] pointer-events-none bg-black/60"
            style={{
              clipPath: getClipPath(),
            }}
          />

          {/* Light glow effect around target */}
          {targetRect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed z-[89] pointer-events-none"
              style={{
                top: targetRect.top - padding - 20,
                left: targetRect.left - padding - 20,
                width: targetRect.width + padding * 2 + 40,
                height: targetRect.height + padding * 2 + 40,
                background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 70%)',
                borderRadius: '16px',
              }}
            />
          )}

          {/* Highlight border around target */}
          {targetRect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed z-[91] border-2 border-primary rounded-lg pointer-events-none"
              style={{
                top: targetRect.top - padding,
                left: targetRect.left - padding,
                width: targetRect.width + padding * 2,
                height: targetRect.height + padding * 2,
                boxShadow: '0 0 0 4px rgba(236, 72, 153, 0.2), 0 0 20px rgba(236, 72, 153, 0.3)',
              }}
            />
          )}

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: isPositioned ? 1 : 0, 
              scale: isPositioned ? 1 : 0.9 
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[92] w-72 md:w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              transformOrigin: tooltipPosition.transformOrigin,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary">
                  Step {currentStep + 1} of {totalSteps}
                </span>
              </div>
              <button
                onClick={skip}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Skip tutorial"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-1">
                  {currentStepData.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {currentStepData.description}
                </p>
              </div>

              {currentStepData.action && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                  <p className="text-xs text-primary font-medium">
                    💡 {currentStepData.action}
                  </p>
                </div>
              )}
            </div>

            {/* Footer with navigation */}
            <div className="flex items-center justify-between p-3 border-t border-border bg-muted/20">
              <Button
                variant="ghost"
                size="sm"
                onClick={back}
                disabled={currentStep === 0}
                className="gap-1 h-8 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </Button>

              {/* Progress dots */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-colors",
                      i === currentStep
                        ? "bg-primary"
                        : i < currentStep
                        ? "bg-primary/40"
                        : "bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>

              <Button
                size="sm"
                onClick={next}
                className="gap-1 h-8 text-xs"
              >
                {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
                {currentStep < totalSteps - 1 && <ChevronRight className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
