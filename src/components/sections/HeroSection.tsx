import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import { FloatingStar } from "@/components/ui/safe-motion";
import { ArrowLeft, MessageCircle, Calculator, Play, DollarSign, Sparkles, Rocket, TrendingUp, BookOpen, LucideIcon, ChevronDown } from "lucide-react";
import HeroDemoPreview from "@/components/hero/HeroDemoPreview";
import CertificationBadges from "@/components/sections/CertificationBadges";

import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import { lazy, Suspense } from "react";
import WaveDivider from "@/components/ui/WaveDivider";

/**
 * HeroSection — Dark-background hero with split layout.
 * 
 * IMPORTANT: This section always renders on a dark aurora background,
 * regardless of light/dark theme mode. All text uses explicit white/opacity
 * classes (text-white, text-white/70) rather than semantic tokens like
 * text-foreground, because those resolve to dark text in light mode.
 */

// Orb configs for cursor glow effect
const heroOrbConfigs = [
  { color: "hsl(0 0% 100% / 0.06)", size: 600, blur: 160, opacity: 0.25, delay: 0 },
  { color: "hsl(0 0% 100% / 0.05)", size: 500, blur: 190, opacity: 0.2, delay: 0.12 },
  { color: "hsl(330 81% 60% / 0.08)", size: 420, blur: 200, opacity: 0.18, delay: 0.25 },
];

const ConversationalSignup = lazy(() => import("@/components/signup/ConversationalSignup"));

// ============================================
// A/B TESTING
// ============================================
type VariantKey = 'A' | 'B' | 'C' | 'D' | 'E';

interface HeadlineVariant { main: string; gradient: string; subtitle: string; }

const HEADLINE_VARIANTS: Record<VariantKey, HeadlineVariant> = {
  A: {
    main: "From Requests to Outcome",
    gradient: "10x Faster.",
    subtitle: "We help construction and contracting companies turn fragmented data and manual processes into structured, AI-ready workflows that save time, improve margins, strengthen compliance, stay ahead of the competition, and let your business scale without adding the same level of overhead."
  },
  B: {
    main: "Stop Hiring. Start Scaling.",
    gradient: "AI That Actually Delivers.",
    subtitle: "Your team is stretched thin. Projects slip. Clients wait. Alfred handles the execution so you can focus on growth."
  },
  C: {
    main: "3x Output. Same Team.",
    gradient: "Zero New Hires Required.",
    subtitle: "Mid-market firms using Alfred automate 40+ hours of admin weekly while improving delivery quality and client satisfaction."
  },
  D: {
    main: "The AI Operating System",
    gradient: "Trusted by 200+ Firms.",
    subtitle: "From engineering consultancies to property developers—we're the execution layer that lets leaders focus on strategy, not admin."
  },
  E: {
    main: "Your AI Operations Team.",
    gradient: "Ready in 2 Weeks.",
    subtitle: "Proposals. Invoices. Reports. Compliance. Alfred handles the work your team shouldn't be doing manually."
  }
};

interface CTAButton { text: string; icon: LucideIcon; link?: string; }
interface CTAVariant { primary: CTAButton; secondary: CTAButton; tertiary: CTAButton; }

const CTA_VARIANTS: Record<VariantKey, CTAVariant> = {
  A: {
    primary: { text: "Start with AI Take-Off", icon: Play },
    secondary: { text: "Book a Call", icon: MessageCircle, link: "https://new.alfredai.bot/book" },
    tertiary: { text: "ROI Breakdowns", icon: Calculator, link: "/impact-studies/roi-breakdowns" }
  },
  B: {
    primary: { text: "Start with AI Take-Off", icon: Play },
    secondary: { text: "Book a Call", icon: MessageCircle, link: "https://new.alfredai.bot/book" },
    tertiary: { text: "Calculate Savings", icon: DollarSign, link: "/impact-studies/roi-breakdowns" }
  },
  C: {
    primary: { text: "Start with AI Take-Off", icon: Sparkles },
    secondary: { text: "Book a Call", icon: MessageCircle, link: "https://new.alfredai.bot/book" },
    tertiary: { text: "View Case Studies", icon: BookOpen, link: "/impact-studies/case-studies" }
  },
  D: {
    primary: { text: "Start with AI Take-Off", icon: Rocket },
    secondary: { text: "Book a Call", icon: MessageCircle, link: "https://new.alfredai.bot/book" },
    tertiary: { text: "See Your ROI", icon: TrendingUp, link: "/impact-studies/roi-breakdowns" }
  },
  E: {
    primary: { text: "Start with AI Take-Off", icon: Play },
    secondary: { text: "Book a Call", icon: MessageCircle, link: "https://new.alfredai.bot/book" },
    tertiary: { text: "See ROI Breakdowns", icon: BookOpen, link: "/impact-studies/roi-breakdowns" }
  }
};

