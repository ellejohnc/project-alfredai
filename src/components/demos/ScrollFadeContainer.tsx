import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScrollFadeContainerProps {
  children: ReactNode;
  maxHeight: string;
  className?: string;
}

const ScrollFadeContainer = ({ children, maxHeight, className }: ScrollFadeContainerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight + 2;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
    setCanScroll(hasOverflow);
    setIsAtBottom(atBottom);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    return () => observer.disconnect();
  }, [checkScroll, children]);

  const showFade = canScroll && !isAtBottom;

  return (
    <div className={cn("relative rounded-lg", className)}>
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="overflow-y-auto touch-pan-y overscroll-contain"
        style={{ maxHeight }}
      >
        {children}
      </div>
      <div
        className={cn(
          "pointer-events-none absolute bottom-0 left-0 right-0 h-10 rounded-b-lg transition-opacity duration-200",
          "bg-gradient-to-t from-muted/80 to-transparent",
          showFade ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
};

export default ScrollFadeContainer;
