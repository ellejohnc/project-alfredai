import { memo, useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { SafeAnimatePresence } from '@/components/ui/safe-animate-presence';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TutorialStep } from '@/hooks/useTutorial';

interface GuidedTutorialProps {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  stepData: TutorialStep | null;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onComplete: () => void;
  onGoToStep: (step: number) => void;
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const GuidedTutorial = memo(function GuidedTutorial({
  isActive,
  currentStep,
  totalSteps,
  stepData,
  onNext,
  onBack,
  onSkip,
  onComplete,
}: GuidedTutorialProps) {
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  const updateHighlight = useCallback(() => {
    if (!stepData) return;

    const element = document.getElementById(stepData.elementId);
    if (element) {
      // Use getBoundingClientRect for viewport-relative coordinates (for fixed positioning)
      const rect = element.getBoundingClientRect();
      const padding = 8;
      
      // Highlight rect uses viewport coordinates (no scroll offset needed for fixed elements)
      setHighlightRect({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });

      // Calculate tooltip position
      const tooltipWidth = 320;
      const tooltipHeight = tooltipRef.current?.offsetHeight || 220;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 16;
      
      let position: 'bottom' | 'top' | 'left' | 'right' = 'bottom';
      let tooltipTop = 0;
      let tooltipLeft = 0;

      // Determine best position based on available space
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const spaceRight = viewportWidth - rect.right;
      const spaceLeft = rect.left;

      // Prefer bottom, then top, then sides
      if (spaceBelow >= tooltipHeight + margin) {
        position = 'bottom';
      } else if (spaceAbove >= tooltipHeight + margin) {
        position = 'top';
      } else if (spaceRight >= tooltipWidth + margin) {
        position = 'right';
      } else if (spaceLeft >= tooltipWidth + margin) {
        position = 'left';
      } else {
        // Default to bottom but clamp
        position = 'bottom';
      }

      switch (position) {
        case 'bottom':
          tooltipTop = rect.bottom + margin;
          tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'top':
          tooltipTop = rect.top - tooltipHeight - margin;
          tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'right':
          tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2;
          tooltipLeft = rect.right + margin;
          break;
        case 'left':
          tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2;
          tooltipLeft = rect.left - tooltipWidth - margin;
          break;
      }

      // Clamp tooltip to viewport bounds
      tooltipLeft = Math.max(margin, Math.min(tooltipLeft, viewportWidth - tooltipWidth - margin));
      tooltipTop = Math.max(margin, Math.min(tooltipTop, viewportHeight - tooltipHeight - margin));

      setTooltipStyle({
        top: tooltipTop,
        left: tooltipLeft,
        maxWidth: tooltipWidth,
      });
    }
  }, [stepData]);

  // Use requestAnimationFrame for smooth scroll tracking
  useEffect(() => {
    if (!isActive || !stepData) return;

    const animate = () => {
      updateHighlight();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Initial update after a brief delay
    const timer = setTimeout(() => {
      animate();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, stepData, updateHighlight]);

  // Also update on resize
  useEffect(() => {
    if (!isActive) return;
    
    window.addEventListener('resize', updateHighlight);
    return () => window.removeEventListener('resize', updateHighlight);
  }, [isActive, updateHighlight]);

  if (!isActive || !stepData) return null;

  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  return (
    <SafeAnimatePresence>
      {isActive && (
        <>
          {/* Backdrop with spotlight cutout - uses fixed positioning */}
          <div
            className="fixed inset-0 z-[100] pointer-events-auto"
            onClick={onSkip}
          >
            <motion.svg
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              width="100%"
              height="100%"
              className="fixed inset-0"
              preserveAspectRatio="none"
            >
              <defs>
                <mask id="tutorial-spotlight-mask">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  {highlightRect && (
                    <motion.rect
                      initial={{ opacity: 0 }}
                      animate={{ 
                        x: highlightRect.left,
                        y: highlightRect.top,
                        width: highlightRect.width,
                        height: highlightRect.height,
                        opacity: 1,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
                fill="rgba(0, 0, 0, 0.75)"
                mask="url(#tutorial-spotlight-mask)"
              />
            </motion.svg>
          </div>

          {/* Animated highlight border */}
          {highlightRect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                top: highlightRect.top,
                left: highlightRect.left,
                width: highlightRect.width,
                height: highlightRect.height,
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed z-[101] rounded-xl pointer-events-none"
              style={{
                boxShadow: '0 0 0 3px hsl(var(--primary)), 0 0 20px hsl(var(--primary) / 0.4)',
              }}
            />
          )}

          {/* Tooltip card - always visible within viewport */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed z-[102]"
            style={tooltipStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="shadow-2xl border-primary/30 bg-card/95 backdrop-blur-sm">
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {currentStep + 1}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        of {totalSteps}
                      </span>
                    </div>
                    <h4 className="font-semibold text-foreground leading-tight">
                      {stepData.title}
                    </h4>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 -mt-1 -mr-1 hover:bg-destructive/10 hover:text-destructive"
                    onClick={onSkip}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {stepData.description}
                </p>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2 py-1">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={false}
                      animate={{
                        scale: i === currentStep ? 1.3 : 1,
                        backgroundColor: i === currentStep 
                          ? 'hsl(var(--primary))' 
                          : i < currentStep 
                            ? 'hsl(var(--primary) / 0.5)'
                            : 'hsl(var(--muted-foreground) / 0.3)',
                      }}
                      className="w-2 h-2 rounded-full"
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSkip}
                    className="text-muted-foreground hover:text-foreground text-xs px-2"
                  >
                    Skip
                  </Button>
                  <div className="flex gap-2">
                    {!isFirstStep && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onBack}
                        className="gap-1 h-8"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Back
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={isLastStep ? onComplete : onNext}
                      className="gap-1 h-8"
                    >
                      {isLastStep ? (
                        'Finish'
                      ) : (
                        <>
                          Next
                          <ChevronRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </SafeAnimatePresence>
  );
});
