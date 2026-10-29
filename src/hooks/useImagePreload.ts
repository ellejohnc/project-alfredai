import { useEffect, useCallback, useRef } from 'react';

type IdleRequestCallback = (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void;
interface IdleRequestOptions { timeout?: number; }

// Check for requestIdleCallback support
const hasIdleCallback = typeof window !== 'undefined' && 'requestIdleCallback' in window;

/**
 * Preloads images in the background to improve perceived loading time
 * Uses requestIdleCallback for non-blocking preloading
 */
export function useImagePreload(imageUrls: string[]) {
  const preloadedRef = useRef<Set<string>>(new Set());

  const preloadImage = useCallback((url: string) => {
    if (preloadedRef.current.has(url)) return;
    
    const img = new Image();
    img.src = url;
    preloadedRef.current.add(url);
  }, []);

  useEffect(() => {
    if (!imageUrls.length) return;

    // Use requestIdleCallback for non-blocking preload, fallback to setTimeout
    const schedulePreload = (callback: () => void): number => {
      if (hasIdleCallback) {
        return (window as unknown as { requestIdleCallback: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number })
          .requestIdleCallback(callback as IdleRequestCallback, { timeout: 2000 });
      }
      return window.setTimeout(callback, 100);
    };

    const cancelPreload = (id: number) => {
      if (hasIdleCallback) {
        (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id);
      } else {
        window.clearTimeout(id);
      }
    };

    // Preload images in batches to avoid overwhelming the browser
    const BATCH_SIZE = 4;
    const ids: number[] = [];

    for (let i = 0; i < imageUrls.length; i += BATCH_SIZE) {
      const batch = imageUrls.slice(i, i + BATCH_SIZE);
      const id = schedulePreload(() => {
        batch.forEach(preloadImage);
      });
      ids.push(id);
    }

    return () => {
      ids.forEach(cancelPreload);
    };
  }, [imageUrls, preloadImage]);

  return {
    isPreloaded: (url: string) => preloadedRef.current.has(url),
    preloadNow: preloadImage,
  };
}

/**
 * Preloads a single image on hover with a small delay
 */
export function useHoverPreload() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preloadedRef = useRef<Set<string>>(new Set());

  const onMouseEnter = useCallback((url: string) => {
    if (preloadedRef.current.has(url)) return;
    
    timeoutRef.current = setTimeout(() => {
      const img = new Image();
      img.src = url;
      preloadedRef.current.add(url);
    }, 50);
  }, []);

  const onMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { onMouseEnter, onMouseLeave };
}
