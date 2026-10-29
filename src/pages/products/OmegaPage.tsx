import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Users,
  BrainCircuit,
  Network,
  History,
  Eye,
  Gauge,
  MessageSquare,
  ScrollText,
  Maximize,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { productSchemaFor } from "@/lib/productSchema";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GHLBookingModal } from "@/components/GHLBookingWidget";
import { OmegaIcon } from "@/components/icons/OmegaIcon";
import OmegaDemoPortal from "@/components/products/OmegaDemoPortal";
import OmegaTraceTimeline from "@/components/products/OmegaTraceTimeline";
import omegaScreenshot from "@/assets/products/omega-screenshot.png.asset.json";
import omegaDemoVideo from "@/assets/products/omega-demo.mp4.asset.json";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

// ─────────────────────────────────────────────────────────────────────
// Feldman narrative — the two foundational bets that started Omega.
// ─────────────────────────────────────────────────────────────────────
const twoBets = [
  {
    n: "Bet 01",
    title: "The most dangerous thing missing isn't AI. It's memory.",
    body:
      "Decisions are being made every day by people who cannot see the full picture of what their organisation knows, what it has already decided, and why. Adding another chat tool doesn't fix that. It makes it worse.",
  },
  {
    n: "Bet 02",
    title: "You can't bolt memory onto a chat window.",
    body:
      "Fixing this could not be an incremental approach. Not a better search bar. Not a smarter inbox. It had to begin with a clean sheet — a system designed from day one to hold the reasoning behind every decision your company makes.",
  },
];

// The Impossible Wall — what nobody had solved before Omega.
const impossibleWall = [
  "A system where AI could answer a question and show you the exact node in your knowledge graph that justified the answer.",
  "A provenance layer where every AI output carries a citation back to a source your team actually trusts.",
  "A view a CEO could open on Monday morning — a visual map of every active decision in the business — and see at a glance which ones are backed by evidence and which are floating on assumption.",
];

// The Methodology — how Omega was built (first principles → graph → accountability).
const methodology = [
  {
    n: "01",
    title: "We started from first principles.",
    body:
      "What does a decision actually need to be good? Evidence. Context. Precedent. A clear chain of reasoning. Nothing else.",
  },
  {
    n: "02",
    title: "We modelled that as a graph.",
    body:
      "Every node is a piece of knowledge, a decision, an SOP, or a piece of evidence. Every edge is a relationship — this decision depends on this knowledge, this SOP was distilled from this evidence.",
  },
  {
    n: "03",
    title: "The AI navigates the graph. It does not invent.",
    body:
      "Answers are assembled from retrieved, reranked evidence — not generated from memory. If Omega cites a node, that node exists, and you can click it.",
  },
  {
    n: "04",
    title: "Every mutation returns to you for approval.",
    body:
      "The AI proposes; the evidence qualifies; you decide. We call this the accountability layer. It is what separates Omega from every AI tool that produces confident-sounding output with no audit trail.",
  },
];

const capabilities = [
  {
    icon: History,
    name: "Traceable decisions",
    body: "Click any decision and see everything that shaped it, in order, with dates.",
  },
  {
    icon: ScrollText,
    name: "Decision timeline",
    body: "Scrub back to any moment and see exactly what the company knew then.",
  },
  {
    icon: BrainCircuit,
    name: "The Orb",
    body: "Your knowledge as a sphere: daily execution at the surface, doctrine beneath, source of truth at the core.",
  },
  {
    icon: Gauge,
    name: "Impact lens",
    body: "Size everything by what matters: money, time, compliance, ESG, or KPI.",
  },
  {
    icon: Users,
    name: "Role-based views",
    body: "Seventeen seats, from Chairman to Site Manager. Same truth, each person's perspective. Confidential layers stay confidential.",
  },
  {
    icon: MessageSquare,
    name: "Omega Console",
    body: "Ask in plain language. Navigate, generate documents, build workflows, propose changes. Every answer cited. Every change approved by you.",
  },
  {
    icon: ShieldCheck,
    name: "Trust Score",
    body: "A live measure of the brain's health, decomposable to the exact items that need attention.",
  },
];

const omegaIngestSources = [
  "Email threads",
  "Slack / Teams channels",
  "Meeting transcripts",
  "Procore / Aconex records",
  "SharePoint / Google Drive documents",
  "RFIs and site records",
  "Manual entry",
];

