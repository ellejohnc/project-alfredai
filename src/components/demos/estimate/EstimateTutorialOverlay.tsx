import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Lightbulb, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseEstimateTutorialReturn } from "@/hooks/useEstimateTutorial";

// Handler to find and click target demo button
const findAndClickTargetButton = (
  targetSelector: string | undefined,
  targetButtonText: string | undefined
): boolean => {
  if (!targetSelector || !targetButtonText) return false;
  
  const targetElement = document.querySelector(targetSelector);
  if (!targetElement) return false;
  
  const buttons = targetElement.querySelectorAll('button');
  let targetButton: HTMLButtonElement | null = null;
  
  buttons.forEach(btn => {
    if (btn.textContent?.includes(targetButtonText)) {
      targetButton = btn as HTMLButtonElement;
    }
  });
  
  if (targetButton && !(targetButton as HTMLButtonElement).disabled) {
    (targetButton as HTMLButtonElement).click();
    return true;
  }
  
  return false;
};

interface EstimateTutorialOverlayProps {
  tutorial: UseEstimateTutorialReturn;
}

const GAP = 12;
const VIEWPORT_PADDING = 12;
const HIGHLIGHT_PADDING = 8;

export function EstimateTutorialOverlay({ tutorial }: EstimateTutorialOverlayProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
    transformOrigin: string;
  }>({ top: -1000, left: -1000, transformOrigin: 'center' });
  const [isPositioned, setIsPositioned] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const { 
    isTutorialActive, 
    currentStep, 
    totalSteps, 
    currentStepIndex,
    isLastStep,
    requiresAction,
    nextStep, 
    forceNextStep,
    previousStep, 
    dismissTutorial 
  } = tutorial;

  // Calculate tooltip position - prefer bottom of target on mobile, right on desktop
  const calculatePositionFromRect = useCallback((rect: DOMRect) => {
    if (!tooltipRef.current || !currentStep) return;
    
    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const position = currentStep.position || 'right';
    
    let top = 0;
    let left = 0;
    let transformOrigin = 'center';

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth < 768;
    
    // On mobile, always position at bottom of screen
    if (isMobile) {
      top = viewportHeight - tooltipRect.height - VIEWPORT_PADDING - 60; // Account for mobile nav
      left = VIEWPORT_PADDING;
      transformOrigin = 'bottom left';
    } else {
      switch (position) {
        case 'top':
          top = rect.top - tooltipRect.height - GAP;
          left = rect.left + (rect.width - tooltipRect.width) / 2;
          transformOrigin = 'bottom center';
          break;
        case 'bottom':
          top = rect.bottom + GAP;
          left = rect.left;
          transformOrigin = 'top left';
          break;
        case 'left':
          top = rect.top;
          left = rect.left - tooltipRect.width - GAP;
          transformOrigin = 'top right';
          break;
        case 'right':
          top = rect.top;
          left = rect.right + GAP;
          transformOrigin = 'top left';
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
    }

    setTooltipPosition({ top, left, transformOrigin });
    setIsPositioned(true);
  }, [currentStep]);

  // Update target element position
  const updateTargetRect = useCallback(() => {
    if (!currentStep?.targetSelector) return;
    
    const element = document.querySelector(currentStep.targetSelector);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      calculatePositionFromRect(rect);
    }
  }, [currentStep, calculatePositionFromRect]);

  // Flash the target button for user attention
  useEffect(() => {
    if (!isTutorialActive || !currentStep?.targetButtonText) return;
    
    const targetElement = currentStep.targetSelector 
      ? document.querySelector(currentStep.targetSelector)
      : null;
    if (!targetElement) return;
    
    // Find buttons within the target element that match the text
    const buttons = targetElement.querySelectorAll('button');
    let targetButton: HTMLButtonElement | null = null;
    
    buttons.forEach(btn => {
      if (btn.textContent?.includes(currentStep.targetButtonText || '')) {
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
  }, [isTutorialActive, currentStep]);

  // RAF-based positioning with mutation observer for dynamic content
  useEffect(() => {
    if (!isTutorialActive || !currentStep?.targetSelector) {
      setIsPositioned(false);
      return;
    }
    
    let retryCount = 0;
    const maxRetries = 30;
    let observer: MutationObserver | null = null;
    
    const positionTooltip = () => {
      const element = document.querySelector(currentStep.targetSelector!);
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
      const element = document.querySelector(currentStep.targetSelector!);
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
  }, [isTutorialActive, currentStep, calculatePositionFromRect]);

  // Handle window resize and scroll
  useEffect(() => {
    if (!isTutorialActive) return;

    const handleReposition = () => {
      updateTargetRect();
    };

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isTutorialActive, updateTargetRect]);

  if (!isTutorialActive || !currentStep) return null;

  // Generate clip path for rectangular cutout
  const getClipPath = () => {
    if (!targetRect) return 'none';
    
    const pad = HIGHLIGHT_PADDING;
    const top = Math.max(0, targetRect.top - pad);
    const left = Math.max(0, targetRect.left - pad);
    const right = Math.min(window.innerWidth, targetRect.right + pad);
    const bottom = Math.min(window.innerHeight, targetRect.bottom + pad);
    
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
      {isTutorialActive && (
        <>
          {/* Dark overlay with rectangular cutout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] pointer-events-none bg-black/50"
            style={{
              clipPath: getClipPath(),
            }}
          />

          {/* Highlight border around target */}
          {targetRect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="fixed z-[91] border-2 border-primary rounded-lg pointer-events-none"
              style={{
                top: targetRect.top - HIGHLIGHT_PADDING,
                left: targetRect.left - HIGHLIGHT_PADDING,
                width: targetRect.width + HIGHLIGHT_PADDING * 2,
                height: targetRect.height + HIGHLIGHT_PADDING * 2,
                boxShadow: '0 0 0 3px rgba(236, 72, 153, 0.15), 0 0 30px rgba(236, 72, 153, 0.2)',
              }}
            />
          )}

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: isPositioned ? 1 : 0, 
              y: isPositioned ? 0 : 10 
            }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[92] w-[calc(100vw-24px)] md:w-72 lg:w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              transformOrigin: tooltipPosition.transformOrigin,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-primary/5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{currentStepIndex + 1}</span>
                </div>
                <span className="text-xs font-medium text-foreground">
                  of {totalSteps} steps
                </span>
              </div>
              <button
                onClick={dismissTutorial}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Skip tutorial"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 space-y-2">
              <h3 className="font-semibold text-foreground text-sm">
                {currentStep.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {currentStep.description}
              </p>

              {/* Action required indicator */}
              {currentStep.action && (
                <div className={cn(
                  "flex items-start gap-2 rounded-lg px-2.5 py-2 border",
                  requiresAction 
                    ? "bg-amber-50 border-amber-200" 
                    : "bg-green-50 border-green-200"
                )}>
                  {requiresAction ? (
                    <MousePointerClick className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0 animate-pulse" />
                  ) : (
                    <Lightbulb className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" />
                  )}
                  <p className={cn(
                    "text-xs font-medium",
                    requiresAction ? "text-amber-800" : "text-green-800"
                  )}>
                    {currentStep.action}
                  </p>
                </div>
              )}
            </div>

            {/* Footer with navigation */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/30">
              {/* Back button - only show if not on first step */}
              {currentStepIndex > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={previousStep}
                  className="gap-1 h-7 text-xs px-2"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Back
                </Button>
              ) : (
                <div /> // Spacer
              )}

              {/* Progress dots */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-colors",
                      i === currentStepIndex
                        ? "bg-primary"
                        : i < currentStepIndex
                        ? "bg-primary/40"
                        : "bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>

              {/* Right side: Next/Finish button + Skip Guide */}
              <div className="flex items-center gap-1">
                {isLastStep ? (
                  <Button
                    size="sm"
                    onClick={nextStep}
                    className="h-7 text-xs px-3"
                  >
                    Finish
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Try to click the target demo button first
                        const clicked = findAndClickTargetButton(
                          currentStep?.targetSelector,
                          currentStep?.targetButtonText
                        );
                        // If button not found or disabled, just advance tutorial
                        if (!clicked) {
                          forceNextStep();
                        }
                        // If clicked, tutorial will auto-sync via syncToDemoStep
                      }}
                      className="gap-1 h-7 text-xs px-2"
                    >
                      Next
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                    <button
                      onClick={dismissTutorial}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 min-h-[28px]"
                    >
                      Skip
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
