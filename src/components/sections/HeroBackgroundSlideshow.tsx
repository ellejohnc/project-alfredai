import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { slidesWithImages, slideCaption, HERO_SLIDE_DURATION_MS } from "@/data/heroLocationSlides";

/**
 * HeroBackgroundSlideshow — slow crossfading photo slideshow behind the hero
 * content, one slide per alfred ai location.
 *
 * Behaviour:
 * - Renders nothing while no photos have been provided.
 * - Crossfade every HERO_SLIDE_DURATION_MS, with a very slow Ken Burns zoom.
 * - Pauses while the tab is hidden; respects prefers-reduced-motion (shows the
 *   first photo statically, no zoom, no auto-advance).
 * - theme="dark" (homepage-style): heavy dark overlay for light text on top.
 * - theme="light" (Careers-style): heavy white scrim so dark text stays readable.
 */
type SlideshowTheme = "dark" | "light";

export function HeroBackgroundSlideshow({ theme = "dark" }: { theme?: SlideshowTheme }) {
  const isLight = theme === "light";
  const slides = useMemo(() => slidesWithImages(), []);
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState<Set<string>>(new Set());

  const markLoaded = (id: string) =>
    setLoaded((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  // Auto-advance, paused while the tab is hidden and disabled entirely for
  // reduced-motion users.
  useEffect(() => {
    if (slides.length < 2 || reducedMotion) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer) return;
      timer = setInterval(() => setActiveIndex((i) => (i + 1) % slides.length), HERO_SLIDE_DURATION_MS);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [slides.length, reducedMotion]);

  if (slides.length === 0) return null;

  const active = slides[Math.min(activeIndex, slides.length - 1)];

  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Photos, stacked and crossfaded */}
      {slides.map((slide) => (
        <motion.div
          key={slide.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: slide.id === active.id ? 1 : 0 }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
          style={{ pointerEvents: "none" }}
        >
          <motion.img
            src={slide.image}
            alt=""
            loading="eager"
            onLoad={() => markLoaded(slide.id)}
            className="absolute inset-0 h-full w-full object-cover"
            initial={false}
            animate={reducedMotion ? { scale: 1 } : { scale: 1.08 }}
            transition={{ duration: HERO_SLIDE_DURATION_MS / 1000 + 4, ease: "linear" }}
          />
        </motion.div>
      ))}

      {/* Readability overlays — heavier on the text side, heavier again on mobile.
          Light theme uses a white scrim so dark hero text stays readable. */}
      {isLight ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-white/55" />
          <div className="absolute inset-0 bg-white/35 md:bg-white/20" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/55" />
          <div className="absolute inset-0 bg-black/25 md:bg-black/10" />
        </>
      )}

      {/* Subtle location caption */}
      <div className="pointer-events-none absolute bottom-4 md:bottom-10 left-4 right-4 md:left-8 md:right-auto z-10 flex items-center justify-center md:justify-start gap-2">
        <AnimatePresence mode="wait">
          <motion.p
            key={active.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.6 }}
            className={`inline-flex items-center gap-2 text-[10px] md:text-[11px] uppercase tracking-[0.12em] md:tracking-[0.18em] text-center ${isLight ? "text-muted-foreground" : "text-white/65"}`}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            {slideCaption(active)}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default HeroBackgroundSlideshow;
