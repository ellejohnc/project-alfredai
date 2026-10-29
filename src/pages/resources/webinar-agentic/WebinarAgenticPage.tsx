import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import {
  Calendar,
  Clock,
  Video,
  Hourglass,
  Tag,
  ArrowRight,
  CheckCircle2,
  X,
  Menu,
  Sparkles,
  TrendingUp,
  Settings2,
  HelpCircle,
  Quote,
  ExternalLink,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { webinarConfig as c } from "./config";
import { trackWebinar, smoothScrollTo } from "./lib";
import RegistrationForm from "./RegistrationForm";
import AiToolsStrip from "./AiToolsStrip";
import alfredLogo from "@/assets/alfred-ai-mid.png";
import popLogoAsset from "@/assets/pop-business-logo-clean.png.asset.json";
import eventRoomAsset from "@/assets/webinar-event-room.jpg.asset.json";
import heroWebinarImg from "@/assets/webinar-proof/hero-webinar-vibe.jpg";
import sidneyPhotoAsset from "@/assets/sidney-cachuela.png.asset.json";
import williamPhotoAsset from "@/assets/william-zhang.png.asset.json";

const heroStage = heroWebinarImg;
const sidneyPhoto = sidneyPhotoAsset.url;
const williamPhoto = williamPhotoAsset.url;
const popLogo = popLogoAsset.url;
const eventRoom = eventRoomAsset.url;

const FORM_ID = "register";

const Logo = () => (
  <div className="flex items-center gap-3 sm:gap-4">
    <img
      src={alfredLogo}
      alt={c.brand.alfred}
      className="h-6 sm:h-7 w-auto"
      onError={(e) => {
        const el = e.currentTarget;
        el.replaceWith(
          Object.assign(document.createElement("span"), {
            textContent: c.brand.alfred,
            className: "font-semibold tracking-tight text-neutral-900",
          }),
        );
      }}
    />
    <span aria-hidden className="h-5 sm:h-6 w-px bg-neutral-200" />
    <img
      src={popLogo}
      alt={c.brand.pop}
      className="h-5 sm:h-6 w-auto"
      onError={(e) => {
        const el = e.currentTarget;
        el.replaceWith(
          Object.assign(document.createElement("span"), {
            textContent: c.brand.pop,
            className: "font-semibold tracking-tight text-pink-700",
          }),
        );
      }}
    />
  </div>
);

const StickyHeader = ({ onRegister }: { onRegister: () => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 md:flex">
          {c.nav.map((n) => (
            <button
              key={n.href}
              onClick={() => smoothScrollTo(n.href.slice(1))}
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-pink-700"
            >
              {n.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={onRegister}
            className="hidden min-h-[42px] items-center rounded-full bg-pink-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-pink-700 sm:inline-flex"
          >
            Register Free
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-neutral-700 md:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-neutral-200 bg-white px-4 py-3 md:hidden">
          {c.nav.map((n) => (
            <button
              key={n.href}
              onClick={() => {
                setOpen(false);
                smoothScrollTo(n.href.slice(1));
              }}
              className="block w-full py-3 text-left text-[15px] font-medium text-neutral-700"
            >
              {n.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
};

const SectionHeading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-balance text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl md:text-4xl ${className}`}>
    {children}
  </h2>
);




const agendaIcons = [TrendingUp, Settings2, HelpCircle];

const WebinarAgenticPage = () => {
  const goToForm = () => smoothScrollTo(FORM_ID);

  useEffect(() => {
    trackWebinar("page_view");
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-900 antialiased">
      <Helmet>
        <title>AI for SMEs Webinar: More Leads, Better Sales, Smarter Operations</title>
        <meta
          name="description"
          content="Free 60-minute webinar for SME owners. Learn how practical AI helps you capture leads, follow up faster, reduce admin and build better operations. Hosted by alfred ai & PopBusiness."
        />
        <link rel="canonical" href={c.details.joinUrl} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            name: c.title,
            description: c.subtitle,
            eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
            eventStatus: "https://schema.org/EventScheduled",
            startDate: c.details.startISO,
            endDate: c.details.endISO,
            organizer: [
              { "@type": "Organization", name: c.brand.alfred },
              { "@type": "Organization", name: c.brand.pop },
            ],
            offers: { "@type": "Offer", price: "0", priceCurrency: "AUD", availability: "https://schema.org/InStock" },
          })}
        </script>
      </Helmet>

      <StickyHeader onRegister={goToForm} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-white" />
        <div className="pointer-events-none absolute -top-32 right-0 h-80 w-80 rounded-full bg-pink-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 md:pb-24 md:pt-20">
          <div className="grid items-start gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
            {/* Left: message + CTA */}
            <div className="flex flex-col">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-pink-200/70 bg-pink-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-pink-800">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-500/70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-pink-500" />
                </span>
                {c.eyebrow}
              </span>
              <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
                {c.title}
              </h1>
              <p className="mt-5 max-w-lg text-pretty text-base leading-relaxed text-neutral-600 md:text-lg">
                {c.hero.subheadline}
              </p>

              {/* Primary CTA */}
              <div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <button
                  onClick={() => {
                    trackWebinar("hero_cta_click");
                    goToForm();
                  }}
                  className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-pink-500 px-8 text-base font-semibold text-white shadow-lg shadow-pink-500/30 transition-all hover:bg-pink-700 active:scale-[0.99] sm:w-auto"
                >
                  {c.hero.primaryCta} <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => smoothScrollTo("agenda")}
                  className="inline-flex min-h-[44px] items-center gap-1.5 px-1 text-sm font-semibold text-neutral-600 transition-colors hover:text-pink-700"
                >
                  {c.hero.secondaryCta} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-neutral-400">{c.hero.microcopy}</p>

              {/* Trust strip with hosts */}
              <div className="mt-8 flex items-center gap-3 border-t border-neutral-100 pt-6">
                <div className="flex -space-x-2.5">
                  <img src={williamPhoto} alt="" className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm" />
                  <img src={sidneyPhoto} alt="" className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm" />
                </div>
                <p className="text-sm font-medium text-neutral-500">{c.hero.trustLine}</p>
              </div>
            </div>

            {/* Right: media + details card */}
            <div className="relative">
              <div className="pointer-events-none absolute -inset-2 rounded-[2rem] bg-gradient-to-tr from-pink-500/10 to-[#EC4899]/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[1.75rem] border border-neutral-200/80 bg-white shadow-xl shadow-pink-900/5">
                {/* Broadcast stage */}
                <div className="relative">
                  <img
                    src={heroStage}
                    alt="Live webinar presentation on stage to a full audience of business owners"
                    loading="eager"
                    className="aspect-[16/10] w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-md">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                    </span>
                    Live Webinar
                  </span>
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                    <Video className="h-3.5 w-3.5" /> 60 min · Online
                  </span>
                </div>

                {/* Unified detail block */}
                <div className="p-5">
                  <div className="grid grid-cols-2 divide-x divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-100">
                    {[
                      { icon: Calendar, label: "Date", value: c.details.dateLabel },
                      { icon: Clock, label: "Time", value: c.details.timeLabel },
                      { icon: Video, label: "Format", value: c.details.format },
                      { icon: Hourglass, label: "Duration", value: c.details.duration },
                    ].map((d) => (
                      <div key={d.label} className="flex items-start gap-2.5 p-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pink-50">
                          <d.icon className="h-3.5 w-3.5 text-pink-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-pink-700/60">{d.label}</p>
                          <p className="text-sm font-semibold leading-snug text-neutral-900">{d.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-xl bg-[#EC4899]/[0.07] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-[#EC4899]" />
                      <span className="text-sm font-medium text-neutral-700">Cost</span>
                    </div>
                    <span className="text-base font-extrabold tracking-tight text-[#d61f63]">{c.details.cost}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Before / After */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-24">
        <SectionHeading className="text-center">{c.beforeAfter.heading}</SectionHeading>
        <div className="mt-10 overflow-hidden rounded-3xl border border-neutral-200 shadow-sm">
          <div className="grid grid-cols-2 bg-neutral-50 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            <div className="border-r border-neutral-200 p-4">Before</div>
            <div className="bg-blue-600 p-4 text-white">After</div>
          </div>
          {c.beforeAfter.rows.map(([before, after], i) => (
            <div key={before} className={`grid grid-cols-2 text-[15px] ${i % 2 ? "bg-white" : "bg-neutral-50/50"}`}>
              <div className="flex items-start gap-2 border-r border-neutral-200 p-4 text-neutral-500">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <span>{before}</span>
              </div>
              <div className="flex items-start gap-2 p-4 text-neutral-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <span className="font-medium">{after}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Proof / Authority */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <div className="text-center">
          <SectionHeading>{c.proof.heading}</SectionHeading>
          <p className="mx-auto mt-4 max-w-2xl text-base text-neutral-600 md:text-lg">{c.proof.subheading}</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {c.proof.photos.map((p) => (
            <div
              key={p.src}
              className="overflow-hidden rounded-2xl border border-neutral-200 shadow-sm"
            >
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          ))}
        </div>
        <div className="mt-10 grid grid-cols-3 gap-4">
          {c.proof.stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-blue-50/70 p-5 text-center">
              <p className="text-2xl font-bold text-blue-700 sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs font-medium text-neutral-600 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <AiToolsStrip />

      {/* Problem */}
      <section id="why-attend" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <SectionHeading className="max-w-4xl">{c.problem.heading}</SectionHeading>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-neutral-600 md:text-lg">{c.problem.body}</p>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.problem.pains.map((p) => (
            <div key={p} className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                <X className="h-4 w-4" />
              </span>
              <span className="text-[15px] text-neutral-700">{p}</span>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-2xl bg-blue-600 p-6 text-center md:p-8">
          <p className="text-pretty text-lg font-semibold text-white md:text-xl">{c.problem.highlight}</p>
        </div>
      </section>

      {/* Audience */}
      <section className="bg-pink-50/40 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading>{c.audience.heading}</SectionHeading>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {c.audience.cards.map((a) => (
              <div key={a} className="flex items-start gap-3 rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-pink-500" />
                <span className="text-[15px] text-neutral-700">{a}</span>
              </div>
            ))}
          </div>
          <p className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white/60 p-5 text-center text-[15px] font-medium text-neutral-600">
            {c.audience.notFor}
          </p>
        </div>
      </section>

      {/* Agenda */}
      <section id="agenda" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <SectionHeading>{c.agenda.heading}</SectionHeading>
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {c.agenda.cards.map((card, i) => {
            const Icon = agendaIcons[i] ?? Sparkles;
            return (
              <div key={card.title} className="flex flex-col rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg md:p-7">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">{card.time}</span>
                </div>
                <h3 className="mt-5 text-xl font-bold text-neutral-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{card.description}</p>
                <ul className="mt-5 space-y-2.5">
                  {card.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-neutral-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <button
            onClick={() => {
              trackWebinar("agenda_cta_click");
              goToForm();
            }}
            className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.99]"
          >
            {c.agenda.cta} <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* AI Levels */}
      <section id="ai-levels" className="bg-neutral-50 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading>{c.aiLevels.heading}</SectionHeading>
          <p className="mt-4 max-w-3xl text-base text-neutral-600 md:text-lg">{c.aiLevels.subheading}</p>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
            {c.aiLevels.levels.map((lvl, i) => (
              <div
                key={lvl.level}
                className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-7"
              >
                <div
                  className="absolute left-0 top-0 h-full w-1.5"
                  style={{ background: `hsl(338 90% ${66 - i * 8}%)` }}
                />
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-500 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-pink-700">{lvl.level}</p>
                    <h3 className="text-lg font-bold text-neutral-900">{lvl.title}</h3>
                  </div>
                </div>
                <p className="mt-3 inline-block rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">{lvl.tier}</p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="font-semibold text-neutral-800">Examples</dt>
                    <dd className="text-neutral-600">{lvl.examples}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-neutral-800">Use cases</dt>
                    <dd className="text-neutral-600">{lvl.useCases}</dd>
                  </div>
                  <div className="rounded-xl bg-pink-50/70 p-3">
                    <dd className="text-pink-900">{lvl.explanation}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
          <p className="mt-8 rounded-2xl border-l-4 border-[#EC4899] bg-[#EC4899]/5 p-5 text-[15px] text-neutral-700">
            {c.aiLevels.note}
          </p>
        </div>
      </section>

      {/* Hosts */}
      <section
        id="hosts"
        className="relative overflow-hidden bg-gradient-to-b from-pink-50/60 via-white to-pink-50/30 py-16 md:py-28"
      >
        {/* Ambient layers */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-pink-300/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading className="text-center">{c.hosts.heading}</SectionHeading>
          <div className="mt-12 grid grid-cols-1 gap-y-24 gap-x-8 md:mt-16 md:grid-cols-2 md:gap-y-12">
            {c.hosts.cards.map((h, i) => {
              const accent = i === 0 ? "pink" : "blue";
              return (
                <div key={h.name} className="group relative pt-20 md:pt-24">
                  {/* Grand photo layer */}
                  {"photo" in h && h.photo ? (
                    <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 md:left-8 md:translate-x-0">
                      <div className="relative">
                        <div
                          aria-hidden
                          className={`absolute -inset-2 rounded-[2rem] bg-gradient-to-br ${
                            accent === "pink"
                              ? "from-pink-500/40 to-pink-500/10"
                              : "from-blue-400/40 to-blue-600/10"
                          } blur-md transition-all duration-500 group-hover:-inset-3`}
                        />
                        <div className="relative h-36 w-36 overflow-hidden rounded-[1.75rem] border-4 border-white shadow-2xl shadow-pink-900/20 transition-transform duration-500 group-hover:-translate-y-1 sm:h-40 sm:w-40">
                          <img
                            src={h.photo}
                            alt={`Photo of ${h.name}`}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                          <div
                            aria-hidden
                            className={`absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t ${
                              accent === "pink" ? "from-pink-900/40" : "from-blue-900/40"
                            } to-transparent`}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute left-1/2 top-0 z-20 flex h-36 w-36 -translate-x-1/2 items-center justify-center rounded-[1.75rem] border-4 border-white text-3xl font-bold text-white shadow-2xl md:left-8 md:translate-x-0" style={{ background: i === 0 ? "#EC4899" : "#1d4ed8" }}>
                      {h.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </div>
                  )}

                  {/* Card layer */}
                  <div className="relative z-10 h-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-7 pt-24 text-center shadow-xl shadow-pink-900/5 backdrop-blur-sm transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-pink-900/10 md:pl-52 md:pt-7 md:text-left">
                    <span
                      aria-hidden
                      className={`absolute left-0 top-0 h-full w-1.5 ${
                        accent === "pink" ? "bg-pink-500" : "bg-blue-500"
                      }`}
                    />
                    <h3 className="text-xl font-bold text-neutral-900">{h.name}</h3>
                    <p
                      className={`mt-1 text-sm font-semibold ${
                        accent === "pink" ? "text-pink-700" : "text-blue-700"
                      }`}
                    >
                      {h.title}
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-neutral-600">{h.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-[15px] text-neutral-600">{c.hosts.partnership}</p>
          <figure className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-3xl border border-neutral-200 shadow-lg shadow-pink-900/5">
            <img
              src={eventRoom}
              alt="alfred ai and PopBusiness hosting a live, full-room business event for SME owners and operators"
              loading="lazy"
              className="aspect-[16/9] w-full object-cover"
            />
            <figcaption className="bg-white px-5 py-3 text-center text-xs font-medium text-neutral-500">
              Trusted by SME owners and operators at our live events across Australia.
            </figcaption>
          </figure>
         </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <div className="grid items-center gap-10 rounded-3xl border border-pink-200 bg-gradient-to-br from-pink-50 to-white p-8 md:grid-cols-2 md:p-12">
          <div>
            <SectionHeading>{c.leadMagnet.heading}</SectionHeading>
            <p className="mt-4 text-base text-neutral-600">{c.leadMagnet.description}</p>
            <button
              onClick={goToForm}
              className="mt-7 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-pink-500 px-7 text-base font-semibold text-white shadow-lg shadow-pink-500/20 transition-all hover:bg-pink-700 active:scale-[0.99]"
            >
              {c.leadMagnet.cta} <ArrowRight className="h-5 w-5" />
            </button>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-pink-700">Your strategic plan includes</p>
            <ul className="space-y-3">
              {c.leadMagnet.items.map((it) => (
                <li key={it} className="flex items-start gap-2.5 text-[15px] text-neutral-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-pink-500" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id={FORM_ID} className="scroll-mt-20 bg-neutral-50 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading className="text-center">{c.form.heading}</SectionHeading>
          <p className="mx-auto mt-3 max-w-xl text-center text-neutral-600">
            Register in under a minute. We'll email your details and calendar link.
          </p>
          <div className="mt-10">
            <RegistrationForm />
          </div>
        </div>
      </section>

      {/* Credibility */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <SectionHeading className="text-center">{c.credibility.heading}</SectionHeading>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.credibility.cards.map((cr) => (
            <div key={cr} className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <Quote className="h-5 w-5 shrink-0 text-blue-500" />
              <span className="text-[15px] font-medium text-neutral-700">{cr}</span>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-3xl text-center text-[15px] text-neutral-600">{c.credibility.line}</p>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-neutral-50 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading className="text-center">{c.faq.heading}</SectionHeading>
          <Accordion type="single" collapsible className="mt-10">
            {c.faq.items.map((f, i) => (
              <AccordionItem key={f.q} value={`faq-${i}`} className="border-neutral-200">
                <AccordionTrigger className="text-left text-[15px] font-semibold text-neutral-900 hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-[15px] leading-relaxed text-neutral-600">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-pink-700 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
            {c.finalCta.heading}
          </h2>
          <p className="mt-5 text-pretty text-base text-pink-50/90 md:text-lg">{c.finalCta.body}</p>
          <button
            onClick={() => {
              trackWebinar("hero_cta_click", { location: "final_cta" });
              goToForm();
            }}
            className="mt-8 inline-flex min-h-[54px] items-center justify-center gap-2 rounded-xl bg-white px-8 text-base font-semibold text-pink-700 shadow-lg transition-all hover:bg-pink-50 active:scale-[0.99]"
          >
            {c.finalCta.cta} <ArrowRight className="h-5 w-5" />
          </button>
          <p className="mt-3 text-sm text-pink-100/80">{c.finalCta.microcopy}</p>
        </div>
      </section>

      {/* Cross-sell Events */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <div className="mb-8 text-center">
          <h2 className="text-balance text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
            {c.crossSellEvents.heading}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {c.crossSellEvents.events.map((evt) => (
            <a
              key={evt.url}
              href={evt.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-pink-300 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-500">
                  <Calendar className="h-5 w-5" />
                </span>
                <div>
                  <span className="inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                    {evt.tag}
                  </span>
                  <h3 className="mt-1.5 text-base font-semibold text-neutral-900 group-hover:text-pink-700 transition-colors">
                    {evt.title}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-pink-500">
                <span>View Event</span>
                <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:px-6 md:flex-row">
          <Logo />
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-neutral-500">
            <a href={`mailto:${c.brand.contactEmail}`} className="hover:text-pink-700">{c.brand.contactEmail}</a>
            <a href={c.brand.privacyUrl} className="hover:text-pink-700">Privacy</a>
            <a href={c.brand.termsUrl} className="hover:text-pink-700">Terms</a>
          </div>
          <p className="text-xs text-neutral-400">© {new Date().getFullYear()} {c.brand.alfred} &amp; {c.brand.pop}</p>
        </div>
      </footer>

      {/* Mobile fixed bottom CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 p-3 backdrop-blur md:hidden">
        <button
          onClick={() => {
            trackWebinar("hero_cta_click", { location: "mobile_sticky" });
            goToForm();
          }}
          className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-pink-500 text-base font-semibold text-white active:scale-[0.99]"
        >
          Register Free <ArrowRight className="h-5 w-5" />
        </button>
      </div>
      {/* Spacer so mobile sticky bar doesn't cover footer */}
      <div className="h-20 md:hidden" />
    </div>
  );
};

export default WebinarAgenticPage;
