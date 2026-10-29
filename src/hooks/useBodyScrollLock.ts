import { useEffect, useRef } from "react";

export function useBodyScrollLock(isLocked: boolean) {
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (isLocked) {
      // Store current scroll position
      scrollYRef.current = window.scrollY;
      
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      // Hide mobile nav
      const bottomNav = document.querySelector('[data-mobile-nav]');
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = 'none';
      }
      
      return () => {
        // Restore body scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        
        // Restore scroll position
        window.scrollTo(0, scrollYRef.current);
        
        // Show mobile nav again
        if (bottomNav) {
          (bottomNav as HTMLElement).style.display = '';
        }
      };
    }
  }, [isLocked]);
}
