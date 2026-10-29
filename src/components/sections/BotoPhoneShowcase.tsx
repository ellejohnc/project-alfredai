import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Gauge,
  FileSearch,
  UserSearch,
  ScanLine,
  PenLine,
  Send,
  ListChecks,
  Layers3,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import shotResearch1 from "@/assets/boto/boto-research-1.png.asset.json";
import shotResearch2 from "@/assets/boto/boto-research-2.png.asset.json";
import shotMatchmaking from "@/assets/boto/boto-matchmaking.png.asset.json";
import shotCompanyDetail from "@/assets/boto/boto-company-detail.png.asset.json";
import shotCardScan from "@/assets/boto/boto-card-scan.png.asset.json";
import shotOutreach from "@/assets/boto/boto-outreach.png.asset.json";
import shotSendIntro from "@/assets/boto/boto-send-intro.png.asset.json";
import shotCampaignDraft from "@/assets/boto/boto-campaign-draft.png.asset.json";
import shotCampaignGroup from "@/assets/boto/boto-campaign-group.png.asset.json";
import shotCampaignOverview from "@/assets/boto/boto-campaign-overview.png.asset.json";

type Step = {
  asset: { url: string };
  icon: typeof Compass;
  phase: string;
  title: string;
  instruction: string;
};

// Logical CRM journey: discover → qualify → research → contact → campaign → track
const steps: Step[] = [
  { asset: shotMatchmaking, icon: Compass, phase: "Discover", title: "Daily matchmaking feed", instruction: "Open the app to a fresh feed of high-fit leads, scored for you overnight." },
  { asset: shotCompanyDetail, icon: Gauge, phase: "Qualify", title: "Match insight & fit score", instruction: "Tap any match to see why it fits — signals, timing and a clear fit score." },
  { asset: shotResearch1, icon: FileSearch, phase: "Research", title: "Company research briefing", instruction: "Get funding, hiring and growth signals summarised in seconds." },
  { asset: shotResearch2, icon: UserSearch, phase: "Research", title: "Find the decision-makers", instruction: "BOTO surfaces the right people to reach — with verified contact details." },
  { asset: shotCardScan, icon: ScanLine, phase: "Capture", title: "Scan a business card", instruction: "Met someone in person? Snap their card straight into your pipeline." },
  { asset: shotOutreach, icon: PenLine, phase: "Contact", title: "AI-drafted outreach", instruction: "A personalised intro is written for you from real signals — not a template." },
  { asset: shotSendIntro, icon: Send, phase: "Contact", title: "Send across SMS & email", instruction: "Review, tweak the tone, and send by SMS and email in one tap." },
  { asset: shotCampaignDraft, icon: ListChecks, phase: "Campaign", title: "Draft a sequence", instruction: "Turn your saved list into a multi-step campaign BOTO sequences for you." },
  { asset: shotCampaignGroup, icon: Layers3, phase: "Campaign", title: "Grouped, tailored emails", instruction: "Each segment gets its own message, ready to review before launch." },
  { asset: shotCampaignOverview, icon: Activity, phase: "Track", title: "Watch it land", instruction: "Track contacts, replies and booked meetings as the campaign runs." },
];

const AUTOPLAY_MS = 3800;

const BotoPhoneShowcase = () => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dir, setDir] = useState(1);
  const timerRef = useRef<number | null>(null);

  const goTo = useCallback((next: number) => {
    setDir(next > index ? 1 : -1);
    setIndex((next + steps.length) % steps.length);
  }, [index]);

  const advance = useCallback((delta: number) => {
    setDir(delta);
    setIndex((prev) => (prev + delta + steps.length) % steps.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    timerRef.current = window.setTimeout(() => {
      setDir(1);
      setIndex((prev) => (prev + 1) % steps.length);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [index, paused]);

  const active = steps[index];

  return (
    <div className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-center">
      {/* Left: copy + step list */}
      <div className="order-2 lg:order-1">
        <h3 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-4">
          The whole sales hunt, on one screen
        </h3>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-7 max-w-md">
          Watch the daily BOTO workflow flow from discovering a lead to landing the meeting —
          every step guided, scored and drafted for you.
        </p>

        <ol className="space-y-1.5">
          {steps.map((s, i) => {
            const isActive = i === index;
            const Icon = s.icon;
            return (
              <li key={s.title}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors min-h-[44px] ${
                    isActive ? "bg-primary/10" : "hover:bg-muted/60"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-[10px] font-semibold uppercase tracking-wider ${
                        isActive ? "text-primary" : "text-muted-foreground/70"
                      }`}
                    >
                      {s.phase}
                    </span>
                    <span
                      className={`block text-sm font-medium truncate ${
                        isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {s.title}
                    </span>
                  </span>
                  {isActive && (
                    <motion.span
                      layoutId="boto-step-progress"
                      className="h-1.5 w-1.5 rounded-full bg-primary"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Right: animated phone */}
      <div className="order-1 lg:order-2 flex flex-col items-center">
        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
        >
          {/* Glow vignette */}
          <div className="absolute inset-0 -z-10 scale-110 rounded-[3rem] bg-gradient-to-b from-primary/15 via-transparent to-transparent blur-2xl" />

          {/* iPhone frame */}
          <div className="relative w-[260px] sm:w-[300px] rounded-[3rem] border-[3px] border-foreground/15 bg-foreground/90 p-3 shadow-2xl">
            {/* Side buttons */}
            <span className="absolute -left-[5px] top-24 h-12 w-[3px] rounded-full bg-foreground/30" />
            <span className="absolute -left-[5px] top-40 h-12 w-[3px] rounded-full bg-foreground/30" />
            <span className="absolute -right-[5px] top-32 h-16 w-[3px] rounded-full bg-foreground/30" />

            <div className="relative overflow-hidden rounded-[2.3rem] bg-white aspect-[9/19.5]">
              {/* Notch */}
              <div className="absolute left-1/2 top-2 z-20 h-6 w-28 -translate-x-1/2 rounded-full bg-foreground/90" />

              <AnimatePresence initial={false} custom={dir} mode="popLayout">
                <motion.img
                  key={index}
                  src={active.asset.url}
                  alt={active.title}
                  custom={dir}
                  variants={{
                    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0.4 }),
                    center: { x: 0, opacity: 1 },
                    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0.4 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 260, damping: 30 }}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                  draggable={false}
                />
              </AnimatePresence>

              {/* Instruction overlay */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-foreground/85 via-foreground/45 to-transparent p-4 pt-12">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.35 }}
                  >
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                      <active.icon className="h-3 w-3" />
                      {active.phase}
                    </span>
                    <p className="mt-2 text-[13px] font-medium leading-snug text-white">
                      {active.instruction}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => advance(-1)}
            aria-label="Previous step"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to step ${i + 1}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-5 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => advance(1)}
            aria-label="Next step"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BotoPhoneShowcase;