const DEFAULT_VARIANT: VariantKey = 'A';
const ENABLE_RANDOM_VARIANT = false;

interface ABTestEvent {
  event: 'ab_test_view' | 'ab_test_click';
  variant: VariantKey;
  element?: 'primary_cta' | 'secondary_cta' | 'tertiary_cta';
  headline?: string;
  cta_text?: string;
  timestamp: string;
  session_id: string;
}

const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('ab_test_session');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('ab_test_session', sessionId);
  }
  return sessionId;
};

const trackABTestEvent = (event: ABTestEvent) => {
  console.log('[A/B Test Analytics]', event);
  const events: ABTestEvent[] = JSON.parse(localStorage.getItem('ab_test_events') || '[]');
  events.push(event);
  localStorage.setItem('ab_test_events', JSON.stringify(events.slice(-100)));
};

const getVariant = (urlParam: string | null): VariantKey => {
  if (urlParam && urlParam in CTA_VARIANTS) return urlParam as VariantKey;
  if (ENABLE_RANDOM_VARIANT) {
    const variants = Object.keys(CTA_VARIANTS) as VariantKey[];
    const stored = localStorage.getItem('ab_variant');
    if (stored && stored in CTA_VARIANTS) return stored as VariantKey;
    const randomVariant = variants[Math.floor(Math.random() * variants.length)];
    localStorage.setItem('ab_variant', randomVariant);
    return randomVariant;
  }
  return DEFAULT_VARIANT;
};

