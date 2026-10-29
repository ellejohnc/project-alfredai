import { useCallback } from "react";

export type HapticPattern = 'light' | 'medium' | 'success' | 'error';

const hapticPatterns: Record<HapticPattern, number | number[]> = {
  light: 10,             // Quick tap
  medium: 30,            // Standard feedback
  success: [20, 50, 20], // Double pulse
  error: [50, 30, 50],   // Error pattern
};

const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

export function useHaptics() {
  const vibrate = useCallback((pattern: HapticPattern = 'light') => {
    if (isSupported) {
      try {
        navigator.vibrate(hapticPatterns[pattern]);
      } catch {
        // Silently fail if not supported
      }
    }
  }, []);

  /** @deprecated Use `vibrate` instead */
  const trigger = vibrate;

  return { vibrate, trigger, isSupported };
}

/** @deprecated Use `useHaptics` instead */
export const useHapticFeedback = useHaptics;
