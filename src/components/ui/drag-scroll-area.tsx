import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DragScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  showArrows?: boolean;
  arrowSize?: "sm" | "md";
  alwaysShowArrows?: boolean;
  /** Show a fading gradient on edges to hint at more content */
  showFadeGradient?: boolean;
  /** Enable CSS scroll-snap for premium card swiping */
  snapScroll?: boolean;
}

const DragScrollArea = React.forwardRef<HTMLDivElement, DragScrollAreaProps>(
  ({ children, className, contentClassName, showArrows = true, arrowSize = "sm", alwaysShowArrows = true, showFadeGradient = false, snapScroll = false }, ref) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = React.useState(false);
    const [canScrollRight, setCanScrollRight] = React.useState(false);
    const [isDragging, setIsDragging] = React.useState(false);
    
    const startXRef = React.useRef(0);
    const scrollLeftRef = React.useRef(0);

    const checkScrollability = React.useCallback(() => {
      const el = scrollRef.current;
      if (el) {
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
      }
    }, []);

    React.useEffect(() => {
      checkScrollability();
      const el = scrollRef.current;
      if (el) {
        el.addEventListener("scroll", checkScrollability);
        window.addEventListener("resize", checkScrollability);
        return () => {
          el.removeEventListener("scroll", checkScrollability);
          window.removeEventListener("resize", checkScrollability);
        };
      }
    }, [checkScrollability]);

    React.useEffect(() => {
      const timeout = setTimeout(checkScrollability, 100);
      return () => clearTimeout(timeout);
    }, [children, checkScrollability]);

    const handleMouseDown = (e: React.MouseEvent) => {
      if (e.button !== 0 && e.button !== 1) return;
      if (e.button === 1) e.preventDefault();
      const el = scrollRef.current;
      if (!el) return;
      setIsDragging(true);
      startXRef.current = e.pageX - el.offsetLeft;
      scrollLeftRef.current = el.scrollLeft;
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
    };

    const handleAuxClick = (e: React.MouseEvent) => {
      if (e.button === 1) e.preventDefault();
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const el = scrollRef.current;
      if (!el) return;
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startXRef.current) * 1.5;
      el.scrollLeft = scrollLeftRef.current - walk;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      const el = scrollRef.current;
      if (el) {
        el.style.cursor = "grab";
        el.style.userSelect = "";
      }
    };

    const handleMouseLeave = () => {
      if (isDragging) handleMouseUp();
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      const el = scrollRef.current;
      if (!el) return;
      setIsDragging(true);
      startXRef.current = e.touches[0].pageX - el.offsetLeft;
      scrollLeftRef.current = el.scrollLeft;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDragging) return;
      const el = scrollRef.current;
      if (!el) return;
      const x = e.touches[0].pageX - el.offsetLeft;
      const walk = (x - startXRef.current) * 1.5;
      el.scrollLeft = scrollLeftRef.current - walk;
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); scrollTo("left"); }
      else if (e.key === "ArrowRight") { e.preventDefault(); scrollTo("right"); }
    };

    const scrollTo = (direction: "left" | "right") => {
      const el = scrollRef.current;
      if (!el) return;
      const scrollAmount = el.clientWidth * 0.8;
      el.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    };

    const arrowClasses = arrowSize === "sm" ? "w-6 h-6" : "w-8 h-8";
    const iconClasses = arrowSize === "sm" ? "w-4 h-4" : "w-5 h-5";
    const showLeftArrow = showArrows && canScrollLeft;
    const showRightArrow = showArrows && canScrollRight;

    return (
      <div ref={ref} className={cn("relative group", className)}>
        {/* Left fade gradient */}
        {showFadeGradient && canScrollLeft && (
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-[5] bg-gradient-to-r from-background to-transparent rounded-l-lg" />
        )}

        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scrollTo("left")}
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center",
              "bg-background border border-border rounded-full",
              "text-primary hover:bg-primary hover:text-primary-foreground",
              "shadow-md hover:shadow-lg transition-all duration-200",
              "touch-manipulation active:scale-95",
              alwaysShowArrows ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              arrowClasses
            )}
            aria-label="Scroll left"
          >
            <ChevronLeft className={iconClasses} />
          </button>
        )}

        {/* Scrollable Content */}
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onAuxClick={handleAuxClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-label="Scrollable content"
          className={cn(
            "overflow-x-auto scrollbar-hide cursor-grab",
            isDragging && "cursor-grabbing select-none",
            showLeftArrow && "pl-8",
            showRightArrow && "pr-8",
            snapScroll && "snap-x snap-mandatory",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded",
            contentClassName
          )}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-y pinch-zoom",
          }}
        >
          {children}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scrollTo("right")}
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center",
              "bg-background border border-border rounded-full",
              "text-primary hover:bg-primary hover:text-primary-foreground",
              "shadow-md hover:shadow-lg transition-all duration-200",
              "touch-manipulation active:scale-95",
              alwaysShowArrows ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              arrowClasses
            )}
            aria-label="Scroll right"
          >
            <ChevronRight className={iconClasses} />
          </button>
        )}

        {/* Right fade gradient */}
        {showFadeGradient && canScrollRight && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-[5] bg-gradient-to-l from-background to-transparent rounded-r-lg" />
        )}
      </div>
    );
  }
);

DragScrollArea.displayName = "DragScrollArea";

export { DragScrollArea };
