import { useState, useEffect, useRef } from "react";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { InlineDemoSpeedControl } from "@/components/demos/shared/InlineDemoSpeedControl";
import { motion } from "framer-motion";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Check, Shuffle, Monitor, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { DEMO_STEPS, EngagementContext, OperationalScore, ConfigComplexity, DeliveryRisk, FeeRange } from "./consultant/types";
import { 
  generateRandomEngagementContext,
  generateRandomOperationalScores,
  generateRandomConfigComplexity,
  generateRandomDeliveryRisk,
  generateRandomFeeRange,
  calculateRiskClassification,
  DEMO_ENGAGEMENT_SHAPES,
  DEMO_GUARDRAILS,
  AI_COMMENTARY
} from "./consultant/demoData";
import { EngagementContextStep } from "./consultant/EngagementContextStep";
import { OperationalScanStep } from "./consultant/OperationalScanStep";
import { ConfigComplexityStep } from "./consultant/ConfigComplexityStep";
import { DeliveryRiskStep } from "./consultant/DeliveryRiskStep";
import { EngagementShapeStep } from "./consultant/EngagementShapeStep";
import { FeeRangeStep } from "./consultant/FeeRangeStep";
import { ProposalGuardrailsStep } from "./consultant/ProposalGuardrailsStep";
import { InternalSummaryStep } from "./consultant/InternalSummaryStep";

interface DemoScenario {
  engagementContext: EngagementContext;
  operationalScores: OperationalScore[];
  configComplexity: ConfigComplexity;
  deliveryRisk: DeliveryRisk;
  feeRange: FeeRange;
}

const generateNewScenario = (): DemoScenario => ({
  engagementContext: generateRandomEngagementContext(),
  operationalScores: generateRandomOperationalScores(),
  configComplexity: generateRandomConfigComplexity(),
  deliveryRisk: generateRandomDeliveryRisk(),
  feeRange: generateRandomFeeRange(),
});

