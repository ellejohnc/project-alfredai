import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OrbConfig {
  color: string;
  size: number;
  blur: number;
  opacity: number;
  delay: number;
}

interface MultiCursorGlowProps {
  children: React.ReactNode;
  className?: string;
  orbs?: OrbConfig[];
}

const defaultOrbs: OrbConfig[] = [
  { color: "hsl(var(--primary))", size: 300, blur: 150, opacity: 0.2, delay: 0 },
  { color: "hsl(280, 70%, 60%)", size: 250, blur: 180, opacity: 0.15, delay: 0.1 },
  { color: "hsl(190, 70%, 55%)", size: 200, blur: 200, opacity: 0.12, delay: 0.2 },
];

export function MultiCursorGlow({
  children,
  className,
  orbs = defaultOrbs,
}: MultiCursorGlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
  const [orbPositions, setOrbPositions] = useState(
    orbs.map(() => ({ x: 0, y: 0 }))
  );
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const animationRef = useRef<number>();

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTargetPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  // Smooth trailing animation - snappier on desktop, smoother on mobile
  useEffect(() => {
    const animate = () => {
      setOrbPositions((prev) =>
        prev.map((pos, i) => {
          const baseLerp = isMobile ? 0.06 : 0.18;
          const delayFactor = isMobile ? 0.15 : 0.35;
          const lerp = baseLerp - orbs[i].delay * delayFactor;
          const smoothLerp = Math.max(lerp, isMobile ? 0.02 : 0.05);
          return {
            x: pos.x + (targetPos.x - pos.x) * smoothLerp,
            y: pos.y + (targetPos.y - pos.y) * smoothLerp,
          };
        })
      );
      animationRef.current = requestAnimationFrame(animate);
    };

    if (isHovering) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHovering, targetPos, orbs, isMobile]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Multiple trailing orbs */}
      {orbs.map((orb, i) => (
        <div
          key={i}
          className="pointer-events-none absolute z-0"
          style={{
            left: 0,
            top: 0,
            width: orb.size,
            height: orb.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            opacity: isHovering ? orb.opacity : 0,
            filter: `blur(${orb.blur}px)`,
            transform: `translate(${orbPositions[i].x - orb.size / 2}px, ${orbPositions[i].y - orb.size / 2}px)`,
            transition: "opacity 0.5s ease-out",
          }}
        />
      ))}
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
