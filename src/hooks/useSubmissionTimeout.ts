import { useState, useRef, useCallback, useEffect } from "react";

interface SubmissionTimeoutState {
  /** Current submission status */
  status: "idle" | "submitting" | "timeout" | "success" | "error";
  /** Whether a timeout has occurred */
  hasTimedOut: boolean;
  /** Number of retry attempts */
  retryCount: number;
  /** Elapsed time in milliseconds since submission started */
  elapsedMs: number;
}

interface UseSubmissionTimeoutOptions {
  /** Timeout duration in milliseconds (default: 15000 = 15s) */
  timeoutMs?: number;
  /** Maximum number of retries (default: 3) */
  maxRetries?: number;
  /** Callback when timeout occurs */
  onTimeout?: () => void;
  /** Callback when max retries exceeded */
  onMaxRetriesExceeded?: () => void;
}

interface UseSubmissionTimeoutResult extends SubmissionTimeoutState {
  /** Start the submission timer */
  startSubmission: () => void;
  /** Mark submission as complete (success) */
  completeSubmission: () => void;
  /** Mark submission as failed (error) */
  failSubmission: () => void;
  /** Retry the submission */
  retry: () => void;
  /** Reset to idle state */
  reset: () => void;
  /** Whether retry is available */
  canRetry: boolean;
}

/**
 * Hook to manage submission timeout and retry state.
 * Provides visual feedback when backend requests take too long.
 */
export function useSubmissionTimeout(
  options: UseSubmissionTimeoutOptions = {}
): UseSubmissionTimeoutResult {
  const {
    timeoutMs = 15000,
    maxRetries = 3,
    onTimeout,
    onMaxRetriesExceeded,
  } = options;

  const [state, setState] = useState<SubmissionTimeoutState>({
    status: "idle",
    hasTimedOut: false,
    retryCount: 0,
    elapsedMs: 0,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Cleanup timers
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const startSubmission = useCallback(() => {
    clearTimers();
    startTimeRef.current = Date.now();

    setState(prev => ({
      ...prev,
      status: "submitting",
      hasTimedOut: false,
      elapsedMs: 0,
    }));

    // Start elapsed time counter
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setState(prev => ({
          ...prev,
          elapsedMs: Date.now() - startTimeRef.current!,
        }));
      }
    }, 100);

    // Set timeout
    timeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        status: "timeout",
        hasTimedOut: true,
      }));
      onTimeout?.();
    }, timeoutMs);
  }, [clearTimers, timeoutMs, onTimeout]);

  const completeSubmission = useCallback(() => {
    clearTimers();
    setState(prev => ({
      ...prev,
      status: "success",
      hasTimedOut: false,
    }));
  }, [clearTimers]);

  const failSubmission = useCallback(() => {
    clearTimers();
    setState(prev => ({
      ...prev,
      status: "error",
    }));
  }, [clearTimers]);

  const retry = useCallback(() => {
    if (state.retryCount >= maxRetries) {
      onMaxRetriesExceeded?.();
      return;
    }

    setState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
    }));

    startSubmission();
  }, [state.retryCount, maxRetries, startSubmission, onMaxRetriesExceeded]);

  const reset = useCallback(() => {
    clearTimers();
    startTimeRef.current = null;
    setState({
      status: "idle",
      hasTimedOut: false,
      retryCount: 0,
      elapsedMs: 0,
    });
  }, [clearTimers]);

  return {
    ...state,
    startSubmission,
    completeSubmission,
    failSubmission,
    retry,
    reset,
    canRetry: state.retryCount < maxRetries,
  };
}

export default useSubmissionTimeout;
