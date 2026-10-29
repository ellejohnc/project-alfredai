import { useState, useCallback, useRef, forwardRef, memo } from "react";
import { cn } from "@/lib/utils";

interface CursorGlowProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  glowSize?: number;
  glowColor?: string;
  glowOpacity?: number;
  glowBlur?: number;
}

export const CursorGlow = memo(forwardRef<HTMLDivElement, CursorGlowProps>(({
  children,
  className,
  as: Component = "div",
  glowSize = 500,
  glowColor = "hsl(var(--primary))",
  glowOpacity = 0.12,
  glowBlur = 100,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setPosition({ x, y });
  }, []);

  return (
    <div
      ref={(node) => {
        // Handle both refs
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      className={cn("relative overflow-hidden", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Cursor-following gradient orb */}
      <div
        className="pointer-events-none absolute z-0"
        style={{
          left: 0,
          top: 0,
          width: glowSize,
          height: glowSize,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          opacity: isHovering ? glowOpacity : 0,
          filter: `blur(${glowBlur}px)`,
          transform: `translate(${position.x - glowSize / 2}px, ${position.y - glowSize / 2}px)`,
          transition: "opacity 0.4s ease-out",
        }}
      />
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}));

CursorGlow.displayName = 'CursorGlow';
