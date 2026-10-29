import { ArrowRight, FileText, BarChart3, MessageSquareQuote, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollReveal, useStaggeredReveal } from "@/hooks/useScrollReveal";
import { useState, useCallback, useEffect, memo } from "react";

interface OrbState {
  x: number;
  y: number;
}

const orbConfigs = [
  { color: "hsl(var(--primary))", size: 550, blur: 120, opacity: 0.35, delay: 0 },
  { color: "hsl(280, 75%, 55%)", size: 450, blur: 140, opacity: 0.28, delay: 0.15 },
  { color: "hsl(160, 70%, 45%)", size: 380, blur: 160, opacity: 0.22, delay: 0.3 },
];

const ImpactProofSection = memo(() => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: cardsRef, isVisible: cardsVisible, getDelay: getCardDelay } = useStaggeredReveal(3, 150);
  const { ref: quoteRef, isVisible: quoteVisible } = useScrollReveal({ threshold: 0.15 });
  
  // Use callback ref pattern instead of useRef to avoid hook conflicts in lazy-loaded components
  const [containerEl, setContainerEl] = useState<HTMLElement | null>(null);
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
  const [orbPositions, setOrbPositions] = useState<OrbState[]>(
    orbConfigs.map(() => ({ x: 0, y: 0 }))
  );
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerEl) return;
    const rect = containerEl.getBoundingClientRect();
    setTargetPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [containerEl]);

  useEffect(() => {
    let animationFrameId: number | undefined;
    
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
      animationFrameId = requestAnimationFrame(animate);
    };

    if (isHovering) {
      animationFrameId = requestAnimationFrame(animate);
    }
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isHovering, targetPos, isMobile]);

  const categories = [
    {
      icon: FileText,
      title: "Case Studies",
      description: "In-depth analyses of how organisations transformed their operations with alfred ai.",
      count: "12+",
      link: "/impact-studies?type=case-studies",
      gradient: "from-rose-500/20 via-rose-500/10 to-transparent",
      iconBg: "bg-rose-500/15",
      iconColor: "text-rose-400",
      countColor: "text-rose-400",
    },
    {
      icon: BarChart3,
      title: "ROI Breakdowns",
      description: "Detailed financial impact analyses showing time saved, costs reduced, and revenue gained.",
      count: "8+",
      link: "/impact-studies?type=roi",
      gradient: "from-emerald-500/20 via-emerald-500/10 to-transparent",
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-400",
      countColor: "text-emerald-400",
    },
    {
      icon: MessageSquareQuote,
      title: "Testimonials",
      description: "Direct feedback from executives and operators who've experienced the transformation.",
      count: "24+",
      link: "/impact-studies?type=testimonials",
      gradient: "from-violet-500/20 via-violet-500/10 to-transparent",
      iconBg: "bg-violet-500/15",
      iconColor: "text-violet-400",
      countColor: "text-violet-400",
    },
  ];

  return (
    <section 
      ref={setContainerEl}
      className="py-24 lg:py-32 bg-[hsl(220,25%,10%)] text-white relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Multi-orb cursor glow with trailing effect */}
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
      
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/[0.08] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-500/[0.06] rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container-wide relative z-10">
        <div
          ref={headerRef}
          className={`max-w-3xl mx-auto text-center mb-20 reveal-fade-up ${headerVisible ? 'revealed' : ''}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary tracking-wide uppercase">Impact Studies</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-semibold tracking-tight leading-[1.1] mb-6 text-white">
            Don't take our word for it.{" "}
            <span className="text-primary">See the evidence.</span>
          </h2>
          <p className="text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
            Every claim we make is backed by real-world results from organisations like yours.
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {categories.map((category, index) => (
            <div
              key={index}
              className={`group relative reveal-fade-up ${cardsVisible ? 'revealed' : ''}`}
              style={getCardDelay(index)}
            >
              <div className="relative h-full p-8 lg:p-9 rounded-2xl bg-[hsl(220,20%,16%)] border border-white/10 hover:border-primary/30 transition-all duration-300 overflow-hidden">
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-8">
                    <div className={`w-12 h-12 rounded-xl ${category.iconBg} flex items-center justify-center border border-white/5`}>
                      <category.icon className={`w-6 h-6 ${category.iconColor}`} />
                    </div>
                    <span className={`text-3xl font-bold text-gradient-primary`}>{category.count}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">{category.title}</h3>
                  <p className="text-white/60 leading-relaxed mb-8 text-[15px]">
                    {category.description}
                  </p>
                  <Link 
                    to={category.link} 
                    className={`inline-flex items-center gap-2 ${category.iconColor} font-medium text-sm hover:gap-3 transition-all duration-200`}
                  >
                    Explore
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Featured Quote */}
        <div
          ref={quoteRef}
          className={`mt-20 lg:mt-24 reveal-scale ${quoteVisible ? 'revealed' : ''}`}
        >
          <div className="relative p-10 md:p-14 lg:p-16 rounded-3xl bg-[hsl(220,20%,14%)] border border-white/10 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/15 rounded-full blur-[80px]" />
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-[100px]" />
            <div className="absolute top-8 right-8 md:top-10 md:right-10">
              <div className="text-7xl md:text-8xl font-serif text-primary/20 select-none">"</div>
            </div>
            
            <div className="relative z-10 max-w-4xl">
              <blockquote className="text-2xl md:text-3xl lg:text-[2rem] font-medium leading-snug mb-10 text-white">
                "Report automation took an 8-hour task to under{" "}
                <span className="text-gradient-primary font-semibold">2½ minutes</span>. It feels like we added 
                an entire operations department overnight."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                  <span className="text-white font-semibold text-lg">CB</span>
                </div>
                <div>
                  <p className="font-semibold text-white text-lg">Colin B.</p>
                  <p className="text-white/80">Managing Director, Consulting firm since 1996</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

ImpactProofSection.displayName = 'ImpactProofSection';

export default ImpactProofSection;
