import { useState, useCallback, useEffect } from "react";

export interface TutorialStep {
  id: string;
  elementId: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
}

const TUTORIAL_STORAGE_KEY = 'pb-demo-tutorial-seen';
const INTRO_STORAGE_KEY = 'pb-demo-intro-seen';

const tutorialSteps: TutorialStep[] = [
  {
    id: "industry",
    elementId: "pb-industry-selector",
    title: "Select Industry",
    description: "Switch between Construction, Real Estate, and Professional Services to see industry-specific invoices with realistic suppliers and line items.",
    position: "bottom",
    action: "Try changing the industry"
  },
  {
    id: "queue",
    elementId: "pb-bill-queue",
    title: "Bill Queue",
    description: "Browse incoming invoices from suppliers. Status badges show extraction progress and AI recommendations. Click any bill to review its details.",
    position: "right",
    action: "Click a bill to select it"
  },
  {
    id: "detail",
    elementId: "pb-detail-panel",
    title: "Bill Details",
    description: "View AI-extracted fields with confidence scores for each value. Switch tabs to see line items, payment details, and the original invoice preview.",
    position: "left",
    action: "Explore the tabs"
  },
  {
    id: "ai",
    elementId: "pb-ai-panel",
    title: "AI Analysis",
    description: "Review risk flags, PO matching results, and variance detection. The AI provides action recommendations based on discrepancies and confidence levels.",
    position: "left",
    action: "Check the risk flags"
  },
  {
    id: "status",
    elementId: "pb-status-stepper",
    title: "Status Lifecycle",
    description: "Track each bill through the workflow: Received → Extracted → Matched → Review → Approved → Synced to Xero → Paid.",
    position: "bottom",
    action: "Watch the status change"
  },
  {
    id: "actions",
    elementId: "pb-action-buttons",
    title: "Take Action",
    description: "Approve bills that pass validation, delegate complex cases for review, or query suppliers for clarification. Approved bills can sync to Xero.",
    position: "top",
    action: "Try approving a bill"
  },
  {
    id: "batch",
    elementId: "pb-batch-stats",
    title: "Batch Processing",
    description: "Use 'Batch Approve' to review and approve multiple AI-recommended bills at once with tolerance filters and summary statistics.",
    position: "bottom",
    action: "Open batch approval"
  }
];

export interface UsePurchaseBillTutorialReturn {
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
  dismissIntro: (startTour: boolean, dontShowAgain: boolean) => void;
}

export function usePurchaseBillTutorial(): UsePurchaseBillTutorialReturn {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
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
    // Scroll to first element
    setTimeout(() => {
      scrollToElement(tutorialSteps[0].elementId);
    }, 100);
  }, [scrollToElement]);

  const next = useCallback(() => {
    if (currentStep < tutorialSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      scrollToElement(tutorialSteps[nextStep].elementId);
    } else {
      // Complete tutorial
      setIsActive(false);
      setHasSeenTutorial(true);
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    }
  }, [currentStep, scrollToElement]);

  const back = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      scrollToElement(tutorialSteps[prevStep].elementId);
    }
  }, [currentStep, scrollToElement]);

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

  const dismissIntro = useCallback((startTour: boolean, dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem(INTRO_STORAGE_KEY, 'true');
    }
    setShowIntroModal(false);
    
    // Always start tutorial when user clicks "Start Guided Tour"
    if (startTour) {
      setTimeout(() => start(), 300);
    }
  }, [start]);

  // Handle Escape key to close tutorial
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isActive) {
        skip();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, skip]);

  // NOTE: Removed auto-start tutorial - now controlled by intro modal

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
    dismissIntro
  };
}
