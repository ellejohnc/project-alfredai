import { useState, useCallback, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  ArrowLeft, 
  FileStack, 
  CheckSquare, 
  FileSearch, 
  Calculator, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useHaptics } from "@/hooks/useHaptics";
import { useEstimateTutorial } from "@/hooks/useEstimateTutorial";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import ErrorBoundary from "@/components/ErrorBoundary";

// Components
import { UploadStep } from "@/components/demos/estimate/UploadStep";
import { ScopeConfirmationStep } from "@/components/demos/estimate/ScopeConfirmationStep";
import { ExtractionStep } from "@/components/demos/estimate/ExtractionStep";
import { EstimateGeneratorStep } from "@/components/demos/estimate/EstimateGeneratorStep";
import { RevisionStep } from "@/components/demos/estimate/RevisionStep";
import { EstimatePreviewPanel } from "@/components/demos/estimate/EstimatePreviewPanel";
import { DemoIntroModal } from "@/components/demos/estimate/DemoIntroModal";
import { EstimateTutorialOverlay } from "@/components/demos/estimate/EstimateTutorialOverlay";
import { ConfettiCelebration } from "@/components/results/ConfettiCelebration";
import { DemoFooter } from "@/components/demos/DemoFooter";
import { demos } from "@/pages/resources/demosData";
import { DemoLeadCaptureModal } from "@/components/demos/DemoLeadCaptureModal";
import { shouldBypassLeadCapture, logSilentDemoAccess } from "@/components/demos/demoLeadAccess";
import { DemoSpeedProvider } from "@/contexts/DemoSpeedProvider";


// Types and data
import { DEMO_STEPS, type StepId, type UploadedDocument, type ScopeConfirmation, type ExtractedItem, type TradeBreakdown, type EstimateSummary } from "@/components/demos/estimate/types";
import { defaultScopeConfirmation } from "@/components/demos/estimate/demoData";

const stepIcons = {
  1: FileStack,
  2: CheckSquare,
  3: FileSearch,
  4: Calculator,
  5: RefreshCw,
};

function DrawingsToEstimateDemoPageContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { vibrate } = useHaptics();
  const tutorial = useEstimateTutorial();
  
  // Only show lead capture for external/shared link visitors
  const isInternalNavigation = !!(location.state as any)?.fromInternal || new URLSearchParams(location.search).get('ref') === 'internal';
  const [showLeadCapture, setShowLeadCapture] = useState(() => 
    !isInternalNavigation && !shouldBypassLeadCapture()
  );
  
  // Demo state - only show intro after lead capture is complete (or skipped)
  const [showIntro, setShowIntro] = useState(() => shouldBypassLeadCapture());
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Data state
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [scopeConfirmation, setScopeConfirmation] = useState<ScopeConfirmation>(defaultScopeConfirmation);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [estimate, setEstimate] = useState<EstimateSummary | null>(null);
  const [trades, setTrades] = useState<TradeBreakdown[]>([]);
  
  // Mobile panel navigation
  const [mobilePanel, setMobilePanel] = useState<'input' | 'preview'>('input');
  
  // Only lock body scroll when a modal is showing
  useBodyScrollLock(showLeadCapture || showIntro);
  
  // Log silent access for returning visitors
  useEffect(() => {
    if (!showLeadCapture && shouldBypassLeadCapture()) {
      logSilentDemoAccess("drawings-to-estimate", "Drawings to Estimate AI Demo");
    }
  }, [showLeadCapture]);
  
  // Handle lead capture success
  const handleLeadCaptureSuccess = useCallback(() => {
    setShowLeadCapture(false);
    setShowIntro(true);
    vibrate('light');
  }, [vibrate]);

  // Sync tutorial with demo step (one-way: demo → tutorial)
  useEffect(() => {
    if (tutorial.isTutorialActive) {
      tutorial.syncToDemoStep(currentStep);
    }
  }, [currentStep, tutorial.isTutorialActive, tutorial.syncToDemoStep]);

  const handleStartDemo = useCallback(() => {
    setShowIntro(false);
    vibrate('medium');
    // Start tutorial if not dismissed
    if (!tutorial.isTutorialDismissed) {
      tutorial.startTutorial();
    }
  }, [vibrate, tutorial]);

  const handleUploadComplete = useCallback((docs: UploadedDocument[]) => {
    setUploadedDocuments(docs);
    setCurrentStep(2);
    vibrate('light');
  }, [vibrate]);

  const handleScopeComplete = useCallback((scope: ScopeConfirmation) => {
    setScopeConfirmation(scope);
    setCurrentStep(3);
    vibrate('light');
  }, [vibrate]);

  const handleExtractionComplete = useCallback((items: ExtractedItem[]) => {
    setExtractedItems(items);
    setCurrentStep(4);
    vibrate('light');
  }, [vibrate]);

  const handleEstimateComplete = useCallback((est: EstimateSummary, trds: TradeBreakdown[]) => {
    setEstimate(est);
    setTrades(trds);
    setCurrentStep(5);
    vibrate('medium');
  }, [vibrate]);

  const handleDemoComplete = useCallback(() => {
    setShowCelebration(true);
    vibrate('success');
    tutorial.dismissTutorial();
  }, [vibrate, tutorial]);

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
  }, []);

  const handleBack = () => {
    navigate('/resources/demos');
  };

  const handleBookDemo = () => {
    vibrate('medium');
    window.location.href = 'https://new.alfredai.bot/book';
  };

  const handleSkipTutorial = useCallback(() => {
    setShowIntro(false);
    tutorial.dismissTutorial();
    vibrate('light');
  }, [tutorial, vibrate]);

  const handleSelectDemo = (demoId: string) => {
    navigate(`/resources/demos?demo=${demoId}`);
  };

  const goToStep = (step: StepId) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const currentStepData = DEMO_STEPS.find(s => s.id === currentStep);
  const StepIcon = stepIcons[currentStep];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      
      <SEO
        title="From Drawings to Draft Estimate Demo | alfred ai"
        description="Interactive demo showing how alfred ai accelerates construction estimating. Upload drawings, confirm scope, and generate draft estimates with confidence flags."
        path="/demos/drawings-to-estimate"
      />

      <Header />
      
      {/* Lead Capture Modal - shows first for new visitors */}
      <DemoLeadCaptureModal
        isOpen={showLeadCapture}
        onClose={() => setShowLeadCapture(false)}
        onSuccess={handleLeadCaptureSuccess}
        demoId="drawings-to-estimate"
        demoTitle="From Drawings to Draft Estimate"
      />
      
      {/* Intro Modal - shows after lead capture */}
      <DemoIntroModal isOpen={showIntro} onStart={handleStartDemo} onSkipTutorial={handleSkipTutorial} />
      
      {/* Celebration */}
      <ConfettiCelebration trigger={showCelebration} onComplete={handleCelebrationComplete} />

      {/* Main content with proper top padding to clear header */}
      <main className="flex-1 pt-20 pb-6 bg-background flex flex-col">
        <div className="container-wide flex-1 flex flex-col">
          {/* Demo Header Bar - outside bordered container for visibility */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Demos</span>
              </Button>
              
              <div className="hidden md:flex items-center gap-2 pl-3 border-l">
                <FileStack className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm">From Drawings to Draft Estimate</span>
              </div>
            </div>
            
            {/* Step progress - desktop */}
            <div className="hidden md:flex items-center gap-1">
              {DEMO_STEPS.map((step) => {
                const Icon = stepIcons[step.id];
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;
                const isClickable = step.id <= currentStep;
                
                return (
                  <button
                    key={step.id}
                    onClick={() => isClickable && goToStep(step.id)}
                    disabled={!isClickable}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      isActive && "bg-primary text-primary-foreground",
                      isCompleted && "bg-green-100 text-green-700",
                      !isActive && !isCompleted && "bg-muted text-muted-foreground",
                      isClickable && !isActive && "hover:bg-muted/80 cursor-pointer"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">{step.shortTitle}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile step indicator + tutorial toggle */}
            <div className="flex items-center gap-3">
              <div className="md:hidden flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Step {currentStep}/5</span>
                <div className="flex gap-1">
                  {DEMO_STEPS.map((step) => (
                    <div
                      key={step.id}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        step.id === currentStep && "bg-primary",
                        step.id < currentStep && "bg-green-500",
                        step.id > currentStep && "bg-muted"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Tutorial toggle button */}
              {!tutorial.isTutorialActive && !showIntro && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={tutorial.startTutorial}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Guide</span>
                </Button>
              )}
            </div>
          </div>

          {/* Key positioning line */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white text-center py-2 px-4 rounded-t-xl">
            <p className="text-xs sm:text-sm font-medium">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Humans read drawings. Alfred accelerates everything that follows.
            </p>
          </div>

          {/* Main demo content area */}
          <div className="rounded-b-xl border border-t-0 bg-white shadow-sm flex-1 min-h-[400px] md:min-h-[500px] flex flex-col md:flex-row overflow-hidden">
            {/* Left panel - Input/Steps (40%) */}
            <div className={cn(
              "md:w-[40%] flex flex-col border-r bg-muted/10",
              "h-[calc(100vh-280px)] md:h-auto overflow-hidden",
              mobilePanel === 'preview' && "hidden md:flex"
            )}>
              {/* Step header - compact */}
              <div className="shrink-0 p-3 border-b bg-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <StepIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-muted-foreground">Step {currentStep} of 5</p>
                    <h3 className="font-semibold text-sm truncate">{currentStepData?.title}</h3>
                  </div>
                </div>
              </div>
              
              {/* Step content - scrollable with proper touch handling */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-3 pb-20 md:pb-3 touch-pan-y">
                <ErrorBoundary>
                  <Suspense fallback={<div className="animate-pulse bg-muted h-48 rounded-lg" />}>
                    <AnimatePresence mode="wait">
                      {currentStep === 1 && (
                        <motion.div
                          key="upload"
                          data-tutorial="upload-step"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                        >
                          <UploadStep 
                            onComplete={handleUploadComplete} 
                            isActive={currentStep === 1} 
                          />
                        </motion.div>
                      )}
                      
                      {currentStep === 2 && (
                        <motion.div
                          key="scope"
                          data-tutorial="scope-step"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                        >
                          <ScopeConfirmationStep 
                            onComplete={handleScopeComplete} 
                            isActive={currentStep === 2} 
                          />
                        </motion.div>
                      )}
                      
                      {currentStep === 3 && (
                        <motion.div
                          key="extraction"
                          data-tutorial="extract-step"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                        >
                          <ExtractionStep 
                            scope={scopeConfirmation}
                            onComplete={handleExtractionComplete} 
                            isActive={currentStep === 3} 
                          />
                        </motion.div>
                      )}
                      
                      {currentStep === 4 && (
                        <motion.div
                          key="estimate"
                          data-tutorial="estimate-step"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                        >
                          <EstimateGeneratorStep 
                            extractedItems={extractedItems}
                            onComplete={handleEstimateComplete} 
                            isActive={currentStep === 4} 
                          />
                        </motion.div>
                      )}
                      
                      {currentStep === 5 && estimate && (
                        <motion.div
                          key="revision"
                          data-tutorial="revise-step"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                        >
                          <RevisionStep 
                            initialEstimate={estimate}
                            initialTrades={trades}
                            onComplete={handleDemoComplete} 
                            isActive={currentStep === 5} 
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Suspense>
                </ErrorBoundary>
              </div>
            </div>

            {/* Right panel - Estimate Preview (60-65%) */}
            <div className={cn(
              "md:w-[60%] flex flex-col bg-white",
              "h-[calc(100vh-280px)] md:h-auto overflow-hidden",
              mobilePanel === 'input' && "hidden md:flex"
            )}>
              <EstimatePreviewPanel 
                estimate={estimate}
                trades={trades}
                currentStep={currentStep}
              />
            </div>

            {/* Mobile panel toggle - improved positioning and touch targets */}
            <div className="md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-white/95 backdrop-blur-sm border rounded-full shadow-lg p-1.5 flex gap-1.5">
                <button
                  onClick={() => setMobilePanel('input')}
                  className={cn(
                    "min-w-[80px] min-h-[44px] px-4 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-1.5",
                    mobilePanel === 'input' 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-muted active:bg-muted/80"
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Steps
                </button>
                <button
                  onClick={() => setMobilePanel('preview')}
                  className={cn(
                    "min-w-[80px] min-h-[44px] px-4 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-1.5",
                    mobilePanel === 'preview' 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-muted active:bg-muted/80"
                  )}
                >
                  Estimate
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Demo Footer - directly attached to demo content */}
          <DemoFooter
            currentDemoId="drawings-to-estimate"
            demos={demos}
            onBookDemo={handleBookDemo}
            onSelectDemo={handleSelectDemo}
            demoCompleted={showCelebration || currentStep === 5}
          />
        </div>
      </main>

      {/* Site Footer */}
      <MinimalFooter />

      {/* Tutorial Overlay */}
      <EstimateTutorialOverlay tutorial={tutorial} />
    </div>
  );
}

export default function DrawingsToEstimateDemoPage() {
  return (
    <DemoSpeedProvider>
      <DrawingsToEstimateDemoPageContent />
    </DemoSpeedProvider>
  );
}
