import { useState, useEffect, forwardRef, memo } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { ChevronUp } from "lucide-react";

const ScrollToTopInner = memo(() => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const handleScroll = () => {
      // Show button after scrolling down 400px
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isMobile) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={scrollToTop}
          className="fixed right-4 bottom-24 z-40 w-11 h-11 rounded-full bg-card border border-border shadow-lg flex items-center justify-center active:scale-95 transition-transform touch-manipulation"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5 text-foreground" />
        </motion.button>
      )}
    </AnimatePresence>
  );
});

ScrollToTopInner.displayName = 'ScrollToTopInner';

// Wrap with forwardRef for lazy loading compatibility
const ScrollToTop = forwardRef<HTMLButtonElement>((_, _ref) => (
  <ScrollToTopInner />
));

ScrollToTop.displayName = 'ScrollToTop';

export default ScrollToTop;
