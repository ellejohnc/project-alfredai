import { useEffect, useState, useRef, useLayoutEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UsePurchaseBillTutorialReturn } from "@/hooks/usePurchaseBillTutorial";

interface DemoTutorialOverlayProps {
  tutorial: UsePurchaseBillTutorialReturn;
}

const GAP = 16; // Minimum space between tooltip and highlighted element
const VIEWPORT_PADDING = 16;

type Position = 'top' | 'bottom' | 'left' | 'right';

const positionPriority: Record<Position, Position[]> = {
  'top': ['top', 'bottom', 'right', 'left'],
  'bottom': ['bottom', 'top', 'right', 'left'],
  'left': ['left', 'right', 'bottom', 'top'],
  'right': ['right', 'left', 'bottom', 'top'],
};

function calculatePosition(
  position: Position,
  targetRect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number
): { top: number; left: number } {
  let top = 0;
  let left = 0;

  switch (position) {
    case 'top':
      top = targetRect.top - tooltipHeight - GAP;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      break;
    case 'bottom':
      top = targetRect.bottom + GAP;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      break;
    case 'left':
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.left - tooltipWidth - GAP;
      break;
    case 'right':
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.right + GAP;
      break;
  }

  return { top, left };
}

function checkOverlap(
  tooltipTop: number,
  tooltipLeft: number,
  tooltipWidth: number,
  tooltipHeight: number,
  targetRect: DOMRect,
  gap: number = GAP
): boolean {
  const tooltipRight = tooltipLeft + tooltipWidth;
  const tooltipBottom = tooltipTop + tooltipHeight;
  
  // Check if there's NO overlap (with gap buffer)
  const noOverlap = 
    tooltipRight + gap < targetRect.left ||
    tooltipLeft - gap > targetRect.right ||
    tooltipBottom + gap < targetRect.top ||
    tooltipTop - gap > targetRect.bottom;
  
  return !noOverlap; // Return true if there IS overlap
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function DemoTutorialOverlay({ tutorial }: DemoTutorialOverlayProps) {
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipDimensions, setTooltipDimensions] = useState({ width: 320, height: 280 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const measurementRef = useRef<number>(0);

  // Measure actual tooltip dimensions after render
  useLayoutEffect(() => {
    if (tooltipRef.current && tutorial.isActive) {
      measurementRef.current++;
      const rect = tooltipRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setTooltipDimensions({ width: rect.width, height: rect.height });
      }
    }
  }, [tutorial.currentStep, tutorial.isActive]);

  const updatePosition = useCallback(() => {
    if (!tutorial.isActive || !tutorial.currentStepData) return;

    const element = document.getElementById(tutorial.currentStepData.elementId);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    setHighlightRect(rect);

    const { width: tooltipWidth, height: tooltipHeight } = tooltipDimensions;
    const preferredPosition = tutorial.currentStepData.position as Position;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Try each position in priority order until one works
    for (const tryPosition of positionPriority[preferredPosition]) {
      const { top, left } = calculatePosition(tryPosition, rect, tooltipWidth, tooltipHeight);
      
      // Clamp to viewport bounds
      const clampedTop = clamp(top, VIEWPORT_PADDING, viewportHeight - tooltipHeight - VIEWPORT_PADDING);
      const clampedLeft = clamp(left, VIEWPORT_PADDING, viewportWidth - tooltipWidth - VIEWPORT_PADDING);
      
      // Check if this position overlaps with the highlighted element
      const hasOverlap = checkOverlap(
        clampedTop,
        clampedLeft,
        tooltipWidth,
        tooltipHeight,
        rect,
        GAP
      );
      
      if (!hasOverlap) {
        setTooltipPosition({ top: clampedTop, left: clampedLeft });
        return;
      }
    }

    // Fallback: find the best position that minimizes overlap
    // Place it in the corner with most space
    const spaceTop = rect.top;
    const spaceBottom = viewportHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = viewportWidth - rect.right;

    let fallbackTop: number;
    let fallbackLeft: number;

    if (spaceBottom >= tooltipHeight + GAP) {
      fallbackTop = rect.bottom + GAP;
    } else if (spaceTop >= tooltipHeight + GAP) {
      fallbackTop = rect.top - tooltipHeight - GAP;
    } else {
      fallbackTop = clamp(rect.top, VIEWPORT_PADDING, viewportHeight - tooltipHeight - VIEWPORT_PADDING);
    }

    if (spaceRight >= tooltipWidth + GAP) {
      fallbackLeft = rect.right + GAP;
    } else if (spaceLeft >= tooltipWidth + GAP) {
      fallbackLeft = rect.left - tooltipWidth - GAP;
    } else {
      fallbackLeft = clamp(
        rect.left + rect.width / 2 - tooltipWidth / 2,
        VIEWPORT_PADDING,
        viewportWidth - tooltipWidth - VIEWPORT_PADDING
      );
    }

    setTooltipPosition({ top: fallbackTop, left: fallbackLeft });
  }, [tutorial.isActive, tutorial.currentStepData, tooltipDimensions]);

  useEffect(() => {
    if (!tutorial.isActive || !tutorial.currentStepData) return;

    // Initial positioning
    updatePosition();

    // Update on resize/scroll
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [tutorial.isActive, tutorial.currentStepData, tutorial.currentStep, updatePosition]);

  if (!tutorial.isActive || !tutorial.currentStepData) return null;

  return (
    <SafeAnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] pointer-events-none"
      >
        {/* Backdrop with cutout */}
        <svg className="absolute inset-0 w-full h-full pointer-events-auto">
          <defs>
            <mask id="tutorial-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {highlightRect && (
                <rect
                  x={highlightRect.left - 8}
                  y={highlightRect.top - 8}
                  width={highlightRect.width + 16}
                  height={highlightRect.height + 16}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.6)"
            mask="url(#tutorial-mask)"
          />
        </svg>

        {/* Highlight ring */}
        {highlightRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute pointer-events-none"
            style={{
              top: highlightRect.top - 8,
              left: highlightRect.left - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
            }}
          >
            <div className="absolute inset-0 rounded-xl border-2 border-primary animate-pulse" />
            <div className="absolute inset-0 rounded-xl bg-primary/10" />
          </motion.div>
        )}

        {/* Tooltip */}
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.1 }}
          className="fixed w-80 bg-card border border-border rounded-xl shadow-2xl pointer-events-auto"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">
                  {tutorial.currentStepData.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Step {tutorial.currentStep + 1} of {tutorial.totalSteps}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={tutorial.skip}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-3">
              {tutorial.currentStepData.description}
            </p>
            {tutorial.currentStepData.action && (
              <p className="text-xs text-primary font-medium">
                💡 {tutorial.currentStepData.action}
              </p>
            )}
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 pb-3">
            {Array.from({ length: tutorial.totalSteps }).map((_, i) => (
              <button
                key={i}
                onClick={() => tutorial.goToStep(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === tutorial.currentStep
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30 rounded-b-xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={tutorial.back}
              disabled={tutorial.currentStep === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              size="sm"
              onClick={tutorial.next}
              className="gap-1"
            >
              {tutorial.currentStep === tutorial.totalSteps - 1 ? (
                "Finish"
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </SafeAnimatePresence>
  );
}

export default DemoTutorialOverlay;
