import { useState, useCallback, useEffect } from 'react';

export interface TutorialStep {
  id: string;
  elementId: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'step-1',
    elementId: 'step-analyze',
    title: 'Start Here: AI Transcript Analysis',
    description: 'Paste your discovery call transcript and let AI do the heavy lifting. It extracts client info, pain points, and recommends the right AI agents automatically.',
    position: 'bottom',
  },
  {
    id: 'step-2',
    elementId: 'step-client',
    title: 'Client Details',
    description: 'Review or manually enter company name, contact info, and industry. This personalizes the proposal and influences pricing tiers.',
    position: 'bottom',
  },
  {
    id: 'step-3',
    elementId: 'step-team',
    title: 'Team Size & Salary',
    description: 'Enter the team size and average salary. These numbers drive the Guaranteed ROI calculation shown on the final proposal.',
    position: 'bottom',
  },
  {
    id: 'step-4',
    elementId: 'step-workflows',
    title: 'Select AI Agents',
    description: 'Pick which AI workflows to include. Each agent adds to setup and retainer costs. Toggle Voice Agent if phone automation is needed.',
    position: 'bottom',
  },
  {
    id: 'step-5',
    elementId: 'step-timeline',
    title: 'Implementation Timeline',
    description: 'Choose when the client plans to start. This affects urgency messaging and follow-up scheduling.',
    position: 'bottom',
  },
  {
    id: 'step-6',
    elementId: 'step-pricing',
    title: 'Pricing & Payment Terms',
    description: 'Review AI-recommended pricing based on call sentiment. Choose between Standard, Flexible, or Long-Term Commitment options.',
    position: 'left',
  },
  {
    id: 'step-7',
    elementId: 'step-actions',
    title: 'Generate & Share Proposal',
    description: 'Save your quote, generate Stripe payment links, review the final proposal, then copy the shareable URL to send to your client.',
    position: 'left',
  },
];

interface UseTutorialReturn {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  currentStepData: TutorialStep | null;
  start: () => void;
  next: () => void;
  back: () => void;
  skip: () => void;
  complete: () => void;
  goToStep: (step: number) => void;
}

export function useTutorial(): UseTutorialReturn {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const scrollToElement = useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const start = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
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
      setIsActive(false);
      setCurrentStep(0);
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
    setCurrentStep(0);
  }, []);

  const complete = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < tutorialSteps.length) {
      setCurrentStep(step);
      scrollToElement(tutorialSteps[step].elementId);
    }
  }, [scrollToElement]);

  // Handle escape key to close tutorial
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
    start,
    next,
    back,
    skip,
    complete,
    goToStep,
  };
}
