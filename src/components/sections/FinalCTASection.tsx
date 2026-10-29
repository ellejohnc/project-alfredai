import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookingChatModal from "@/components/BookingChatModal";
import { useHaptics } from "@/hooks/useHaptics";

interface OrbState {
  x: number;
  y: number;
}

const orbConfigs = [
  { color: "hsl(var(--primary) / 0.4)", size: 500, blur: 120, opacity: 0.4, delay: 0 },
  { color: "hsl(280, 75%, 55% / 0.35)", size: 420, blur: 140, opacity: 0.32, delay: 0.12 },
  { color: "hsl(200, 80%, 55% / 0.3)", size: 350, blur: 160, opacity: 0.25, delay: 0.25 },
];

const FinalCTASection = () => {
  const ref = useRef(null);
  const containerRef = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
  const { vibrate } = useHaptics();

  const handleBookClick = () => {
    vibrate('medium');
    setIsCalendlyOpen(true);
  };
  
  // Multi-orb cursor glow
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
  const [orbPositions, setOrbPositions] = useState<OrbState[]>(
    orbConfigs.map(() => ({ x: 0, y: 0 }))
  );
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const animationRef = useRef<number>();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTargetPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  useEffect(() => {
    const animate = () => {
      setOrbPositions((prev) =>
        prev.map((pos, i) => {
          const baseLerp = isMobile ? 0.06 : 0.18;
          const delayFactor = isMobile ? 0.15 : 0.35;
          const lerp = baseLerp - orbConfigs[i].delay * delayFactor;
          return {
            x: pos.x + (targetPos.x - pos.x) * Math.max(lerp, isMobile ? 0.02 : 0.05),
            y: pos.y + (targetPos.y - pos.y) * Math.max(lerp, isMobile ? 0.02 : 0.05),
          };
        })
      );
      animationRef.current = requestAnimationFrame(animate);
    };

    if (isHovering) {
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isHovering, targetPos, isMobile]);

  return (
    <section 
      ref={containerRef}
      className="section-padding mesh-gradient-intense relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Multi-orb cursor glow */}
      {orbConfigs.map((orb, i) => (
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
      
      <div ref={ref} className="container-wide relative z-10">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-heading">
            Ready to see what impact looks like{" "}
            <span className="text-gradient">for your firm?</span>
          </h2>
          <p className="section-subtitle mb-6 max-w-2xl mx-auto">
            Book a 30-minute working session with our team. We'll explore your current 
            operations, identify high-impact opportunities, and show you exactly how 
            alfred ai could drive measurable outcomes.
          </p>

          {/* ICP qualifier */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <span className="text-sm text-muted-foreground">
              Best for: <span className="font-semibold text-foreground">$10M–$300M revenue</span> • <span className="font-semibold text-foreground">20–500 staff</span>
            </span>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              variant="cta"
              size="xl"
              onClick={handleBookClick}
              className="group"
            >
              Book an Impact Conversation
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>

          <motion.div
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Clock className="w-4 h-4" />
            <span>30-minute working session • No sales pitch • Outcome-focused</span>
          </motion.div>
        </motion.div>
      </div>

      <BookingChatModal isOpen={isCalendlyOpen} onClose={() => setIsCalendlyOpen(false)} />
    </section>
  );
};

export default FinalCTASection;
