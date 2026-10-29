import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface ParallaxSectionProps {
  children: React.ReactNode;
  className?: string;
  /** Speed of parallax effect. Positive = moves slower, Negative = moves faster. Default: 0.2 */
  speed?: number;
  /** Whether to apply parallax to background only */
  backgroundOnly?: boolean;
  /** Optional background image URL */
  backgroundImage?: string;
  /** Background overlay opacity (0-1) */
  overlayOpacity?: number;
}

export function ParallaxSection({
  children,
  className,
  speed = 0.2,
  backgroundOnly = false,
  backgroundImage,
  overlayOpacity = 0.6,
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Calculate parallax offset based on scroll position
  const y = useTransform(scrollYProgress, [0, 1], ["0%", `${speed * 100}%`]);
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", `${speed * 150}%`]);

  if (backgroundImage) {
    return (
      <div ref={ref} className={cn("relative overflow-hidden", className)}>
        {/* Parallax background */}
        <motion.div
          className="absolute inset-0 w-full h-[120%] -top-[10%]"
          style={{ y: backgroundY }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div
            className="absolute inset-0 bg-background"
            style={{ opacity: overlayOpacity }}
          />
        </motion.div>
        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  if (backgroundOnly) {
    return (
      <div ref={ref} className={cn("relative overflow-hidden", className)}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}

/**
 * A floating element that moves at a different rate during scroll
 */
interface ParallaxElementProps {
  children: React.ReactNode;
  className?: string;
  /** Speed multiplier. Higher = more movement. Default: 0.3 */
  speed?: number;
  /** Direction of movement */
  direction?: "up" | "down";
}

export function ParallaxElement({
  children,
  className,
  speed = 0.3,
  direction = "up",
}: ParallaxElementProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const multiplier = direction === "up" ? -1 : 1;
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [`${multiplier * speed * 100}px`, `${-multiplier * speed * 100}px`]
  );

  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}
