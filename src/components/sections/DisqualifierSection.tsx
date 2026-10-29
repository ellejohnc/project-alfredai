import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { X } from "lucide-react";

interface OrbState {
  x: number;
  y: number;
}

const orbConfigs = [
  { color: "hsl(var(--primary))", size: 450, blur: 100, opacity: 0.4, delay: 0 },
  { color: "hsl(280, 75%, 55%)", size: 380, blur: 120, opacity: 0.3, delay: 0.15 },
  { color: "hsl(200, 80%, 55%)", size: 320, blur: 140, opacity: 0.22, delay: 0.28 },
];

const DisqualifierSection = () => {
  const ref = useRef(null);
  const containerRef = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  
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

  const notItems = [
    {
      title: "Not an AI assistant toy",
      description: "This isn't a novelty AI assistant. It's enterprise-grade infrastructure for real operations.",
    },
    {
      title: "Not generic automation software",
      description: "No drag-and-drop templates. alfred ai is purpose-built for complex, compliance-heavy workflows.",
    },
    {
      title: "Not DIY SaaS for small teams",
      description: "We don't serve 5-person startups. We work with firms ready for operational transformation.",
    },
  ];

  return (
    <section 
      ref={containerRef}
      className="section-padding bg-accent relative overflow-hidden"
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
          className="max-w-3xl mx-auto text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-sm font-medium text-accent-foreground/60 uppercase tracking-wider mb-4 block">
            Setting Expectations
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold text-accent-foreground mb-4">
            What alfred ai is{" "}
            <span className="text-destructive">NOT</span>
          </h2>
          <p className="text-lg text-accent-foreground/70">
            Clarity builds trust. Here's what we don't do.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {notItems.map((item, index) => (
            <motion.div
              key={index}
              className="relative bg-background/5 border border-accent-foreground/10 rounded-xl p-6 hover:border-accent-foreground/20 transition-colors backdrop-blur-sm"
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <X className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-accent-foreground mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-accent-foreground/70 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DisqualifierSection;
