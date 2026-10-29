import { useState, useEffect, useRef } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Volume2, VolumeX, Mail } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BOOKING_PAGE_URL } from "@/lib/bookingConfig";
import { WORKFLOWS } from "@/data/workflows";
import UseCaseJourney from "@/components/products/UseCaseJourney";
import TechStackMarquee from "@/components/products/TechStackMarquee";
import UseCaseGallery from "@/components/products/UseCaseGallery";
import UseCaseMetrics from "@/components/products/UseCaseMetrics";
import UseCaseSummary from "@/components/products/UseCaseSummary";
import { getUseCaseBySlug } from "@/data/useCases";

type HeroVideo = NonNullable<ReturnType<typeof getUseCaseBySlug>>["heroVideo"];

// Load the YouTube IFrame API script once.
let youtubeApiPromise: Promise<typeof window.YT> | null = null;
const loadYouTubeApi = () => {
  if (youtubeApiPromise) return youtubeApiPromise;
  if (typeof window === "undefined") return Promise.reject("No window");
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);

  youtubeApiPromise = new Promise((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    const originalCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      originalCallback?.();
      resolve(window.YT);
    };
  });
  return youtubeApiPromise;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        container: string | HTMLElement,
        options: {
          videoId?: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }

  interface YTPlayer {
    playVideo: () => void;
    pauseVideo: () => void;
    mute: () => void;
    unMute: () => void;
    setVolume: (volume: number) => void;
    destroy: () => void;
    getPlayerState: () => number;
  }
}