export default function ConsultantDecisionSupportDemo() {
  const { applySpeed } = useDemoSpeed();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepProgress, setStepProgress] = useState(0);
  const [scenario, setScenario] = useState<DemoScenario>(() => generateNewScenario());
  const [showMobileWarning, setShowMobileWarning] = useState(false);

  // Check if mobile on mount
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setShowMobileWarning(true);
    }
  }, []);
  
  // Swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const minSwipeDistance = 50;

  const goToNextStep = () => {
    if (currentStep < DEMO_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      setStepProgress(0);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setStepProgress(0);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNextStep();
    } else if (isRightSwipe) {
      goToPrevStep();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToNextStep();
      } else if (e.key === 'ArrowLeft') {
        goToPrevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  // Generate dynamic AI commentary based on current scenario
  const getDynamicAICommentary = () => {
    const riskClass = calculateRiskClassification(scenario.deliveryRisk);
    const avgScore = scenario.operationalScores.reduce((sum, s) => sum + s.score, 0) / scenario.operationalScores.length;
    const entropy = Math.round((1 - avgScore / 5) * 100);
    
    return {
      ...AI_COMMENTARY,
      context: `${scenario.engagementContext.industry} company (${scenario.engagementContext.revenueBand}) in ${scenario.engagementContext.insightSource.toLowerCase()} mode. Historical pattern: these engagements surface 2-3x the complexity initially visible. Risk posture: ${riskClass === 'RED' ? 'high' : riskClass === 'AMBER' ? 'moderate-to-high' : 'moderate'}. Recommend building discovery buffer.`,
      operational: {
        overall: `Operational entropy at ${entropy}%. ${entropy > 50 ? 'This profile typically leads to scope creep during implementation.' : 'Relatively structured environment, but watch for hidden dependencies.'} The combination of current scores creates ${entropy > 60 ? 'approval bottlenecks that extend timelines' : 'manageable complexity with proper planning'}.`,
        contradiction: null,
        warning: `Based on scores: ${entropy > 50 ? 'Build buffer for discovery overhead and data reconciliation work.' : 'Standard discovery process should suffice, monitor for exceptions.'}`,
      },
      risk: {
        classification: riskClass as "GREEN" | "AMBER" | "RED",
        message: riskClass === 'RED' 
          ? "High risk profile detected. Multiple factors suggest delivery challenges. Consider diagnostic-only or heavily phased approach."
          : riskClass === 'AMBER'
          ? "Moderate risk profile. The organization shows mixed readiness signals. Phased approach with clear gates recommended."
          : "Lower risk profile. Favorable conditions for engagement success. Standard delivery approach viable.",
        constraints: AI_COMMENTARY.risk.constraints,
      },
      summary: `This ${scenario.engagementContext.clientName} engagement ${riskClass === 'GREEN' ? 'has favorable fundamentals' : riskClass === 'AMBER' ? 'has solid fundamentals but carries execution risk' : 'presents significant delivery challenges'}. ${scenario.engagementContext.industry} sector dynamics and ${scenario.engagementContext.revenueBand} scale inform fee positioning. Key success factor: sponsor strength and sustained leadership alignment.`,
    };
  };

  useEffect(() => {
    if (!isPlaying) return;

    const step = DEMO_STEPS[currentStep];
    if (!step) {
      setIsPlaying(false);
      return;
    }

    const progressInterval = setInterval(() => {
      setStepProgress(prev => (prev >= 100 ? 100 : prev + 2));
    }, applySpeed(step.duration) / 50);

    const stepTimeout = setTimeout(() => {
      if (currentStep < DEMO_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
        setStepProgress(0);
      } else {
        setIsPlaying(false);
      }
    }, applySpeed(step.duration));

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimeout);
    };
  }, [isPlaying, currentStep]);

  const handleReset = () => {
    setCurrentStep(0);
    setStepProgress(0);
    setIsPlaying(false);
    setScenario(generateNewScenario());
  };

  const handleShuffle = () => {
    // Regenerate all data without resetting step progress
    setScenario(generateNewScenario());
  };

  const dynamicCommentary = getDynamicAICommentary();

  const renderStepContent = () => {
    const stepId = DEMO_STEPS[currentStep]?.id;
    
    switch (stepId) {
      case "context":
        return (
          <EngagementContextStep 
            data={scenario.engagementContext} 
            aiCommentary={dynamicCommentary.context}
            onAnalysisComplete={() => {
              // Auto-advance to next step and start autoplay after analysis
              setTimeout(() => {
                goToNextStep();
                setIsPlaying(true);
              }, 500);
            }}
          />
        );
      case "operational":
        return <OperationalScanStep scores={scenario.operationalScores} aiCommentary={dynamicCommentary.operational} />;
      case "config":
        return <ConfigComplexityStep data={scenario.configComplexity} aiCommentary={AI_COMMENTARY.config} />;
      case "risk":
        return <DeliveryRiskStep data={scenario.deliveryRisk} aiCommentary={dynamicCommentary.risk} />;
      case "shape":
        return <EngagementShapeStep shapes={DEMO_ENGAGEMENT_SHAPES} aiCommentary={AI_COMMENTARY.shape} />;
      case "fee":
        return <FeeRangeStep data={scenario.feeRange} aiCommentary={AI_COMMENTARY.fee} />;
      case "guardrails":
        return <ProposalGuardrailsStep data={DEMO_GUARDRAILS} />;
      case "summary":
        return (
          <InternalSummaryStep 
            context={scenario.engagementContext} 
            feeRange={scenario.feeRange}
            selectedShape={DEMO_ENGAGEMENT_SHAPES.find(s => s.selected) || null}
            aiSummary={dynamicCommentary.summary}
            deliveryRisk={scenario.deliveryRisk}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="space-y-6"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Warning Dialog */}
      <Dialog open={showMobileWarning} onOpenChange={setShowMobileWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary" />
              Best on Desktop
            </DialogTitle>
            <DialogDescription className="text-left pt-2">
              This demo is optimized for desktop viewing. While it works on mobile, you'll get the best experience with a larger screen where all the data tables and AI commentary are fully visible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowMobileWarning(false)}>
              <X className="w-4 h-4 mr-1" /> Continue Anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">Consultant Decision Support</h2>
          <p className="text-sm text-muted-foreground">Internal pre-engagement assessment tool</p>
        </div>
        <div className="flex items-center gap-2">
          <InlineDemoSpeedControl compact className="hidden sm:flex" />
          <Button variant="outline" size="sm" onClick={handleShuffle}>
            <Shuffle className="w-4 h-4 mr-1" /> Shuffle Scenario
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Reset
          </Button>
          <Button size="sm" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
        </div>
      </div>

      {/* Step Progress with Arrows */}
      <Card className="border-border/50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2">
            {/* Left Arrow */}
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevStep}
              disabled={currentStep === 0}
              className="shrink-0 h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Step Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 flex-1 scrollbar-hide">
              {DEMO_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <button
                    key={step.id}
                    onClick={() => { setCurrentStep(index); setStepProgress(0); }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all shrink-0 ${
                      isActive ? 'bg-primary text-primary-foreground' : 
                      isCompleted ? 'bg-primary/10 text-primary' : 
                      'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    <span className="text-xs font-medium whitespace-nowrap hidden sm:inline">{step.title}</span>
                    {isActive && <ChevronRight className="w-3 h-3 hidden sm:block" />}
                  </button>
                );
              })}
            </div>

            {/* Right Arrow */}
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextStep}
              disabled={currentStep === DEMO_STEPS.length - 1}
              className="shrink-0 h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Step Counter for Mobile */}
          <div className="flex items-center justify-center gap-2 mt-2 sm:hidden">
            <span className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {DEMO_STEPS.length}
            </span>
            <span className="text-xs font-medium text-primary">
              {DEMO_STEPS[currentStep].title}
            </span>
          </div>

          {isPlaying && <Progress value={stepProgress} className="h-1 mt-3" />}
        </CardContent>
      </Card>

      {/* Step Content */}
      <SafeAnimatePresence mode="wait">
        <motion.div
          key={`${currentStep}-${scenario.engagementContext.clientName}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStepContent()}
        </motion.div>
      </SafeAnimatePresence>
    </div>
  );
}
