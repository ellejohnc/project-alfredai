import { useRef, useState, useEffect, useCallback, useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, Radar, LayoutGrid, ArrowRight, Check, Handshake } from "lucide-react";
import { OmegaIcon } from "@/components/icons/OmegaIcon";
import { Engine6 } from "@/components/icons/Engine6";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import accountableLinkLogo from "@/assets/logos/accountable-link-icon.png";
import forgeScreenshot from "@/assets/products/forge-screenshot.png";
import butlerScreenshot from "@/assets/products/butler-screenshot.webp";
import watchScreenshot from "@/assets/products/watch-screenshot.webp";
import accountableOsScreenshot from "@/assets/products/accountable-os-screenshot.png.asset.json";
import reoScreenshot from "@/assets/products/omega-screenshot.png.asset.json";
import omegaDemoVideo from "@/assets/products/omega-demo.mp4.asset.json";
import evaIcon from "@/assets/eva-icon.png.asset.json";

export type Pillar = {
  id: string;
  number: string;
  name: string;
  tagline: string;
  description: string;
  highlights: string[];
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  accent?: boolean;
  logo?: string;
  screenshot?: string;
};

const SpinFidget = ({
  icon: Icon,
  logo,
  hoverTargetRef,
  className,
  iconClassName = "w-16 h-16 text-foreground",
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  logo?: string;
  hoverTargetRef?: { current: HTMLElement | null };
  className?: string;
  iconClassName?: string;
}) => {
  const angleRef = useRef(0);
  const velocityRef = useRef(0); // degrees per frame
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverRef = useRef(false);
  const cardHoveredRef = useRef(false);
  const [angle, setAngle] = useState(0);

  const resetToZero = useCallback(() => {
    const startAngle = angleRef.current;
    if (Math.abs(startAngle) < 0.5) {
      angleRef.current = 0;
      setAngle(0);
      return;
    }
    const startTime = performance.now();
    const duration = 600;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    let resetRaf: number;
    const animate = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      angleRef.current = startAngle * (1 - ease(p));
      setAngle(angleRef.current);
      if (p < 1) {
        resetRaf = requestAnimationFrame(animate);
      } else {
        angleRef.current = 0;
        setAngle(0);
      }
    };
    resetRaf = requestAnimationFrame(animate);
  }, []);

  const tick = useCallback((ts: number) => {
    if (lastTsRef.current == null) lastTsRef.current = ts;
    const dt = Math.min((ts - lastTsRef.current) / 16.667, 3); // frames elapsed (capped)
    lastTsRef.current = ts;

    const hoverBoost = hoverRef.current ? 3 : 0;
    angleRef.current += (velocityRef.current + hoverBoost) * dt;
    // friction: exponential decay toward zero
    velocityRef.current *= Math.pow(0.985, dt);

    setAngle(angleRef.current);

    const moving = Math.abs(velocityRef.current) > 0.05 || hoverRef.current;

    if (moving) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      velocityRef.current = 0;
      rafRef.current = null;
      lastTsRef.current = null;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        resetToZero();
      }, 5000);
    }
  }, [resetToZero]);

  const handleClick = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    // each click adds momentum; faster the more you click
    velocityRef.current += 14 + Math.min(Math.abs(velocityRef.current) * 0.6, 40);
    if (rafRef.current == null) {
      lastTsRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  const startHover = useCallback(() => {
    if (hoverRef.current) return;
    hoverRef.current = true;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (rafRef.current == null) {
      lastTsRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  const handleMouseLeave = useCallback(() => {
    hoverRef.current = cardHoveredRef.current;
  }, []);

  useEffect(() => {
    const hoverTarget = hoverTargetRef?.current;
    if (!hoverTarget) return;

    let lastScrollTs = 0;
    const onScroll = () => {
      lastScrollTs = performance.now();
    };

    const handlePointerMove = () => {
      if (performance.now() - lastScrollTs < 250) return;
      cardHoveredRef.current = true;
      startHover();
    };

    const handleCardLeave = () => {
      cardHoveredRef.current = false;
      hoverRef.current = false;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    hoverTarget.addEventListener("pointermove", handlePointerMove);
    hoverTarget.addEventListener("pointerleave", handleCardLeave);

    return () => {
      window.removeEventListener("scroll", onScroll);
      hoverTarget.removeEventListener("pointermove", handlePointerMove);
      hoverTarget.removeEventListener("pointerleave", handleCardLeave);
    };
  }, [hoverTargetRef, startHover]);

  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  }, []);

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={startHover}
      onMouseLeave={handleMouseLeave}
      aria-label="Spin the fidget"
      className={cn(
        "w-20 h-20 flex items-center justify-center transition-colors duration-300 active:scale-95 touch-manipulation select-none cursor-pointer",
        className
      )}
    >
      {logo ? (
        <img
          src={logo}
          alt=""
          className="w-16 h-16 object-contain will-change-transform"
          style={{ transform: `rotate(${angle}deg)` }}
        />
      ) : (
        <Icon
          className={cn("will-change-transform", iconClassName)}
          style={{ transform: `rotate(${angle}deg)` }}
        />
      )}
    </button>
  );
};

// Heading that auto-scales its font size to fill the available container width.
const FitText = ({
  text,
  className = "",
  max = 144,
  min = 28,
}: {
  text: string;
  className?: string;
  max?: number;
  min?: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState(max);

  useLayoutEffect(() => {
    const fit = () => {
      const container = containerRef.current;
      const span = textRef.current;
      if (!container || !span) return;
      const available = container.clientWidth;
      const textWidth = span.scrollWidth;
      if (!available || !textWidth) return;
      const next = (size * available) / textWidth;
      const clamped = Math.max(min, Math.min(max, next));
      if (Math.abs(clamped - size) > 0.5) setSize(clamped);
    };

    fit();
    const ro = new ResizeObserver(fit);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [text, size, max, min]);

  return (
    <div ref={containerRef} className="w-full">
      <h2
        className={className}
        style={{ fontSize: `${size}px`, lineHeight: 1, paddingBottom: `${size * 0.18}px` }}
      >
        <span ref={textRef} className="inline-block whitespace-nowrap">
          {text}
        </span>
      </h2>
    </div>
  );
};

// Airport security checkpoint scene: a security guard observes while bags travel
// through an X-ray machine. The conveyor belt moves personal items into the scanner,
// a sweep beam reads the contents, and cleared bags exit to the enterprise side.
// The exact metaphor for EVA's AI security guard: personal AI stays personal,
// only approved intelligence passes through into enterprise workflows.
const NeuralHandshake = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* ambient scanner glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.12),transparent_70%)]" />

      <svg
        viewBox="0 0 300 210"
        className="relative z-10 w-[88%] max-w-[420px] h-auto"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="belt-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="50%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="machine-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="45%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="screen-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="beam-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="bag-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="guard-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <radialGradient id="floor-shadow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="tunnel-grad" cx="0.5" cy="0.4" r="0.7">
            <stop offset="0%" stopColor="#0b1220" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
          <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ===== FLOOR + SHADOWS ===== */}
        <line x1="10" y1="186" x2="290" y2="186" stroke="hsl(var(--border))" strokeWidth="1" opacity="0.5" />
        {/* grounding shadow under machine */}
        <ellipse cx="150" cy="184" rx="70" ry="6" fill="url(#floor-shadow)" />
        {/* grounding shadow under guard */}
        <ellipse cx="49" cy="184" rx="22" ry="4" fill="url(#floor-shadow)" />

        {/* ===== CONVEYOR BELT ===== */}
        {/* belt legs */}
        <rect x="40" y="172" width="4" height="14" fill="#1e293b" />
        <rect x="256" y="172" width="4" height="14" fill="#1e293b" />
        {/* belt body */}
        <rect x="20" y="158" width="260" height="14" rx="7" fill="url(#belt-grad)" stroke="#0f172a" strokeWidth="0.75" />
        {/* belt top highlight */}
        <rect x="22" y="159" width="256" height="1.5" rx="0.75" fill="#64748b" opacity="0.5" />
        {/* belt segments (moving) */}
        <g>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
            <rect key={i} x={26 + i * 22} y="161" width="10" height="8" rx="2" fill="#0f172a" opacity="0.65" />
          ))}
          <animateTransform attributeName="transform" type="translate" from="0 0" to="22 0" dur="0.9s" repeatCount="indefinite" />
        </g>

        {/* ===== X-RAY MACHINE ===== */}
        {/* inner tunnel */}
        <rect x="128" y="62" width="44" height="108" fill="url(#tunnel-grad)" />
        {/* machine housing left */}
        <rect x="108" y="58" width="20" height="112" rx="4" fill="url(#machine-grad)" stroke="#475569" strokeWidth="1" />
        {/* machine housing right */}
        <rect x="172" y="58" width="20" height="112" rx="4" fill="url(#machine-grad)" stroke="#475569" strokeWidth="1" />
        {/* edge highlights */}
        <rect x="110" y="60" width="2" height="108" rx="1" fill="#64748b" opacity="0.4" />
        <rect x="174" y="60" width="2" height="108" rx="1" fill="#64748b" opacity="0.4" />
        {/* scanner arch top */}
        <rect x="106" y="48" width="88" height="14" rx="5" fill="#0f172a" stroke="#475569" strokeWidth="1" />
        {/* LED strip inside arch */}
        <rect x="116" y="52" width="68" height="3" rx="1.5" fill="#ef4444" opacity="0.95" filter="url(#soft-glow)" />

        {/* ===== SCAN BEAM (sweeps back & forth) ===== */}
        <rect x="128" y="64" width="3" height="104" rx="1.5" fill="url(#beam-grad)" opacity="0.85" filter="url(#soft-glow)">
          <animate attributeName="x" values="128;169;128" dur="2.4s" repeatCount="indefinite" />
        </rect>

        {/* ===== MONITOR SCREEN — wall-mounted, upper-left, clear of guard ===== */}
        <g>
          {/* mount arm */}
          <rect x="24" y="40" width="3" height="20" rx="1" fill="#1e293b" />
          {/* screen body */}
          <rect x="20" y="14" width="56" height="38" rx="4" fill="#020617" stroke="#334155" strokeWidth="1.5" />
          {/* screen glow */}
          <rect x="23" y="17" width="50" height="32" rx="2" fill="url(#screen-grad)" />
          {/* luggage silhouette on screen */}
          <path d="M 36 38 L 36 44 L 60 44 L 60 38 C 60 31, 54 29, 48 29 C 42 29, 36 31, 36 38 Z" fill="#0ea5e9" opacity="0.5" />
          <rect x="42" y="33" width="12" height="9" rx="2" fill="#0ea5e9" opacity="0.32" />
          {/* scan line on screen */}
          <line x1="24" y1="22" x2="72" y2="22" stroke="#38bdf8" strokeWidth="0.75" opacity="0.7">
            <animate attributeName="y1" values="20;46;20" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="y2" values="20;46;20" dur="1.6s" repeatCount="indefinite" />
          </line>
          {/* screen bezel highlight */}
          <rect x="21" y="15" width="54" height="1.5" rx="0.75" fill="#475569" opacity="0.5" />
        </g>

        {/* ===== SECURITY GUARD — left side ===== */}
        {/* body */}
        <path d="M 40 158 L 40 112 C 40 98, 58 98, 58 112 L 58 158 Z" fill="url(#guard-grad)" />
        {/* uniform highlight */}
        <path d="M 43 156 L 43 112 C 43 104, 49 102, 49 102 L 49 156 Z" fill="#475569" opacity="0.35" />
        {/* head */}
        <circle cx="49" cy="90" r="13" fill="#e2e8f0" />
        {/* head shading */}
        <path d="M 49 77 A 13 13 0 0 1 49 103 Z" fill="#cbd5e1" opacity="0.5" />
        {/* cap */}
        <path d="M 33 86 C 33 73, 49 71, 64 78 L 67 82 L 35 84 Z" fill="#0f172a" />
        <path d="M 33 86 C 33 73, 49 71, 64 78 L 64 80 L 34 83 Z" fill="#1e293b" opacity="0.6" />
        {/* visor / sunglasses */}
        <rect x="40" y="88" width="18" height="5" rx="2" fill="#0f172a" />
        {/* arm pointing toward scanner */}
        <path d="M 58 120 L 84 126 L 82 130 L 56 124 Z" fill="url(#guard-grad)" />
        {/* hand */}
        <circle cx="84" cy="128" r="4" fill="#e2e8f0" />

        {/* ===== BAGS / ITEMS ON BELT ===== */}
        {/* bag 1 — entering scanner */}
        <g>
          <rect x="85" y="136" width="24" height="20" rx="3" fill="url(#bag-grad)" stroke="#94a3b8" strokeWidth="0.75" />
          <rect x="89" y="130" width="16" height="8" rx="2" fill="#334155" />
          <rect x="87" y="139" width="20" height="1.5" rx="0.75" fill="#94a3b8" opacity="0.4" />
          {/* handle */}
          <path d="M 93 130 L 93 124 L 101 124 L 101 130" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
          <animateTransform attributeName="transform" type="translate" from="0 0" to="80 0" dur="3.6s" repeatCount="indefinite" />
        </g>

        {/* bag 2 — exiting scanner (cleared) */}
        <g>
          <rect x="195" y="138" width="22" height="18" rx="3" fill="url(#bag-grad)" stroke="#94a3b8" strokeWidth="0.75" />
          <circle cx="206" cy="130" r="5.5" fill="#0f172a" stroke="#22c55e" strokeWidth="1.5" />
          <path d="M 203 130 L 205.5 132.5 L 210 127" stroke="#22c55e" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <animateTransform attributeName="transform" type="translate" from="0 0" to="60 0" dur="3.6s" begin="1.8s" repeatCount="indefinite" />
        </g>

        {/* small suitcase */}
        <g>
          <rect x="40" y="142" width="18" height="14" rx="2" fill="#475569" stroke="#64748b" strokeWidth="0.75" />
          <rect x="44" y="138" width="10" height="6" rx="1" fill="#1e293b" />
          <animateTransform attributeName="transform" type="translate" from="0 0" to="100 0" dur="4.5s" repeatCount="indefinite" />
        </g>

        {/* ===== DATA PACKETS — approved tags crossing the boundary ===== */}
        <circle r="3" fill="#22c55e" opacity="0.9">
          <animateMotion dur="2s" repeatCount="indefinite" path="M 128 110 L 172 110" />
        </circle>
        <circle r="2.5" fill="hsl(var(--primary))" opacity="0.85">
          <animateMotion dur="2s" begin="1s" repeatCount="indefinite" path="M 172 110 L 128 110" />
        </circle>

        {/* ===== BOUNDARY DIVIDERS ===== */}
        {/* left gate line */}
        <line x1="128" y1="62" x2="128" y2="158" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="4 6" />
        {/* right gate line */}
        <line x1="172" y1="62" x2="172" y2="158" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="4 6" />
        {/* animated dashed flow on boundary */}
        <line x1="150" y1="62" x2="150" y2="158" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="4 8" strokeLinecap="round" className="animate-neural-flow" />

        {/* checkpoint pulse rings at scanner centre */}
        <circle cx="150" cy="110" r="16" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" className="origin-center animate-at-field" style={{ transformBox: "fill-box", transformOrigin: "150px 110px" }} />
        <circle cx="150" cy="110" r="16" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" className="origin-center animate-at-field" style={{ transformBox: "fill-box", transformOrigin: "150px 110px", animationDelay: "1.4s" }} />
      </svg>

      {/* status readout */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-primary/30 bg-card/80 backdrop-blur-sm px-3 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        <span className="font-product text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
          Scanning
        </span>
      </div>
    </div>
  );
};

