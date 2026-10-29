import { useState, useEffect } from "react";

export function useOrientation() {
  const [isPortrait, setIsPortrait] = useState(true);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const checkMobile = () => window.innerWidth < 1024;
    
    const checkOrientation = () => {
      // Use screen.orientation API if available, fallback to window dimensions
      if (screen.orientation) {
        return screen.orientation.type.includes('portrait');
      }
      return window.innerHeight > window.innerWidth;
    };

    const handleChange = () => {
      setIsMobileDevice(checkMobile());
      setIsPortrait(checkOrientation());
    };

    // Listen to both resize and orientation change
    window.addEventListener('resize', handleChange);
    window.addEventListener('orientationchange', handleChange);
    
    handleChange(); // Initial check

    return () => {
      window.removeEventListener('resize', handleChange);
      window.removeEventListener('orientationchange', handleChange);
    };
  }, []);

  return { isPortrait, isMobileDevice };
}
