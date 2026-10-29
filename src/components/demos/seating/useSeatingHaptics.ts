import { useCallback } from "react";

type HapticPattern = 'assign' | 'unassign' | 'error' | 'success' | 'light';

const hapticPatterns: Record<HapticPattern, number | number[]> = {
  assign: [50, 30, 50],      // Double tap feel for assignment
  unassign: [30],            // Light single tap
  error: [100, 50, 100],     // Stronger double for error
  success: [50, 50, 100],    // Celebratory pattern
  light: [20],               // Very light tap
};

export function useSeatingHaptics() {
  const vibrate = useCallback((pattern: HapticPattern) => {
    // Check if vibration API is available (mobile devices)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        const vibrationPattern = hapticPatterns[pattern];
        navigator.vibrate(vibrationPattern);
      } catch {
        // Silently fail if vibration not supported
      }
    }
  }, []);

  const vibrateOnAssign = useCallback(() => vibrate('assign'), [vibrate]);
  const vibrateOnUnassign = useCallback(() => vibrate('unassign'), [vibrate]);
  const vibrateOnError = useCallback(() => vibrate('error'), [vibrate]);
  const vibrateOnSuccess = useCallback(() => vibrate('success'), [vibrate]);
  const vibrateLight = useCallback(() => vibrate('light'), [vibrate]);

  return {
    vibrate,
    vibrateOnAssign,
    vibrateOnUnassign,
    vibrateOnError,
    vibrateOnSuccess,
    vibrateLight,
  };
}