const ForgeCard = ({ pillar, index }: { pillar: Pillar; index: number }) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const nodes = [
    { top: "18%", left: "20%", size: 8, delay: "0s", dur: "5s" },
    { top: "32%", left: "62%", size: 5, delay: "0.8s", dur: "6.5s" },
    { top: "55%", left: "38%", size: 6, delay: "1.4s", dur: "5.5s" },
    { top: "68%", left: "74%", size: 9, delay: "0.4s", dur: "7s" },
    { top: "44%", left: "85%", size: 4, delay: "1.1s", dur: "6s" },
    { top: "78%", left: "28%", size: 5, delay: "2s", dur: "5.8s" },
  ];

  const isEva = pillar.id === "eva";
  const isOmega = pillar.id === "omega";
  const [omegaVideoActive, setOmegaVideoActive] = useState(false);

  return (
    <motion.div
      id={pillar.id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.2) }}
      ref={cardRef}
      className={
        isEva
          ? "group relative scroll-mt-24 overflow-hidden rounded-2xl border border-dashed border-primary/40 bg-gradient-to-br from-primary/[0.04] via-card to-card shadow-sm transition-all duration-500 hover:shadow-2xl hover:border-primary/70"
          : "group relative scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-500 hover:shadow-2xl hover:border-foreground/20"
      }
    >
      <div className="flex flex-col md:flex-row min-h-[420px] md:min-h-[480px] overflow-hidden">
        {/* Fixed metadata sidebar */}
        <div
          className={`relative z-30 w-full md:w-28 border-b md:border-b-0 md:border-r flex flex-row md:flex-col items-center justify-between gap-4 px-6 py-5 md:py-10 ${
            isEva
              ? "border-dashed border-primary/30 bg-primary/[0.03]"
              : "border-border bg-card"
          }`}
        >
          {isEva ? (
            <span
              className="text-[10px] md:text-xs font-product font-bold uppercase tracking-[0.2em] text-primary select-none [writing-mode:horizontal-tb] md:[writing-mode:vertical-rl] md:rotate-180"
            >
              On the way
            </span>
          ) : (
            <span className="text-3xl md:text-4xl font-product font-bold text-muted-foreground/20 group-hover:text-muted-foreground/40 select-none transition-colors duration-500">
              {pillar.number}
            </span>
          )}
          {isOmega ? (
            <SpinFidget
              icon={OmegaIcon}
              hoverTargetRef={cardRef}
              className="text-foreground"
              iconClassName="w-16 h-16 text-current"
            />
          ) : (
            <SpinFidget icon={pillar.icon} logo={pillar.logo} hoverTargetRef={cardRef} />
          )}

          <div className="hidden md:flex flex-col gap-1">
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <span className="w-1 h-1 rounded-full bg-foreground" />
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          </div>
        </div>

        {/* Sliding wrapper */}
        <div className="relative flex-1">
          {/* Main content — always visible */}
          <div className="relative z-10 w-full md:w-[55%] p-6 md:p-12 lg:p-14 flex flex-col justify-center bg-card">
            <div className="max-w-2xl">
              <FitText
                text={pillar.name}
                className="font-product font-bold tracking-tighter text-foreground select-none"
              />
              {pillar.accent && (
                <span className="inline-block mt-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-primary text-primary-foreground leading-none">
                  Core
                </span>
              )}
              {pillar.id === "eva" && (
                <div className="mt-4 relative inline-flex max-w-full overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.06] via-card to-card px-5 py-3.5 md:px-7 md:py-4 shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.35)]">
                  {/* shimmer sweep */}
                  <span className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-primary/15 to-transparent animate-shimmer" />
                  <div className="relative flex items-center gap-3 md:gap-4">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                    </span>
                    <div className="flex flex-col leading-none">
                      <span className="font-product text-[9px] md:text-[10px] font-bold uppercase tracking-[0.4em] text-primary/80">
                        Status
                      </span>
                      <span className="font-product text-xl md:text-3xl font-bold tracking-tight text-foreground mt-1">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div className="mb-5" />

              <div className="space-y-5 md:space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-px w-10 bg-primary" />
                  <p className="font-product text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
                    {pillar.tagline}
                  </p>
                </div>

                <p className="text-base md:text-xl text-muted-foreground leading-relaxed max-w-lg">
                  {pillar.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {pillar.highlights.map((h) => (
                    <span
                      key={h}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/60 border border-border rounded-lg text-xs font-medium text-foreground"
                    >
                      <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      {h}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link to={`/products/${pillar.id}`}>
                    <Button variant="cta" size="lg" className="min-h-[48px] group/btn">
                      {pillar.id === "eva" ? "Join the Waitlist" : `Explore ${pillar.name}`}
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                  {pillar.id === "aos" && (
                    <Button
                      variant="cta-outline"
                      size="lg"
                      onClick={() => (window.location.href = "https://www.accountable.link")}
                      className="min-h-[48px]"
                    >
                      Explore Accountable.link
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Screenshot reveal panel */}
          {pillar.screenshot && (
            <Link
              to={`/products/${pillar.id}`}
              onMouseEnter={() => isOmega && setOmegaVideoActive(true)}
              onFocus={() => isOmega && setOmegaVideoActive(true)}
              className="hidden md:flex absolute inset-y-0 right-0 w-[48%] items-center justify-center overflow-hidden translate-x-8 opacity-0 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0 group-hover:opacity-100 cursor-pointer"
            >
              {isOmega && omegaVideoActive ? (
                <video
                  src={omegaDemoVideo.url}
                  poster={pillar.screenshot}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="none"
                  disablePictureInPicture
                  disableRemotePlayback
                  onContextMenu={(e) => e.preventDefault()}
                  className="relative z-10 w-full h-full object-contain p-6 scale-105 transition-transform duration-1000 group-hover:scale-100"
                />
              ) : (
                <img
                  src={pillar.screenshot}
                  alt={`${pillar.name} product interface`}
                  loading="lazy"
                  decoding="async"
                  className="relative z-10 w-full h-full object-contain p-6 scale-105 transition-transform duration-1000 group-hover:scale-100"
                />
              )}

              <div className="absolute inset-0 pointer-events-none">
                {nodes.map((n, i) => (
                  <span
                    key={i}
                    className="absolute rounded-full bg-primary animate-float"
                    style={{
                      top: n.top,
                      left: n.left,
                      width: n.size,
                      height: n.size,
                      animationDelay: n.delay,
                      animationDuration: n.dur,
                      boxShadow: "0 0 12px hsl(var(--primary) / 0.8)",
                    }}
                  />
                ))}
              </div>
            </Link>
          )}

          {/* EVA — Evangelion-style neural handshake, always synced */}
          {isEva && (
            <Link
              to={`/products/${pillar.id}`}
              className="hidden md:flex absolute inset-y-0 right-0 w-[48%] items-center justify-center overflow-hidden cursor-pointer"
            >
              <NeuralHandshake />
            </Link>
          )}

          {/* Decorative reveal panel for cards without a screenshot */}
          {!pillar.screenshot && !isEva && (
            <Link
              to={`/products/${pillar.id}`}
              className="hidden md:flex absolute inset-y-0 right-0 w-[48%] items-center justify-center overflow-hidden translate-x-8 opacity-0 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0 group-hover:opacity-100 cursor-pointer"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.12),transparent_70%)]" />

              {pillar.logo ? (
                <img
                  src={pillar.logo}
                  alt={`${pillar.name} logo`}
                  loading="lazy"
                  className="relative z-10 w-32 h-32 object-contain transition-transform duration-1000 scale-95 group-hover:scale-100"
                />
              ) : (
                <div className="relative z-10 flex items-center justify-center w-40 h-40 rounded-3xl border border-border bg-card/60 backdrop-blur-sm shadow-xl transition-transform duration-1000 scale-95 group-hover:scale-100">
                  <pillar.icon className="w-20 h-20 text-primary" strokeWidth={1.25} />
                </div>
              )}

              <div className="absolute inset-0 pointer-events-none">
                {nodes.map((n, i) => (
                  <span
                    key={i}
                    className="absolute rounded-full bg-primary animate-float"
                    style={{
                      top: n.top,
                      left: n.left,
                      width: n.size,
                      height: n.size,
                      animationDelay: n.delay,
                      animationDuration: n.dur,
                      boxShadow: "0 0 12px hsl(var(--primary) / 0.8)",
                    }}
                  />
                ))}
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Industrial corner brackets */}
      <div className="absolute top-0 right-0 p-4 pointer-events-none">
        <div className="w-7 h-7 border-t-2 border-r-2 border-border transition-all duration-500 group-hover:border-primary group-hover:w-10 group-hover:h-10" />
      </div>
      <div className="absolute bottom-0 left-0 p-4 pointer-events-none">
        <div className="w-7 h-7 border-b-2 border-l-2 border-border transition-all duration-500 group-hover:border-primary group-hover:w-10 group-hover:h-10" />
      </div>
    </motion.div>
  );
};

export default ForgeCard;