const HeroVideoPlayer = ({ heroVideo }: { heroVideo: HeroVideo }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const playerRef = useRef<YTPlayer | null>(null);
  const containerId = useRef(`yt-player-${Math.random().toString(36).slice(2, 9)}`).current;
  const activeIndexRef = useRef(activeIndex);
  const mountedRef = useRef(true);
  const [isMuted, setIsMuted] = useState(true);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    mountedRef.current = true;
    let player: YTPlayer | null = null;

    const init = async () => {
      const YT = await loadYouTubeApi();
      if (!mountedRef.current) return;

      const videoId = extractVideoId(heroVideo.videos[activeIndexRef.current].src);
      if (!videoId) return;

      player = new YT.Player(containerId, {
        videoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          cc_load_policy: 0,
          cc_lang_pref: "none",
        },
        events: {
          onReady: (event) => {
            if (isMutedRef.current) {
              event.target.mute();
            } else {
              event.target.unMute();
              event.target.setVolume(100);
            }
            event.target.playVideo();
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.ENDED) {
              const nextIndex = (activeIndexRef.current + 1) % heroVideo.videos.length;
              setActiveIndex(nextIndex);
            }
          },
        },
      });

      playerRef.current = player;
    };

    init();

    return () => {
      mountedRef.current = false;
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [activeIndex, containerId, heroVideo.videos.length]);

  const hasMultiple = heroVideo.videos.length > 1;

  const goTo = (index: number) => {
    const count = heroVideo.videos.length;
    setActiveIndex(((index % count) + count) % count);
  };

  const toggleMute = () => {
    const player = playerRef.current;
    setIsMuted((prev) => {
      const next = !prev;
      if (player) {
        if (next) {
          player.mute();
        } else {
          player.unMute();
          player.setVolume(100);
        }
      }
      return next;
    });
  };

  return (
    <div className="relative">
      <div className="relative rounded-[28px] p-1.5 bg-gradient-to-br from-primary/20 via-border to-transparent shadow-elevation-3">
        <div className="relative rounded-[22px] overflow-hidden bg-black">
          <div className="relative aspect-[9/16] max-h-[520px] mx-auto">
            <div id={containerId} className="w-full h-full" />
          </div>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={() => goTo(activeIndex - 1)}
                aria-label="Previous video"
                className="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center h-10 w-10 rounded-full bg-background/80 backdrop-blur border border-border text-foreground shadow-elevation-2 transition-transform hover:scale-105 active:scale-95"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => goTo(activeIndex + 1)}
                aria-label="Next video"
                className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center h-10 w-10 rounded-full bg-background/80 backdrop-blur border border-border text-foreground shadow-elevation-2 transition-transform hover:scale-105 active:scale-95"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute video" : "Mute video"}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur border border-border px-3 py-2 text-xs font-medium text-foreground shadow-elevation-2 transition-transform hover:scale-105 active:scale-95"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {isMuted ? "Tap for sound" : "Sound on"}
          </button>
        </div>
      </div>

      {hasMultiple && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {heroVideo.videos.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to video ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === activeIndex
                  ? "w-6 bg-primary"
                  : "w-2 bg-border hover:bg-foreground/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const extractVideoId = (embedUrl: string) => {
  const match = embedUrl.match(/embed\/([^?]+)/);
  return match ? match[1] : null;
};

const UseCaseDetail = () => {
  const { useCaseId } = useParams();
  const useCase = getUseCaseBySlug(useCaseId);

  // Fallback: unknown slug → send back to the use-cases index (never dead-end)
  if (!useCase) {
    return <Navigate to="/products/use-cases" replace />;
  }

  const Icon = useCase.icon;
  const path = `/products/use-cases/${useCase.slug}`;
  // The six current workflows, minus the one being viewed.
  const others = WORKFLOWS.filter((w) => w.href !== path);
  const reportHref = `mailto:hello@alfredai.bot?subject=${encodeURIComponent(`Problem on ${useCase.shortTitle} page`)}&body=${encodeURIComponent(`Page: ${typeof window !== "undefined" ? window.location.href : path}\n\nWhat went wrong (attach a screenshot if you can):\n`)}`;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${useCase.title} — AI Agent Use Case | alfred ai`}
        description={useCase.summary}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Products", url: "/products" },
          { name: "Use Cases", url: "/products/use-cases" },
          { name: useCase.shortTitle, url: `/products/use-cases/${useCase.slug}` },
        ]}
      />
      <Header />

      <main>
        {/* Hero */}
        <section className="pt-20 pb-12 md:pt-24 md:pb-16 bg-background border-b border-border">
          <div className="container-wide">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl border border-border bg-muted flex items-center justify-center">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Workflow · <span className="text-primary">{useCase.layers.join(" + ")}</span>
                  </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-5 leading-[1.05] tracking-tight">
                  {useCase.title}
                </h1>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{useCase.summary}</p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <a href={BOOKING_PAGE_URL} className="inline-flex items-center justify-center gap-2 min-h-touch px-6 rounded-full bg-cta text-cta-foreground font-medium hover:opacity-90 transition-opacity">
                    Book a demo <ArrowRight className="w-4 h-4" />
                  </a>
                  <Link to="/products/use-cases" className="inline-flex items-center justify-center min-h-touch px-6 rounded-full border border-border text-foreground font-medium hover:bg-muted transition-colors">
                    See all workflows
                  </Link>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.15 }} className="relative">
                {useCase.heroVideo ? (
                  <HeroVideoPlayer heroVideo={useCase.heroVideo} />
                ) : (
                  <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-elevation-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-5">How it runs</p>
                    <ol className="space-y-2.5">
                      {useCase.stages.map((st) => (
                        <li key={st.n} className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full border border-border text-xs font-semibold flex items-center justify-center text-foreground flex-shrink-0">{st.n}</span>
                          <span className="text-sm font-medium text-foreground flex-1">{st.title}</span>
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${st.actor === "agent" ? "text-primary" : "text-muted-foreground"}`}>
                            {st.actor === "agent" ? "Agent" : "Your team"}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Before and after */}
        {useCase.metrics && useCase.metrics.length > 0 && (
          <section className="py-10 md:py-14 bg-muted/30 border-y border-border">
            <div className="container-wide">
              <UseCaseMetrics useCase={useCase} />
            </div>
          </section>
        )}

        {/* Sample outputs gallery */}
        {useCase.gallery && useCase.gallery.length > 0 && (
          <section className="py-10 md:py-14 bg-background">
            <div className="container-wide">
              <UseCaseGallery items={useCase.gallery} />
            </div>
          </section>
        )}

        {/* Problem / Goal / Persona / Solution */}
        <section className="py-10 md:py-14 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <UseCaseSummary useCase={useCase} />
          </div>
        </section>

        {/* Steps */}
        <section className="py-10 md:py-14 bg-background">
          <div className="container-wide">
            {useCase.slug === "marketing-content-production" && <TechStackMarquee />}
            <UseCaseJourney useCase={useCase} />
          </div>
        </section>

        {/* More workflows */}
        <section className="py-14 md:py-20 bg-muted/30 border-t border-border">
          <div className="container-wide">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-2">More workflows we run for you</h2>
            <p className="text-sm md:text-base text-muted-foreground mb-8">The rest of the workflows, done for you and trained on your documents.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((w) => {
                const WIcon = w.icon;
                return (
                  <Link
                    key={w.href}
                    to={w.href}
                    className={`group rounded-2xl bg-card p-6 flex flex-col gap-4 transition-all hover:shadow-elevation-3 ${w.flagship ? "border-2 border-foreground" : "border border-border hover:border-foreground/30"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center">
                        <WIcon className="w-5 h-5 text-foreground" />
                      </div>
                      {w.flagship && <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Flagship AI agent</span>}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-foreground mb-1.5">{w.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{w.summary}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground min-h-touch">
                      {w.cta} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-14 md:py-20 bg-background">
          <div className="container-wide">
            <div className="rounded-3xl bg-foreground text-background p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">For Demo, Pricing and Customisation</h2>
                <p className="mt-2 opacity-70 text-sm md:text-base">See how {useCase.shortTitle} runs on your documents and systems.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={BOOKING_PAGE_URL} className="inline-flex items-center justify-center gap-2 min-h-touch px-6 rounded-full bg-background text-foreground font-medium hover:opacity-90 transition-opacity">
                  Book a demo <ArrowRight className="w-4 h-4" />
                </a>
                <a href={reportHref} className="inline-flex items-center justify-center gap-2 min-h-touch px-6 rounded-full border border-background/30 font-medium hover:bg-background/10 transition-colors">
                  <Mail className="w-4 h-4" /> Report an issue
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default UseCaseDetail;
