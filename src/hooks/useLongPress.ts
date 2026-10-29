import { useCallback, useRef } from "react";
import { useHaptics } from "./useHaptics";

interface UseLongPressOptions {
  delay?: number;
  onLongPress: () => void;
  onCancel?: () => void;
}

export function useLongPress({ delay = 500, onLongPress, onCancel }: UseLongPressOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const { vibrate: haptic } = useHaptics();

  const start = useCallback(() => {
    isLongPressRef.current = false;
    timeoutRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      haptic('light'); // Haptic feedback on long-press trigger
      onLongPress();
    }, delay);
  }, [delay, onLongPress, haptic]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (!isLongPressRef.current) {
      onCancel?.();
    }
  }, [onCancel]);

  return {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchCancel: cancel,
    onTouchMove: cancel,
  };
}
