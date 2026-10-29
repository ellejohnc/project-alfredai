import { useEffect, useCallback } from "react";
import confetti from "canvas-confetti";

interface ConfettiCelebrationProps {
  trigger: boolean;
  onComplete?: () => void;
  playSound?: () => void;
}

export function ConfettiCelebration({ trigger, onComplete, playSound }: ConfettiCelebrationProps) {
  const fireConfetti = useCallback(() => {
    // Play celebration sound
    playSound?.();

    // First burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ec4899', '#f472b6', '#f9a8d4', '#fce7f3'],
    });

    // Second burst with delay
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors: ['#ec4899', '#f472b6', '#f9a8d4'],
      });
    }, 150);

    // Third burst from right
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors: ['#ec4899', '#f472b6', '#f9a8d4'],
      });
    }, 300);

    // Call onComplete after animation
    setTimeout(() => {
      onComplete?.();
    }, 2000);
  }, [onComplete, playSound]);

  useEffect(() => {
    if (trigger) {
      fireConfetti();
    }
  }, [trigger, fireConfetti]);

  return null;
}
