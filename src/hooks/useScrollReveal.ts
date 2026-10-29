import { useEffect, useRef, useState } from "react";

interface UseScrollRevealOptions {
  threshold?: number;
  triggerOnce?: boolean;
  rootMargin?: string;
}

interface UseScrollRevealReturn {
  ref: React.RefObject<HTMLDivElement>;
  isVisible: boolean;
}

export function useScrollReveal({
  threshold = 0.2,
  triggerOnce = true,
  rootMargin = "0px",
}: UseScrollRevealOptions = {}): UseScrollRevealReturn {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, triggerOnce, rootMargin]);

  return { ref, isVisible };
}

// Helper hook for staggered animations
export function useStaggeredReveal(
  itemCount: number,
  baseDelay: number = 100,
  options?: UseScrollRevealOptions
) {
  const { ref, isVisible } = useScrollReveal(options);
  
  const getDelay = (index: number) => ({
    transitionDelay: `${index * baseDelay}ms`,
  });

  return { ref, isVisible, getDelay };
}

export default useScrollReveal;
