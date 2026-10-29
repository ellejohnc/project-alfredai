import { useState, useEffect, useRef, useCallback } from 'react';

interface UseDeferredSectionOptions {
  /** Root margin for IntersectionObserver (default: '200px') */
  rootMargin?: string;
  /** Threshold for visibility (default: 0) */
  threshold?: number;
  /** Delay before loading in ms (default: 0) */
  delay?: number;
  /** Whether to start loading immediately (default: false) */
  immediate?: boolean;
}

interface UseDeferredSectionResult {
  /** Whether the section should be loaded */
  shouldLoad: boolean;
  /** Ref to attach to the section container */
  ref: React.RefObject<HTMLDivElement>;
  /** Manually trigger loading */
  triggerLoad: () => void;
}

/**
 * Hook for deferring component loading until they approach the viewport.
 * Uses IntersectionObserver for efficient visibility detection.
 * 
 * @example
 * ```tsx
 * const { shouldLoad, ref } = useDeferredSection({ rootMargin: '400px' });
 * 
 * return (
 *   <div ref={ref}>
 *     {shouldLoad ? <HeavyComponent /> : <Skeleton />}
 *   </div>
 * );
 * ```
 */
export function useDeferredSection(options: UseDeferredSectionOptions = {}): UseDeferredSectionResult {
  const {
    rootMargin = '200px',
    threshold = 0,
    delay = 0,
    immediate = false,
  } = options;

  const [shouldLoad, setShouldLoad] = useState(immediate);
  const ref = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const triggerLoad = useCallback(() => {
    setShouldLoad(true);
    // Disconnect observer once loaded
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Skip if already loaded or immediate
    if (shouldLoad) return;

    const element = ref.current;
    if (!element) return;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: load immediately
      triggerLoad();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(triggerLoad, delay);
          } else {
            triggerLoad();
          }
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observerRef.current = observer;
    observer.observe(element);

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [rootMargin, threshold, delay, shouldLoad, triggerLoad]);

  return { shouldLoad, ref, triggerLoad };
}

/**
 * Hook variant with priority-based root margins
 */
export function useDeferredSectionWithPriority(
  priority: 'high' | 'medium' | 'low' = 'medium'
): UseDeferredSectionResult {
  const rootMargins = {
    high: '600px',    // Start loading early
    medium: '400px',  // Default
    low: '200px',     // Load closer to viewport
  };

  return useDeferredSection({ rootMargin: rootMargins[priority] });
}
