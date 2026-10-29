import { useState, useCallback } from "react";

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  targetButtonText?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
  actionRequired?: boolean;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'upload',
    title: 'Step 1: Upload Documents',
    description: 'Drag and drop your architectural drawings, scope notes, and room schedules. Alfred will analyse document types automatically.',
    targetSelector: '[data-tutorial="upload-step"]',
    targetButtonText: 'Continue to Scope',
    position: 'right',
    action: 'Complete annotations and click "Continue to Scope Confirmation"',
    actionRequired: true,
  },
  {
    id: 'confirm',
    title: 'Step 2: Confirm Scope',
    description: 'Review and confirm the project scope. This human verification step ensures AI processes the correct trades and assumptions.',
    targetSelector: '[data-tutorial="scope-step"]',
    targetButtonText: 'Confirm Scope',
    position: 'right',
    action: 'Select trades and exclusions, then click "Confirm Scope & Extract Data"',
    actionRequired: true,
  },
  {
    id: 'extract',
    title: 'Step 3: Watch Extraction',
    description: 'AI reads tables, schedules, and text to structure your estimate inputs. Watch as room types, finishes, and quantities are extracted.',
    targetSelector: '[data-tutorial="extract-step"]',
    targetButtonText: 'Generate Draft Estimate',
    position: 'right',
    action: 'Wait for extraction to complete, then click "Generate Draft Estimate"',
    actionRequired: true,
  },
  {
    id: 'estimate',
    title: 'Step 4: Review Draft',
    description: 'Your draft estimate includes line items, trade breakdowns, and confidence flags. Everything is editable and marked for review.',
    targetSelector: '[data-tutorial="estimate-step"]',
    targetButtonText: 'Try Rapid Revisions',
    position: 'right',
    action: 'Review the estimate, then click "Try Rapid Revisions"',
    actionRequired: true,
  },
  {
    id: 'revise',
    title: 'Step 5: Make Revisions',
    description: 'Adjust parameters like floor area and spec grade. Watch as the estimate recalculates instantly — demonstrating speed, not autonomy.',
    targetSelector: '[data-tutorial="revise-step"]',
    targetButtonText: 'Recalculate Estimate',
    position: 'right',
    action: 'Adjust sliders and click "Recalculate Estimate" to see instant updates',
    actionRequired: true,
  },
  {
    id: 'complete',
    title: 'Demo Complete! 🎉',
    description: "You've seen how Alfred accelerates estimating while keeping humans in control. Ready to see it with your own projects?",
    targetSelector: '[data-tutorial="revise-step"]',
    targetButtonText: 'Complete Demo',
    position: 'right',
    actionRequired: false,
  },
];

export interface UseEstimateTutorialReturn {
  currentStep: TutorialStep | undefined;
  currentStepIndex: number;
  totalSteps: number;
  isLastStep: boolean;
  isTutorialActive: boolean;
  isTutorialDismissed: boolean;
  requiresAction: boolean;
  startTutorial: () => void;
  nextStep: () => void;
  forceNextStep: () => void;
  previousStep: () => void;
  goToStep: (stepId: string) => void;
  syncToDemoStep: (demoStep: number) => void;
  dismissTutorial: () => void;
  resetTutorial: () => void;
}

export function useEstimateTutorial(): UseEstimateTutorialReturn {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [isTutorialDismissed, setIsTutorialDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('estimate-demo-tutorial-dismissed') === 'true';
    }
    return false;
  });

  const currentStep = tutorialSteps[currentStepIndex];
  const totalSteps = tutorialSteps.length;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const requiresAction = currentStep?.actionRequired ?? false;

  const startTutorial = useCallback(() => {
    setCurrentStepIndex(0);
    setIsTutorialActive(true);
  }, []);

  // Sync tutorial step FROM demo step (one-way: demo → tutorial)
  const syncToDemoStep = useCallback((demoStep: number) => {
    // Demo steps: 1=upload, 2=scope, 3=extract, 4=estimate, 5=revise
    // Tutorial steps: 0=upload, 1=scope, 2=extract, 3=estimate, 4=revise, 5=complete
    const tutorialIndex = demoStep - 1;
    if (tutorialIndex >= 0 && tutorialIndex < tutorialSteps.length - 1) {
      setCurrentStepIndex(tutorialIndex);
    }
  }, []);

  // Next step - only used for final "Finish" button
  const nextStep = useCallback(() => {
    if (isLastStep) {
      // Final step - finish tutorial
      setIsTutorialActive(false);
    }
    // For other steps, tutorial advances via syncToDemoStep when user performs action
  }, [isLastStep]);

  // Force next step - allows manual advancement regardless of action completion
  const forceNextStep = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      setIsTutorialActive(false);
    }
  }, [currentStepIndex, totalSteps]);

  // Previous step - for navigation
  const previousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

  const goToStep = useCallback((stepId: string) => {
    const index = tutorialSteps.findIndex(s => s.id === stepId);
    if (index !== -1) {
      setCurrentStepIndex(index);
    }
  }, []);

  const dismissTutorial = useCallback(() => {
    setIsTutorialActive(false);
    setIsTutorialDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('estimate-demo-tutorial-dismissed', 'true');
    }
  }, []);

  const resetTutorial = useCallback(() => {
    setIsTutorialDismissed(false);
    setCurrentStepIndex(0);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('estimate-demo-tutorial-dismissed');
    }
  }, []);

  return {
    currentStep,
    currentStepIndex,
    totalSteps,
    isLastStep,
    isTutorialActive,
    isTutorialDismissed,
    requiresAction,
    startTutorial,
    nextStep,
    forceNextStep,
    previousStep,
    goToStep,
    syncToDemoStep,
    dismissTutorial,
    resetTutorial,
  };
}
