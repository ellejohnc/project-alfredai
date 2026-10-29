import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Smartphone,
  Sparkles,
  ScanLine,
  MapPin,
  Target,
  UserSearch,
  Gauge,
  Layers3,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import carousel1 from "@/assets/boto/carousel/boto-carousel-1.jpg.asset.json";
import carousel3 from "@/assets/boto/carousel/boto-carousel-3.jpg.asset.json";
import carousel4 from "@/assets/boto/carousel/boto-carousel-4.jpg.asset.json";
import carousel5 from "@/assets/boto/carousel/boto-carousel-5.jpg.asset.json";
import carousel6 from "@/assets/boto/carousel/boto-carousel-6.jpg.asset.json";
import appStoreBadge from "@/assets/boto/app-store-badge.png.asset.json";
import googlePlayBadge from "@/assets/boto/google-play-badge.png.asset.json";
import BotoPhoneShowcase from "@/components/sections/BotoPhoneShowcase";

const BOTO_APP_STORE_URL = "https://apps.apple.com/us/app/alfred-ai/id6755116821";



const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

const capabilities = [
  {
    icon: Target,
    title: "AI lead matching",
    description: "Finds businesses and people that fit your target market — automatically, every day.",
  },
  {
    icon: UserSearch,
    title: "Decision-maker discovery",
    description: "Surfaces the right contacts with email and mobile where available.",
  },
  {
    icon: Gauge,
    title: "AI lead scoring",
    description: "Ranks every lead by fit and potential value so you act on the best first.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first workflow",
    description: "Built around daily business-development activity from your phone.",
  },
  {
    icon: ScanLine,
    title: "Business card scan",
    description: "Turns offline networking into clean CRM records in seconds.",
  },
  {
    icon: MapPin,
    title: "Near-me scan",
    description: "Finds nearby potential customers and partners while you're on the move.",
  },
  {
    icon: Sparkles,
    title: "Daily lead feed",
    description: "Proactive suggestions instead of waiting for manual searches.",
  },
  {
    icon: Layers3,
    title: "Contact enrichment",
    description: "Builds richer profiles from limited information.",
  },
  {
    icon: Mail,
    title: "CRM connection",
    description: "Connects into HubSpot, Salesforce, GHL, Salesflare and more.",
  },
];

const screens = [
  { asset: carousel1, caption: "Instant card capture — scan a card and your greeting goes out before you leave the room." },
  { asset: carousel3, caption: "AI matchmaking — a daily feed of high-fit opportunities that gets sharper every swipe." },
  { asset: carousel4, caption: "Lead research — funding, hiring and decision-makers in seconds." },
  { asset: carousel5, caption: "Batch outreach — turn your saved list into a personalised campaign." },
  { asset: carousel6, caption: "Campaign tracking — watch contacts, replies and meetings land." },
];


const BotoShowcaseSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const goTo = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const clamped = Math.max(0, Math.min(index, screens.length - 1));
    const child = container.children[clamped] as HTMLElement | undefined;
    if (!child) return;
    container.scrollTo({
      left: child.offsetLeft - (container.clientWidth - child.clientWidth) / 2,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    let frame: number;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const center = container.scrollLeft + container.clientWidth / 2;
        let closest = 0;
        let closestDist = Infinity;
        Array.from(container.children).forEach((node, i) => {
          const el = node as HTMLElement;
          const elCenter = el.offsetLeft + el.clientWidth / 2;
          const dist = Math.abs(elCenter - center);
          if (dist < closestDist) {
            closestDist = dist;
            closest = i;
          }
        });
        setActive(closest);
      });
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section className="py-14 md:py-20 bg-background border-y border-border overflow-hidden">
      <div className="container-wide">
        {/* Header */}
        <motion.div {...fadeUp} className="max-w-3xl mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-border bg-card/70 backdrop-blur-sm px-3.5 py-1.5">
            <Smartphone className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
              BOTO · iOS app
            </span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight mb-4 font-product">
            BOTO — Butler-On-The-gO
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            An AI-powered mobile CRM that helps sales teams discover, qualify and contact the
            right business leads faster — with daily proactive lead matching and decision-maker
            intelligence. Less heavy admin system, more daily sales hunting app.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <a
              href={BOTO_APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download BOTO on the App Store"
              className="inline-block transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
            >
              <img
                src={appStoreBadge.url}
                alt="Download on the App Store"
                className="h-14 w-auto"
              />
            </a>

            <div className="relative inline-block opacity-70 grayscale">
              <img
                src={googlePlayBadge.url}
                alt="Get it on Google Play"
                className="h-14 w-auto"
              />
              <span className="absolute -top-2 -right-2 rounded-full bg-muted-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background shadow-sm">
                Soon
              </span>
            </div>
          </div>
        </motion.div>

        {/* Phone screenshot carousel */}
        <motion.div {...fadeUp} className="mb-12 md:mb-16 relative">
          <div
            ref={scrollRef}
            className="flex gap-5 md:gap-7 overflow-x-auto pb-5 -mx-4 px-4 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {screens.map((s, i) => (
              <figure
                key={i}
                className="snap-center shrink-0 w-[320px] sm:w-[480px] md:w-[560px]"
              >
                <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
                  <img
                    src={s.asset.url}
                    alt={s.caption}
                    loading="lazy"
                    className="w-full h-auto object-contain"
                  />
                </div>
                <figcaption className="text-xs text-muted-foreground leading-relaxed mt-3 px-1">
                  {s.caption}
                </figcaption>
              </figure>
            ))}
          </div>

          {/* Desktop prev/next controls */}
          <button
            type="button"
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
            aria-label="Previous slide"
            className="hidden md:flex absolute left-2 top-[42%] -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full border border-border bg-card/90 backdrop-blur-sm text-foreground shadow-sm transition-opacity hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => goTo(active + 1)}
            disabled={active === screens.length - 1}
            aria-label="Next slide"
            className="hidden md:flex absolute right-2 top-[42%] -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full border border-border bg-card/90 backdrop-blur-sm text-foreground shadow-sm transition-opacity hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Slide dots */}
          <div className="hidden md:flex items-center justify-center gap-2.5 mt-2">
            {screens.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={active === i}
                className={`h-2.5 rounded-full transition-all ${
                  active === i
                    ? "w-7 bg-primary"
                    : "w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>

          <p className="text-xs text-muted-foreground/70 mt-1 px-1 md:hidden">
            Swipe to explore the app →
          </p>
        </motion.div>

        {/* Animated phone walkthrough */}
        <motion.div {...fadeUp} className="mb-12 md:mb-16">
          <BotoPhoneShowcase />
        </motion.div>





        {/* Capabilities grid */}
        <motion.div {...fadeUp} className="max-w-2xl mb-8">
          <h3 className="text-xl md:text-2xl font-bold text-foreground tracking-tight mb-3">
            What BOTO does for your sales team
          </h3>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            An AI business-development assistant that keeps feeding you relevant opportunities —
            instead of waiting for you to enter data.
          </p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilities.map((c) => (
            <motion.div
              key={c.title}
              {...fadeUp}
              className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <c.icon className="w-5 h-5 text-primary" />
              </div>
              <h4 className="text-base font-bold text-foreground mb-2">{c.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BotoShowcaseSection;