const OmegaPage = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingTitle, setBookingTitle] = useState("Book a demo");
  const videoRef = useRef<HTMLDivElement | null>(null);
  const demoVideoRef = useRef<HTMLVideoElement | null>(null);

  const openBooking = (title: string) => {
    setBookingTitle(title);
    setIsBookingOpen(true);
  };

  const scrollToVideo = () => {
    videoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleFullscreen = () => {
    const video = demoVideoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      video.requestFullscreen?.().catch(() => {
        video.parentElement?.requestFullscreen?.();
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Omega (Ω) | Your Company's Mind. On the Record. — alfred ai"
        description="Omega is the organisational brain inside alfred ai. It captures what your business knows, links every decision to its evidence, and hands the whole company — intact — to whoever needs it next."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Products", url: "/products" },
          { name: "Omega", url: "/products/omega" },
        ]}
        product={productSchemaFor("omega")}
      />
      <Header />

      <main>
        {/* ===================== HERO — The opening promise ===================== */}
        <section className="relative flex items-center min-h-[92vh] pt-32 pb-16 md:pt-40 md:pb-28 bg-background overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage: "radial-gradient(ellipse at 65% 40%, black, transparent 75%)",
            }}
          />

          <div className="container-wide relative">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/products">Products</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Omega</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 items-center">
              <motion.div {...fadeUp} className="max-w-3xl">
                <div className="inline-flex items-center gap-2 mb-6 rounded-full border border-border bg-card/70 backdrop-blur-sm px-3.5 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
                    On the record
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <OmegaIcon className="w-12 h-12 text-foreground" />
                  <h1 className="text-4xl md:text-6xl font-black text-foreground leading-[1.05] tracking-tight font-product">
                    Omega<span className="sr-only"> — the AI record and memory layer for your company</span>
                  </h1>
                </div>

                <p className="text-xl md:text-2xl font-semibold text-foreground mb-4 leading-snug">
                  Your company's mind.{" "}
                  <span className="text-primary">On the record.</span>
                </p>

                <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                  Omega is the organisational brain inside alfred ai. It captures what your business knows,
                  links every decision to its evidence, and hands the whole company — intact — to whoever
                  needs it next.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                  <Button
                    variant="cta"
                    size="lg"
                    onClick={() => openBooking("Book a demo")}
                    className="min-h-touch"
                  >
                    Book a demo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    variant="cta-outline"
                    size="lg"
                    onClick={scrollToVideo}
                    className="min-h-touch"
                  >
                    See the brain live
                  </Button>
                </div>
              </motion.div>

              {/* The Orb */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="relative mx-auto"
              >
                <div className="relative w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] md:w-[440px] md:h-[440px]">
                  <div
                    className="absolute inset-0 rounded-full blur-2xl opacity-40"
                    style={{ background: "radial-gradient(circle at 50% 50%, hsl(var(--primary)) 0%, transparent 60%)" }}
                  />
                  <motion.div
                    aria-hidden="true"
                    className="absolute inset-0"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, ease: "linear", repeat: Infinity }}
                  >
                    {[0.98, 0.82, 0.66, 0.5].map((scale, idx) => (
                      <div
                        key={idx}
                        className="absolute left-1/2 top-1/2 rounded-full border border-primary/30"
                        style={{
                          width: `${scale * 100}%`,
                          height: `${scale * 100}%`,
                          transform: "translate(-50%, -50%)",
                          borderStyle: idx === 0 ? "dashed" : "solid",
                        }}
                      />
                    ))}
                  </motion.div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 120, ease: "linear", repeat: Infinity }}
                    >
                      <OmegaIcon className="w-24 h-24 md:w-32 md:h-32 text-primary" />
                    </motion.div>
                  </div>
                  <div className="absolute inset-0 pointer-events-none text-[10px] md:text-[11px] uppercase tracking-wider text-muted-foreground">
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3">Execution edge</span>
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 hidden sm:block">Evidence</span>
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-3">Knowledge & decisions</span>
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 hidden sm:block">Doctrine</span>
                  </div>
                </div>
                <p className="text-center text-[11px] uppercase tracking-wider text-muted-foreground mt-4">
                  The Orb — surface to source of truth
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ===================== LIVE DEMO PORTAL ===================== */}
        <OmegaDemoPortal />

        {/* ===================== MOVE 1 — THE TWO BETS ===================== */}
        <section className="py-16 md:py-24 bg-background border-t border-border">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-3xl mb-12">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Move 01 · The two bets
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mt-3 leading-[1.1]">
                Everything Omega is began with two decisions.
              </h2>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-5 md:gap-6">
              {twoBets.map((bet) => (
                <motion.div
                  key={bet.n}
                  {...fadeUp}
                  className="rounded-2xl border border-border bg-card p-7 md:p-9 hover:border-primary/40 transition-colors"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                    {bet.n}
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mt-3 mb-4 leading-snug">
                    {bet.title}
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{bet.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== MOVE 2 — THE PHYSICS ARGUMENT ===================== */}
        <section className="py-20 md:py-32 bg-muted/30 border-y border-border">
          <div className="container-wide max-w-4xl">
            <motion.div {...fadeUp}>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Move 02 · The irreducible constraint
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mt-3 mb-8 leading-[1.1]">
                Every organisation has the same underlying problem — regardless of industry.
              </h2>

              <div className="space-y-6 text-lg md:text-xl leading-relaxed">
                <p className="text-muted-foreground">
                  Decisions are a sequencing problem. The quality of a decision is bounded by the quality
                  of the knowledge that informs it. And the quality of knowledge is bounded by how fast it
                  can be retrieved, connected, and acted on.
                </p>
                <p className="text-muted-foreground">
                  Most organisations today have knowledge scattered across emails, documents, meetings, and
                  the heads of people who may leave tomorrow.
                </p>
                <p className="text-2xl md:text-3xl font-bold text-foreground leading-snug pt-2">
                  The bottleneck is not intelligence.{" "}
                  <span className="text-primary">The bottleneck is connection.</span>
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ===================== MOVE 3 — THE LOGICAL CONCLUSION ===================== */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container-wide max-w-4xl">
            <motion.div {...fadeUp}>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Move 03 · The only possible answer
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mt-3 mb-8 leading-[1.1]">
                The fastest way to improve decision quality is to{" "}
                <span className="text-primary">never lose context.</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6">
                Every decision your organisation makes should be traceable — to the evidence that justified
                it, the knowledge that shaped it, the SOP that governed it, and the strategy it was meant
                to serve.
              </p>
              <p className="text-lg md:text-xl text-foreground font-semibold leading-relaxed">
                This is why we built Omega.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ===================== MOVE 4 — THE IMPOSSIBLE WALL ===================== */}
        <section className="py-20 md:py-28 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-3xl mb-12">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Move 04 · The impossible wall
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mt-3 leading-[1.1]">
                The list of things that didn't exist was long.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mt-5">
                Before Omega, nobody had built any of this. We know because we looked.
              </p>
            </motion.div>

            <ol className="space-y-4 md:space-y-5 max-w-4xl">
              {impossibleWall.map((item, i) => (
                <motion.li
                  key={i}
                  {...fadeUp}
                  className="flex gap-5 md:gap-7 rounded-2xl border border-border bg-card p-6 md:p-7"
                >
                  <span className="shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base md:text-lg">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-base md:text-lg text-foreground leading-relaxed pt-1.5">
                    Nobody had built {item}
                  </p>
                </motion.li>
              ))}
            </ol>

            <motion.p
              {...fadeUp}
              className="mt-10 text-xl md:text-2xl font-semibold text-foreground text-center"
            >
              We built them.
            </motion.p>
          </div>
        </section>

        {/* ===================== SEE IT LIVE — trace timeline + video ===================== */}
        <section ref={videoRef} className="py-16 md:py-24 bg-background">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-3xl mb-10">
              <div className="inline-flex items-center gap-2 mb-4 rounded-full border border-border bg-card/70 backdrop-blur-sm px-3 py-1.5">
                <Eye className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
                  Omega Console · live walkthrough
                </span>
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight mb-3">
                Everything is traceable.{" "}
                <span className="text-primary">Every email. Every decision. Every KPI.</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Watch a single client email travel through the brain — gathering evidence, becoming a
                decision, and surfacing months later as a KPI you can click and replay.
              </p>
            </motion.div>

            <motion.div {...fadeUp} className="mb-10">
              <OmegaTraceTimeline />
            </motion.div>

            <motion.div
              {...fadeUp}
              className="relative rounded-2xl overflow-hidden border border-border shadow-elevation-3 bg-card group"
            >
              <video
                ref={demoVideoRef}
                src={omegaDemoVideo.url}
                poster={omegaScreenshot.url}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                disablePictureInPicture
                disableRemotePlayback
                onContextMenu={(e) => e.preventDefault()}
                className="w-full h-auto block"
              />
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label="View video fullscreen"
                className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-md bg-background/80 backdrop-blur-sm px-2.5 py-1.5 text-xs font-medium text-foreground opacity-0 transition-opacity duration-200 hover:bg-background group-hover:opacity-100 focus:opacity-100"
              >
                <Maximize className="w-3.5 h-3.5" />
                Fullscreen
              </button>
            </motion.div>
          </div>
        </section>

        {/* ===================== MOVE 5 — THE METHODOLOGY ===================== */}
        <section className="py-20 md:py-28 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-3xl mb-12">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Move 05 · The disciplined system
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mt-3 leading-[1.1]">
                How we built it — and why it holds up under audit.
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-5 md:gap-6">
              {methodology.map((s) => (
                <motion.div
                  key={s.n}
                  {...fadeUp}
                  className="rounded-2xl border border-border bg-card p-7 md:p-8 hover:border-primary/40 transition-colors"
                >
                  <span className="text-4xl font-black leading-none text-primary/80">{s.n}</span>
                  <h3 className="text-xl font-bold text-foreground mt-4 mb-3 leading-snug">
                    {s.title}
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{s.body}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              {...fadeUp}
              className="mt-10 rounded-2xl border-l-4 border-primary bg-card p-6 md:p-8 max-w-4xl"
            >
              <p className="text-lg md:text-xl text-foreground leading-relaxed">
                We call this the{" "}
                <span className="font-bold text-primary">accountability layer.</span>{" "}
                It is what separates Omega from every AI tool that produces confident-sounding output with
                no audit trail.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ===================== WHAT OMEGA INGESTS ===================== */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container-wide max-w-4xl">
            <motion.div {...fadeUp}>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                What Omega ingests
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mt-3 mb-6">
                Any source your organisation already uses.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Connect a live data source and Omega ingests continuously. Paste a meeting transcript and
                it extracts up to eight discrete knowledge artifacts automatically — each distilled,
                structured, and linked to the relevant workstream. Every path leads to the same indexed,
                retrievable brain.
              </p>
              <div className="flex flex-wrap gap-2">
                {omegaIngestSources.map((source) => (
                  <span
                    key={source}
                    className="inline-flex items-center rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-foreground"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ===================== CAPABILITIES ===================== */}
        <section className="py-16 md:py-24 bg-muted/30 border-y border-border">
          <div className="container-wide">
            <motion.div {...fadeUp} className="max-w-3xl mb-10">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Capabilities
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mt-3">
                What you get with Omega.
              </h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {capabilities.map((c) => (
                <motion.div
                  key={c.name}
                  {...fadeUp}
                  className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-colors"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <c.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">{c.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
                </motion.div>
              ))}
            </div>

            {/* Governance strip */}
            <motion.div {...fadeUp} className="mt-10 grid sm:grid-cols-3 gap-3 max-w-4xl">
              {[
                { icon: BookOpen, label: "Every entry sourced" },
                { icon: ShieldCheck, label: "Every change approved" },
                { icon: Network, label: "History superseded, not erased" },
              ].map((t) => (
                <div
                  key={t.label}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5"
                >
                  <t.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">{t.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ===================== MOVE 6 — THE BELIEF STATEMENT ===================== */}
        <section className="py-24 md:py-32 bg-background border-t border-border">
          <div className="container-wide max-w-4xl">
            <motion.div {...fadeUp}>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Move 06 · What we believe
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mt-3 mb-8 leading-[1.1]">
                The organisations that will win the next decade are not the ones with the most AI.{" "}
                <span className="text-primary">They are the ones with the best institutional memory.</span>
              </h2>

              <div className="space-y-6 text-lg md:text-xl leading-relaxed text-muted-foreground">
                <p>
                  Value comes from doing things your clients need that others cannot do — and no other tool
                  today can show you the full causal chain from a piece of evidence to a live decision.
                </p>
                <p className="text-foreground font-semibold">
                  Omega is not a productivity tool. It is the operating system for how your organisation
                  thinks.
                </p>
              </div>

              {/* The closing question — Feldman-style leave-behind */}
              <motion.div
                {...fadeUp}
                className="mt-12 rounded-3xl border border-primary/30 bg-primary/[0.04] p-8 md:p-12 relative overflow-hidden"
              >
                <div
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />
                <div className="relative">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                    The question we ask every client
                  </span>
                  <p className="text-2xl md:text-4xl font-bold text-foreground mt-4 leading-[1.15] tracking-tight">
                    If your three best people left tomorrow,{" "}
                    <span className="text-primary">how much of what they know would survive?</span>
                  </p>
                  <p className="text-lg md:text-xl text-foreground mt-6 font-semibold">
                    Omega is the answer to that question.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 mt-8">
                    <Button
                      variant="cta"
                      size="lg"
                      onClick={() => openBooking("Book a demo — Omega")}
                      className="min-h-touch"
                    >
                      Book a demo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      variant="cta-outline"
                      size="lg"
                      onClick={scrollToVideo}
                      className="min-h-touch"
                    >
                      Watch it think
                    </Button>
                  </div>
                </div>
              </motion.div>

              <p className="mt-10 text-xs uppercase tracking-[0.2em] text-muted-foreground text-center">
                Powered by alfredai.com.au
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <GHLBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        title={bookingTitle}
        description="Book a 30-minute working session to see Omega read your organisation's decisions and evidence — and generate the succession briefing on demand."
      />
    </div>
  );
};

export default OmegaPage;
