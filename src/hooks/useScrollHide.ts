import { useState, useEffect, useRef } from "react";

interface UseScrollHideOptions {
  delay?: number; // Delay in ms before showing again after scroll stops
  threshold?: number; // Minimum scroll distance to trigger hide
}

export function useScrollHide({ delay = 1500, threshold = 10 }: UseScrollHideOptions = {}) {
  const [isHidden, setIsHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const isScrolling = useRef(false);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const handleScroll = () => {
      if (!isMobile) return;

      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);

      // Only react to meaningful scroll movements
      if (scrollDelta > threshold) {
        // Hide immediately when scrolling
        setIsHidden(true);
        isScrolling.current = true;

        // Clear existing timeout
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }

        // Set timeout to show again after delay
        scrollTimeout.current = setTimeout(() => {
          isScrolling.current = false;
          setIsHidden(false);
        }, delay);

        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkMobile);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [delay, threshold, isMobile]);

  return { isHidden: isMobile && isHidden, isMobile };
}
