import { useState, useCallback, useEffect } from "react";

export interface TutorialStep {
  id: string;
  elementId: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
}

const TUTORIAL_STORAGE_KEY = 'vc-demo-tutorial-seen';
const INTRO_STORAGE_KEY = 'vc-demo-intro-seen';

const tutorialSteps: TutorialStep[] = [
  {
    id: "batch-stats",
    elementId: "vc-batch-stats",
    title: "Batch Controls",
    description: "View vendor health at a glance. Use Auto-Verify All to approve high-confidence documents (≥90%) instantly.",
    position: "bottom",
    action: "Try Auto-Verify All"
  },
  {
    id: "document-queue",
    elementId: "vc-document-queue",
    title: "Document Queue",
    description: "Incoming documents from email, portal, and API. Filter by status or review items requiring attention.",
    position: "right",
    action: "Click a document to select it"
  },
  {
    id: "document-detail",
    elementId: "vc-document-detail",
    title: "Document Preview",
    description: "View extracted fields and original document. AI highlights detected vendor name, expiry, and coverage.",
    position: "left",
    action: "Review the extracted fields"
  },
  {
    id: "ai-panel",
    elementId: "vc-ai-panel",
    title: "AI Verification",
    description: "Review confidence scores and verification checks. Approve, reject, or request updates via multi-channel.",
    position: "left",
    action: "Check the verification status"
  },
  {
    id: "tab-dashboard",
    elementId: "vc-tab-dashboard",
    title: "Vendor Dashboard",
    description: "See all vendors color-coded by compliance status (Green/Yellow/Red). Click any vendor to view their documents.",
    position: "bottom",
    action: "Click to explore the dashboard"
  },
  {
    id: "tab-outreach",
    elementId: "vc-tab-outreach",
    title: "Outreach Campaigns",
    description: "Send reminder campaigns to expiring or non-compliant vendors. Choose email, SMS, or AI voice call.",
    position: "bottom",
    action: "Click to see outreach options"
  },
  {
    id: "tab-sync",
    elementId: "vc-tab-sync",
    title: "SharePoint Sync",
    description: "Sync verified documents to your file system. Track sync status for each vendor folder.",
    position: "bottom",
    action: "Click to view sync status"
  }
];

export interface UseVendorComplianceTutorialReturn {
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

export function useVendorComplianceTutorial(): UseVendorComplianceTutorialReturn {
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
    
    // Start tutorial when user clicks "Start Guided Tour"
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
