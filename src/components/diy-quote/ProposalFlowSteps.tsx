import { memo, useMemo } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DragScrollArea } from '@/components/ui/drag-scroll-area';

export type ProposalFlowStep = 'save' | 'payment-links' | 'review' | 'ready';

interface ProposalFlowStepsProps {
  currentStep: ProposalFlowStep;
  savedQuoteId: string | null;
  hasPaymentLinks: boolean;
  isProposalReady: boolean;
}

const STEPS = [
  { id: 'save' as const, label: 'Save Quote', shortLabel: 'Save' },
  { id: 'payment-links' as const, label: 'Generate Payment Links', shortLabel: 'Links' },
  { id: 'review' as const, label: 'Review & Confirm', shortLabel: 'Review' },
  { id: 'ready' as const, label: 'Share with Client', shortLabel: 'Share' },
];

export const ProposalFlowSteps = memo(function ProposalFlowSteps({
  currentStep,
  savedQuoteId,
  hasPaymentLinks,
  isProposalReady,
}: ProposalFlowStepsProps) {
  const getStepStatus = (stepId: ProposalFlowStep): 'completed' | 'current' | 'upcoming' => {
    const stepOrder = STEPS.findIndex(s => s.id === stepId);
    const currentOrder = STEPS.findIndex(s => s.id === currentStep);
    
    // Override based on actual state
    if (stepId === 'save' && savedQuoteId) return 'completed';
    if (stepId === 'payment-links' && hasPaymentLinks) return 'completed';
    if (stepId === 'review' && isProposalReady) return 'completed';
    if (stepId === 'ready' && isProposalReady) return 'current';
    
    if (stepOrder < currentOrder) return 'completed';
    if (stepOrder === currentOrder) return 'current';
    return 'upcoming';
  };

  // Get current step info for status display
  const currentStepInfo = useMemo(() => {
    const index = STEPS.findIndex(s => s.id === currentStep);
    return {
      number: index + 1,
      label: STEPS[index]?.label || 'Unknown Step',
    };
  }, [currentStep]);

  const renderStepIndicator = (step: typeof STEPS[0], index: number, isMobile: boolean) => {
    const status = getStepStatus(step.id);
    const circleSize = isMobile ? "w-8 h-8" : "w-8 h-8";
    const fontSize = isMobile ? "text-xs" : "text-sm";
    const iconSize = isMobile ? "w-4 h-4" : "w-4 h-4";
    const connectorWidth = isMobile ? "w-6" : "w-10";

    return (
      <div key={step.id} className="flex items-center shrink-0">
        <div className="flex flex-col items-center gap-1">
          <div className={cn(
            "rounded-full flex items-center justify-center font-medium transition-all duration-200 touch-manipulation",
            circleSize,
            fontSize,
            status === 'completed' && "bg-green-500 text-white",
            status === 'current' && "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
            status === 'upcoming' && "bg-muted text-muted-foreground border border-border"
          )}>
            {status === 'completed' ? (
              <Check className={iconSize} />
            ) : (
              index + 1
            )}
          </div>
          <span className={cn(
            "text-center whitespace-nowrap transition-colors",
            isMobile ? "text-[10px]" : "text-xs",
            status === 'current' ? "text-primary font-semibold" : "text-muted-foreground",
            status === 'completed' && "text-green-600"
          )}>
            {isMobile ? step.shortLabel : step.label}
          </span>
        </div>
        {index < STEPS.length - 1 && (
          <div className={cn(
            "h-0.5 mx-2 shrink-0 transition-colors",
            connectorWidth,
            status === 'completed' ? "bg-green-500" : "bg-border"
          )} />
        )}
      </div>
    );
  };

  return (
    <div className="mb-4 space-y-3">
      {/* Current Status Display */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
        isProposalReady 
          ? "bg-green-500/10 text-green-700 dark:text-green-400" 
          : "bg-primary/10 text-primary"
      )}>
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-current/20 text-xs font-bold">
          {currentStepInfo.number}
        </span>
        <span>Step {currentStepInfo.number}: {currentStepInfo.label}</span>
      </div>

      {/* Mobile: Scrollable with arrows */}
      <div className="sm:hidden">
        <DragScrollArea
          className="py-2"
          contentClassName="px-2"
          arrowSize="sm"
          alwaysShowArrows={true}
        >
          <div className="flex items-center gap-1 min-w-max px-1">
            {STEPS.map((step, index) => renderStepIndicator(step, index, true))}
          </div>
        </DragScrollArea>
      </div>

      {/* Desktop: Scrollable with arrows for narrow containers */}
      <div className="hidden sm:block">
        <DragScrollArea
          className="py-2"
          contentClassName="px-2"
          arrowSize="sm"
          alwaysShowArrows={false}
        >
          <div className="flex items-center gap-1 min-w-max px-1">
            {STEPS.map((step, index) => renderStepIndicator(step, index, false))}
          </div>
        </DragScrollArea>
      </div>
    </div>
  );
});