// ============================================
// COMPONENT
// ============================================
const HeroSection = () => {
  const [showChat, setShowChat] = useState(false);
  const [heroInput, setHeroInput] = useState("");
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 100);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);


  // Defer everything decorative (glow orbs, floating stars, ambient blurs) and
  // the demo preview until the browser is idle, so the first paint only carries
  // the headline + CTAs and taps register immediately on mobile.
  const [decorReady, setDecorReady] = useState(false);
  useEffect(() => {
    const idle = (window as any).requestIdleCallback;
    if (typeof idle === 'function') {
      const id = idle(() => setDecorReady(true), { timeout: 1200 });
      return () => (window as any).cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setDecorReady(true), 200);
    return () => clearTimeout(t);
  }, []);



  const [searchParams] = useSearchParams();
  const [activeVariant, setActiveVariant] = useState<VariantKey>(DEFAULT_VARIANT);

  const cta = CTA_VARIANTS[activeVariant];
  const headline = HEADLINE_VARIANTS[activeVariant];
  const PrimaryIcon = cta.primary.icon;

  useEffect(() => {
    const urlVariant = searchParams.get('variant');
    const variant = getVariant(urlVariant);
    setActiveVariant(variant);
    trackABTestEvent({
      event: 'ab_test_view', variant,
      headline: HEADLINE_VARIANTS[variant].main,
      timestamp: new Date().toISOString(),
      session_id: getSessionId()
    });
  }, [searchParams]);

  const handleCTAClick = useCallback((element: 'primary_cta' | 'secondary_cta' | 'tertiary_cta') => {
    const ctaText = element === 'primary_cta' ? cta.primary.text
      : element === 'secondary_cta' ? cta.secondary.text : cta.tertiary.text;
    trackABTestEvent({
      event: 'ab_test_click', variant: activeVariant, element, cta_text: ctaText,
      timestamp: new Date().toISOString(), session_id: getSessionId()
    });
  }, [activeVariant, cta]);

  // Multi-orb cursor glow — desktop only
  const containerRef = useRef<HTMLElement>(null);
  const targetPosRef = useRef({ x: 0, y: 0 });
  const orbPosRef = useRef(heroOrbConfigs.map(() => ({ x: 0, y: 0 })));
  const orbDomRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const animationRef = useRef<number>();

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    targetPosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  useEffect(() => {
    const animate = () => {
      const target = targetPosRef.current;
      const positions = orbPosRef.current;
      const desktop = isDesktop;
      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const baseLerp = desktop ? 0.18 : 0.06;
        const delayFactor = desktop ? 0.35 : 0.15;
        const lerp = Math.max(baseLerp - heroOrbConfigs[i].delay * delayFactor, desktop ? 0.05 : 0.02);
        pos.x += (target.x - pos.x) * lerp;
        pos.y += (target.y - pos.y) * lerp;
        const el = orbDomRefs.current[i];
        if (el) {
          el.style.transform = `translate(${pos.x - heroOrbConfigs[i].size / 2}px, ${pos.y - heroOrbConfigs[i].size / 2}px)`;
        }
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    if (isHovering) animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isHovering, isDesktop]);

  const starCount = isDesktop ? 10 : 4;

  // Split the gradient line so only the final 2 words carry the accent —
  // keeps the promise as one continuous white sentence with a single emphasis.
  const gradientClean = headline.gradient.trim().replace(/\.$/, "");
  const gradientWords = gradientClean.split(/\s+/);
  const accentPhrase = gradientWords.slice(-2).join(" ");
  const gradientLead = gradientWords.slice(0, -2).join(" ");
  const floatingStars = useMemo(() =>
    [...Array(starCount)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
    })), [starCount]
  );

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center pt-24 md:pt-28 pb-[calc(6.5rem_+_env(safe-area-inset-bottom,0px))] md:pb-8 overflow-hidden hero-aurora-bg"
      onMouseMove={isDesktop ? handleMouseMove : undefined}
      onMouseEnter={isDesktop ? () => setIsHovering(true) : undefined}
      onMouseLeave={isDesktop ? () => setIsHovering(false) : undefined}
    >
      {/* Cursor glow orbs — desktop only, mounted after idle */}
      {isDesktop && decorReady && heroOrbConfigs.map((orb, i) => (
        <div
          key={i}
          ref={(el) => { orbDomRefs.current[i] = el; }}
          className="pointer-events-none absolute z-[1]"
          aria-hidden="true"
          style={{
            left: 0, top: 0, width: orb.size, height: orb.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            opacity: isHovering ? orb.opacity : 0,
            filter: `blur(${orb.blur}px)`,
            transform: `translate(-50%, -50%)`,
            transition: "opacity 0.5s ease-out",
            willChange: 'transform',
          }}
        />
      ))}

      <div className="absolute inset-0 aurora-glow" aria-hidden="true" />

      {decorReady && (
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          {floatingStars.map((star) => (
            <FloatingStar key={star.id} left={star.left} top={star.top} size={star.size} delay={star.delay} duration={star.duration} />
          ))}
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-white/[0.03] blur-3xl animate-star-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-white/[0.025] blur-3xl animate-star-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/[0.04] blur-3xl animate-star-pulse" style={{ animationDuration: '6s' }} />
        </div>
      )}


      {/* ── MAIN CONTENT ── */}
      <div className="container-wide relative z-10">
        <SafeAnimatePresence mode="wait">
          {!showChat ? (
            <motion.div
              key="hero-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center"
            >
              {/* ── Left column (7/12) — Text & CTAs ── */}
              <div className="lg:col-span-7 text-center lg:text-left order-1">


                {/* H1 — unified white headline with single accent phrase for one clear focal point */}
                <motion.h1
                  className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-[3.5rem] font-semibold leading-[1.08] tracking-tight mb-5 sm:mb-6 text-white px-2 sm:px-0"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05 }}
                >
                  {headline.main}{" "}
                  {gradientLead && <>{gradientLead} </>}
                  <span className="text-gradient-animated">{accentPhrase}</span>
                  <span className="text-white">.</span>
                </motion.h1>

                {/* Subtitle — white/70 for readability without competing */}
                <motion.p
                  className="text-base sm:text-lg text-white/70 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8 sm:mb-10 px-4 sm:px-0"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  {headline.subtitle}
                </motion.p>

                {/* CTA Buttons — intentionally NOT animated: they must be
                    visible and tappable on the very first paint on mobile. */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 px-4 sm:px-0">

                  <Button
                    size="lg"
                    asChild
                    className="w-full sm:w-auto min-h-[52px] gap-2.5 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary-hover transition-all duration-300 hover:gap-3 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <Link to="/solutions/ai-takeoff" data-cta-id="hero_try_demo" onClick={() => handleCTAClick('primary_cta')}>
                      <PrimaryIcon className="w-5 h-5" />
                      {cta.primary.text}
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    asChild
                    className="w-full sm:w-auto min-h-[52px] gap-2.5 text-base bg-transparent border border-white/20 text-white/85 hover:bg-white/10 hover:border-white/35 hover:text-white active:bg-white/20 active:border-white/45 active:scale-[0.97] active:shadow-[inset_0_2px_8px_rgba(0,0,0,0.25)] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Link to={cta.secondary.link || "https://new.alfredai.bot/book"} data-cta-id="hero_book" onClick={() => handleCTAClick('secondary_cta')}>
                      <MessageCircle className="w-5 h-5" />
                      {cta.secondary.text}
                    </Link>
                  </Button>
                </div>


                {/* Single muted tertiary action — preserves Chat entry without competing with primary CTAs */}
                <motion.div
                  className="flex items-center justify-center lg:justify-start mt-5 px-4 sm:px-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <Link
                    to="/partners"
                    className="text-white/60 text-xs sm:text-sm flex items-center gap-2 hover:text-white/90 hover:underline underline-offset-2 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Ask us about Partnership
                  </Link>
                </motion.div>

                {/* Certification / compliance trust badges */}
                <CertificationBadges />

              </div>


              {/* ── Right column (5/12) — Demo Preview (ambient, recedes behind headline) ── */}
              <div
                className="lg:col-span-5 order-2 px-2 sm:px-0 lg:opacity-80 origin-right transition-opacity duration-500 hover:opacity-100"
              >
                {decorReady
                  ? <HeroDemoPreview />
                  : <div className="w-full min-h-[220px] rounded-2xl border border-white/10 bg-white/[0.03]" aria-hidden="true" />}
              </div>
            </motion.div>
          ) : (
            /* ── Chat View ── */
            <motion.div
              key="hero-chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="space-y-6"
              >
                <motion.button
                  onClick={() => setShowChat(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 min-h-[44px]"
                >
                  <span className="w-5 h-5 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                    <ArrowLeft className="w-3 h-3 text-white/70 group-hover:text-white transition-colors" />
                  </span>
                  <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">Back</span>
                </motion.button>

                <div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-6 text-white">
                    Let&apos;s personalize your{" "}
                    <span className="bg-gradient-to-r from-primary via-pink-500 to-purple-400 bg-clip-text text-transparent">Alfred experience</span>
                  </h2>
                  <p className="text-lg text-white/70 leading-relaxed">
                    Chat with Alfred to tell us about your needs. In just a few moments,
                    we&apos;ll understand your goals and set you up for a personalized demo.
                  </p>
                </div>

                <div className="space-y-4 pt-4">
                  {[
                    { num: "1", title: "Quick conversation", desc: "Answer a few questions about your role and goals" },
                    { num: "2", title: "Personalized setup", desc: "We tailor your experience based on your needs" },
                    { num: "3", title: "Get your demo", desc: "See exactly how Alfred can transform your operations" },
                  ].map((step) => (
                    <div key={step.num} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/20 shrink-0 mt-0.5">
                        <span className="text-primary text-sm font-semibold">{step.num}</span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{step.title}</p>
                        <p className="text-sm text-white/60">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Suspense fallback={<div className="h-[400px] rounded-xl bg-white/5 animate-pulse" />}>
                  <ConversationalSignup initialMessage={heroInput} />
                </Suspense>
              </motion.div>
            </motion.div>
          )}
        </SafeAnimatePresence>
      </div>

      {/* Scroll indicator */}
      {!showChat && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{
            opacity: hasScrolled ? 0 : 1,
            scale: hasScrolled ? 0.8 : 1,
            y: hasScrolled ? 10 : 0
          }}
          transition={{ delay: hasScrolled ? 0 : 1.2, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          onClick={() => {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try {
                navigator.vibrate([15]);
              } catch {
                // Haptics are a nicety; a browser refusing them must not break the tap.
              }
            }
            const tryAlfredSection = document.getElementById('try-alfred-live');
            if (tryAlfredSection) tryAlfredSection.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`absolute bottom-6 left-0 right-0 mx-auto w-fit z-20 
            flex items-center justify-center text-white/80 hover:text-white 
            transition-colors cursor-pointer group touch-manipulation
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full
            ${hasScrolled ? 'pointer-events-none' : ''}`}
          aria-label="Scroll to Put Your Data to Work"
        >
          <motion.div
            className="relative"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
              aria-hidden="true"
            />
            <div className="relative w-14 h-14 sm:w-12 sm:h-12 rounded-full 
              bg-white/10 group-hover:bg-white/20 
              flex items-center justify-center 
              border border-white/20 group-hover:border-white/40 
              transition-all shadow-[0_8px_30px_rgba(0,0,0,0.35)]
              active:scale-95"
            >
              <ChevronDown className="w-6 h-6 sm:w-5 sm:h-5" />
            </div>
          </motion.div>
        </motion.button>
      )}

      <WaveDivider className="bottom-0" />
    </section>
  );
};

export default HeroSection;
