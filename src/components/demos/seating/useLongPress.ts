/** Press-and-hold gesture, for touch devices with no right-click. */

import { useState, useEffect, useRef, useCallback } from "react";

// Hook for long press detection
export function useLongPress(
  onLongPress: (e: React.MouseEvent | React.TouchEvent) => void,
  options: { delay?: number; onCancel?: () => void } = {}
) {
  const { delay = 500, onCancel } = options;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const start = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      isLongPressRef.current = false;
      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        onLongPress(e);
      }, delay);
    },
    [onLongPress, delay]
  );

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (isLongPressRef.current) {
      onCancel?.();
    }
  }, [onCancel]);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    isLongPress: () => isLongPressRef.current,
  };
}
