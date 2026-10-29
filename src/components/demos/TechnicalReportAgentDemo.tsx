import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Hand,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DemoFooter } from "@/components/demos/DemoFooter";
import { demos } from "@/pages/resources/demosData";
import FingerClickIndicator from "@/components/demos/shared/FingerClickIndicator";

import {
  REPORT_STEPS,
  INITIAL_DATA_SOURCES,
  MOCK_EXTRACTED_DATA,
  MOCK_PATTERNS,
  MOCK_COMPLIANCE,
  MOCK_REPORT_SECTIONS,
  MOCK_RECOMMENDATIONS,
  MOCK_STAKEHOLDERS,
} from "./technical-report/demoData";

import DataSourcesStep from "./technical-report/DataSourcesStep";
import IngestionStep from "./technical-report/IngestionStep";
import PatternAnalysisStep from "./technical-report/PatternAnalysisStep";
import ComplianceCheckStep from "./technical-report/ComplianceCheckStep";
import ReportGenerationStep from "./technical-report/ReportGenerationStep";
import RecommendationsStep from "./technical-report/RecommendationsStep";
import ExportDistributionStep from "./technical-report/ExportDistributionStep";

export default function TechnicalReportAgentDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepProgress, setStepProgress] = useState(0);
  const [dataSources, setDataSources] = useState(INITIAL_DATA_SOURCES);
  const [stakeholders, setStakeholders] = useState(MOCK_STAKEHOLDERS);
  const [exportFormat, setExportFormat] = useState<"pdf" | "docx" | "html">("pdf");
  const [demoComplete, setDemoComplete] = useState(false);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [showClickPrompt, setShowClickPrompt] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  const step = REPORT_STEPS[currentStep];
  const isLastStep = currentStep === REPORT_STEPS.length - 1;

  // Toggle data source selection
  const handleToggleSource = useCallback((id: string) => {
    setDataSources(prev =>
      prev.map(source =>
        source.id === id ? { ...source, selected: !source.selected } : source
      )
    );
  }, []);

  // Toggle stakeholder selection
  const handleToggleStakeholder = useCallback((id: string) => {
    setStakeholders(prev =>
      prev.map(s => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  }, []);

  // Advance to next step
  const advanceStep = useCallback(() => {
    if (currentStep < REPORT_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      setStepProgress(0);
      setShowClickPrompt(true);
    } else {
      setDemoComplete(true);
      setIsPlaying(false);
    }
  }, [currentStep]);

  // Autoplay logic
  useEffect(() => {
    if (!isPlaying) return;

    const currentStepData = REPORT_STEPS[currentStep];
    if (!currentStepData) {
      setIsPlaying(false);
      return;
    }

    // Progress interval
    const progressInterval = setInterval(() => {
      setStepProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 100 / (currentStepData.duration / 50);
      });
    }, 50);

    // Show click indicator near end
    const clickTimeout = setTimeout(() => {
      if (contentRef.current && currentStep < REPORT_STEPS.length - 1) {
        const rect = contentRef.current.getBoundingClientRect();
        setClickPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2 + 50,
        });
        setTimeout(() => setClickPosition(null), 800);
      }
    }, currentStepData.duration - 800);

    // Auto advance
    const stepTimeout = setTimeout(() => {
      advanceStep();
    }, currentStepData.duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(clickTimeout);
      clearTimeout(stepTimeout);
    };
  }, [isPlaying, currentStep, advanceStep]);

  // Handle manual click to advance
  const handleStepClick = () => {
    if (currentStep < REPORT_STEPS.length - 1) {
      setIsPlaying(false);
      setShowClickPrompt(false);

      if (contentRef.current) {
        const rect = contentRef.current.getBoundingClientRect();
        setClickPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
        setTimeout(() => setClickPosition(null), 600);
      }

      setTimeout(() => {
        advanceStep();
        setIsPlaying(true);
      }, 300);
    }
  };

  // Handle navigation
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setStepProgress(0);
      setDemoComplete(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep < REPORT_STEPS.length - 1) {
      advanceStep();
    }
  };

  // Reset demo
  const handleReset = () => {
    setCurrentStep(0);
    setStepProgress(0);
    setIsPlaying(false);
    setDataSources(INITIAL_DATA_SOURCES);
    setStakeholders(MOCK_STAKEHOLDERS);
    setExportFormat("pdf");
    setDemoComplete(false);
    setShowClickPrompt(true);
  };

  // Handle booking
  const handleBookDemo = () => {
    window.location.href = "https://new.alfredai.bot/book";
  };

  // Handle demo selection
  const handleSelectDemo = (demoId: string) => {
    window.location.href = `/resources/demos/${demoId}`;
  };

  // Render current step content
  const renderStepContent = () => {
    switch (step?.id) {
      case "sources":
        return (
          <DataSourcesStep
            dataSources={dataSources}
            onToggleSource={handleToggleSource}
          />
        );
      case "ingestion":
        return (
          <IngestionStep
            extractedData={MOCK_EXTRACTED_DATA}
            progress={stepProgress}
          />
        );
      case "patterns":
        return (
          <PatternAnalysisStep
            patterns={MOCK_PATTERNS}
            progress={stepProgress}
          />
        );
      case "compliance":
        return (
          <ComplianceCheckStep
            complianceItems={MOCK_COMPLIANCE}
            progress={stepProgress}
          />
        );
      case "report":
        return (
          <ReportGenerationStep
            reportSections={MOCK_REPORT_SECTIONS}
            progress={stepProgress}
          />
        );
      case "recommendations":
        return (
          <RecommendationsStep
            recommendations={MOCK_RECOMMENDATIONS}
            progress={stepProgress}
          />
        );
      case "export":
        return (
          <ExportDistributionStep
            stakeholders={stakeholders}
            exportFormat={exportFormat}
            onToggleStakeholder={handleToggleStakeholder}
            onSetFormat={setExportFormat}
            isComplete={demoComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Step progress indicator */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {REPORT_STEPS.map((s, index) => {
            const StepIcon = s.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => {
                    setCurrentStep(index);
                    setStepProgress(0);
                    setDemoComplete(false);
                  }}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all min-h-[32px] ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isComplete
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <StepIcon className="w-3.5 h-3.5" />
                  )}
                  <span className="text-[10px] font-medium hidden sm:inline">
                    {s.shortTitle}
                  </span>
                </button>
                {index < REPORT_STEPS.length - 1 && (
                  <div className="w-2 h-0.5 bg-border mx-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            {step && <step.icon className="w-4 h-4 text-primary" />}
            {step?.title}
          </h3>
          <p className="text-xs text-muted-foreground">{step?.description}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPlaying(!isPlaying)}
            className="h-8 w-8"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="h-8 w-8"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={stepProgress} className="h-1" />

      {/* Step content */}
      <div
        ref={contentRef}
        onClick={handleStepClick}
        className="min-h-[350px] cursor-pointer relative"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Click prompt */}
        {showClickPrompt && step?.clickPrompt && !isPlaying && !demoComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-muted-foreground bg-background/80 px-3 py-1.5 rounded-full border"
          >
            <Hand className="w-3.5 h-3.5" />
            {step.clickPrompt}
          </motion.div>
        )}
      </div>

      {/* Navigation controls */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevStep}
          disabled={currentStep === 0}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <span className="text-xs text-muted-foreground">
          Step {currentStep + 1} of {REPORT_STEPS.length}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextStep}
          disabled={isLastStep}
          className="gap-1"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Click indicator */}
      <FingerClickIndicator position={clickPosition} />

      {/* Demo footer */}
      <DemoFooter
        currentDemoId="technical-report-agent"
        demos={demos}
        onBookDemo={handleBookDemo}
        onSelectDemo={handleSelectDemo}
        demoCompleted={demoComplete}
      />
    </div>
  );
}
