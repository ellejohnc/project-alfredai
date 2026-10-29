import { useRef, useCallback } from "react";

interface UseSwipeNavigationOptions<T> {
  items: T[];
  activeItem: T;
  onNavigate: (item: T) => void;
  threshold?: number;
}

export function useSwipeNavigation<T>({
  items,
  activeItem,
  onNavigate,
  threshold = 50,
}: UseSwipeNavigationOptions<T>) {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartX.current === null || touchEndX.current === null) return;

    const diff = touchStartX.current - touchEndX.current;
    const currentIndex = items.indexOf(activeItem);

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex < items.length - 1) {
        // Swipe left -> next
        onNavigate(items[currentIndex + 1]);
      } else if (diff < 0 && currentIndex > 0) {
        // Swipe right -> previous
        onNavigate(items[currentIndex - 1]);
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  }, [items, activeItem, onNavigate, threshold]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
