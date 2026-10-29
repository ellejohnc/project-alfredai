import { useState, useEffect, useRef, useCallback } from 'react';

interface UseProgressiveLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useProgressiveLoad(options: UseProgressiveLoadOptions = {}) {
  const { threshold = 0.1, rootMargin = '200px', triggerOnce = true } = options;
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            setHasLoaded(true);
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible: isVisible || hasLoaded };
}

// Hook to progressively load multiple sections
export function useProgressiveSections(totalSections: number, initialVisible = 3) {
  const [visibleCount, setVisibleCount] = useState(initialVisible);
  
  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + 2, totalSections));
  }, [totalSections]);

  const isLoaded = useCallback((index: number) => {
    return index < visibleCount;
  }, [visibleCount]);

  return { visibleCount, loadMore, isLoaded };
}
