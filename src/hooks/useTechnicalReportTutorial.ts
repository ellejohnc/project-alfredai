import { useState, useCallback, useEffect } from "react";

export interface TutorialStep {
  id: string;
  elementId: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
  targetButtonText?: string; // Text of button to flash for user attention
}

const TUTORIAL_STORAGE_KEY = 'tr-demo-tutorial-seen';
const INTRO_STORAGE_KEY = 'tr-demo-intro-seen';

const tutorialSteps: TutorialStep[] = [
  {
    id: "role",
    elementId: "tr-role-selector",
    title: "Step 1: Choose Your Role",
    description: "Select your professional role to customize the report format, compliance standards, and terminology to match your industry needs.",
    position: "left",
    action: "Click to select Engineers, Certifiers, or Consultants"
  },
  {
    id: "sources",
    elementId: "tr-source-selector",
    title: "Step 2: Select Data Sources",
    description: "Choose data sources to include in your report. Toggle sources to customize data ingestion, then click 'Start Extraction'.",
    position: "bottom",
    action: "Click 'Start Extraction' to continue",
    targetButtonText: "Start Extraction"
  },
  {
    id: "ingestion",
    elementId: "tr-ingestion-panel",
    title: "Step 3: AI Data Extraction",
    description: "AI parses and categorizes data from your selected sources. Each extraction shows confidence scores for accuracy.",
    position: "bottom",
    action: "Click 'Analyze Patterns' to continue",
    targetButtonText: "Analyze Patterns"
  },
  {
    id: "patterns",
    elementId: "tr-pattern-panel",
    title: "Step 4: Pattern Analysis",
    description: "AI identifies trends, anomalies, and correlations across your data. Critical issues are flagged with severity levels.",
    position: "bottom",
    action: "Click 'Check Compliance' to continue",
    targetButtonText: "Check Compliance"
  },
  {
    id: "compliance",
    elementId: "tr-compliance-panel",
    title: "Step 5: Compliance Check",
    description: "Verify against AS/NZS, ISO, and industry standards. Each requirement shows pass/fail/review status with remediation guidance.",
    position: "bottom",
    action: "Click 'Generate Report' to continue",
    targetButtonText: "Generate Report"
  },
  {
    id: "report",
    elementId: "tr-report-preview",
    title: "Step 6: Report Generation",
    description: "Review the AI-generated technical report. Open the full report to see all sections, workflow steps, and export options.",
    position: "left",
    action: "Click 'Open Full Report' to view",
    targetButtonText: "Open Full Report"
  }
];

// Export for syncing with demo steps
export const TUTORIAL_STEP_IDS = tutorialSteps.map(s => s.id);

export interface UseTechnicalReportTutorialReturn {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  currentStepData: TutorialStep | null;
  hasSeenTutorial: boolean;
  showIntroModal: boolean;
  start: () => void;
  next: () => void;
  back: () => void;
  skip: () => void;
  complete: () => void;
  goToStep: (step: number) => void;
  syncWithDemoStep: (demoStep: number) => void;
  dismissIntro: (startTour: boolean, dontShowAgain: boolean) => void;
  setOnAdvanceDemo: (callback: ((nextDemoStep: number) => void) | undefined) => void;
}

export interface UseTechnicalReportTutorialOptions {
  onAdvanceDemo?: (nextDemoStep: number) => void;
}

export function useTechnicalReportTutorial(options?: UseTechnicalReportTutorialOptions): UseTechnicalReportTutorialReturn {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [onAdvanceDemoRef, setOnAdvanceDemoRef] = useState<((nextDemoStep: number) => void) | undefined>(options?.onAdvanceDemo);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true';
    }
    return false;
  });
  const [showIntroModal, setShowIntroModal] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(INTRO_STORAGE_KEY) !== 'true';
    }
    return true;
  });

  const scrollToElement = useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const start = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    setTimeout(() => {
      scrollToElement(tutorialSteps[0].elementId);
    }, 100);
  }, [scrollToElement]);

  // Tutorial Next button: advance tutorial AND demo together
  const next = useCallback(() => {
    if (currentStep < tutorialSteps.length - 1) {
      const nextTutorialStep = currentStep + 1;
      setCurrentStep(nextTutorialStep);
      scrollToElement(tutorialSteps[nextTutorialStep].elementId);
      
      // Advance demo to match tutorial
      // Tutorial step 0 = role (no demo step)
      // Tutorial steps 1-5 = demo steps 0-4
      if (onAdvanceDemoRef && nextTutorialStep >= 1 && nextTutorialStep <= 5) {
        onAdvanceDemoRef(nextTutorialStep - 1); // Demo step = tutorial step - 1
      }
    } else {
      setIsActive(false);
      setHasSeenTutorial(true);
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    }
  }, [currentStep, scrollToElement, onAdvanceDemoRef]);

  // Tutorial Back button: go back in tutorial AND demo
  const back = useCallback(() => {
    if (currentStep > 0) {
      const prevTutorialStep = currentStep - 1;
      setCurrentStep(prevTutorialStep);
      scrollToElement(tutorialSteps[prevTutorialStep].elementId);
      
      // Go back in demo as well
      // Tutorial step 0 = role (demo step 0)
      // Tutorial steps 1-5 = demo steps 0-4
      if (onAdvanceDemoRef && prevTutorialStep >= 1) {
        onAdvanceDemoRef(prevTutorialStep - 1);
      } else if (onAdvanceDemoRef && prevTutorialStep === 0) {
        onAdvanceDemoRef(0); // Reset to first demo step when at role step
      }
    }
  }, [currentStep, scrollToElement, onAdvanceDemoRef]);

  const skip = useCallback(() => {
    setIsActive(false);
    setHasSeenTutorial(true);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
  }, []);

  const complete = useCallback(() => {
    setIsActive(false);
    setHasSeenTutorial(true);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < tutorialSteps.length) {
      setCurrentStep(step);
      scrollToElement(tutorialSteps[step].elementId);
    }
  }, [scrollToElement]);

  // Sync tutorial step with demo step (works regardless of isActive state)
  const syncWithDemoStep = useCallback((demoStep: number) => {
    if (demoStep >= 0 && demoStep < tutorialSteps.length) {
      setCurrentStep(demoStep);
      // Also scroll to the element for visibility
      scrollToElement(tutorialSteps[demoStep].elementId);
    }
  }, [scrollToElement]);

  const dismissIntro = useCallback((startTour: boolean, dontShowAgain: boolean) => {
    setShowIntroModal(false);
    if (dontShowAgain) {
      localStorage.setItem(INTRO_STORAGE_KEY, 'true');
    }
    if (startTour) {
      setTimeout(() => start(), 300);
    }
  }, [start]);

  // Handle escape key to close tutorial
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;
      if (e.key === 'Escape') {
        skip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        next();
      } else if (e.key === 'ArrowLeft') {
        back();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, next, back, skip]);

  return {
    isActive,
    currentStep,
    totalSteps: tutorialSteps.length,
    currentStepData: isActive ? tutorialSteps[currentStep] : null,
    hasSeenTutorial,
    showIntroModal,
    start,
    next,
    back,
    skip,
    complete,
    goToStep,
    syncWithDemoStep,
    dismissIntro,
    setOnAdvanceDemo: setOnAdvanceDemoRef,
  };
}
