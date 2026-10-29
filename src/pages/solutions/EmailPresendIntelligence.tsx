import { Link } from "react-router-dom";
import {
  ShieldCheck, Target, MousePointerClick, Gauge, ArrowRight, Mail, MailCheck,
  FileWarning, CalendarClock, Banknote, ScrollText, ClipboardList, Zap, Search, Database, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { BOOKING_PAGE_URL } from "@/lib/bookingConfig";

const PATH = "/solutions/email-presend-intelligence";

/** Supporting measures behind the flagship outcome. */
const MEASURES = [
  { icon: Target, title: "Detection Precision", text: "How often alfred ai is right when it flags something." },
  { icon: MousePointerClick, title: "Adoption Rate", text: "How often your people act on what it raises." },
  { icon: Gauge, title: "User Friction", text: "How much delay or interruption the check adds to sending." },
];

/** Higher-risk messages that get the deeper scan. */
const HIGH_RISK = [
  { icon: FileWarning, label: "Variations" },
  { icon: ClipboardList, label: "Instructions" },
  { icon: Banknote, label: "Payment commitments" },
  { icon: CalendarClock, label: "Programme changes" },
  { icon: ScrollText, label: "Contractual notices" },
];

const STEPS = [
  { icon: Send, title: "You press send", text: "Your email is held for a moment before it leaves your outbox." },
  { icon: Search, title: "Risk is sorted first", text: "Routine messages pass straight through. Higher-risk ones get a deeper look." },
  { icon: Database, title: "Checked against what you know", text: "The message is compared with your contracts, programme and earlier correspondence." },
  { icon: ShieldCheck, title: "You decide", text: "Anything that conflicts is shown with its source. Fix it, or send it as written." },
];

export default function EmailPresendIntelligence() {
  const reportHref = `mailto:hello@alfredai.bot?subject=${encodeURIComponent("Email Pre-send Intelligence page issue")}&body=${encodeURIComponent(`Page: ${typeof window !== "undefined" ? window.location.href : PATH}\n\nPlease attach a screenshot.`)}`;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Email Pre-send Intelligence — Catch Costly Mistakes Before Send | alfred ai"
        description="alfred ai reviews your outgoing project communications against what your organisation already knows, helping your team avoid costly mistakes before they happen."
        path={PATH}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Use Cases", url: "/products/use-cases" },
          { name: "Email Pre-send Intelligence", url: PATH },
        ]}
      />
      <Header />

      <main>
        {/* 1 · Hero */}
        <section className="pt-28 pb-12 md:pt-36 md:pb-16">
          <div className="container-wide max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
              <MailCheck className="h-3.5 w-3.5" aria-hidden /> Email Pre-send Intelligence
            </div>
            <h1 className="mt-6 text-3xl font-bold leading-[1.12] tracking-tight md:text-5xl">
              Emailing and Conversations re-imagined.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              alfred ai reviews your outgoing project communications against what your organisation
              already knows, helping your team avoid costly mistakes before they happen.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="min-h-[48px]"><a href={BOOKING_PAGE_URL}>Book a demo</a></Button>
              <Button asChild size="lg" variant="outline" className="min-h-[48px]"><a href="#how-heading">See how it works</a></Button>
            </div>
          </div>
        </section>

        {/* 2 · The outcome */}
        <section aria-labelledby="outcome-heading" className="border-y border-border bg-muted/30 py-12 md:py-14">
          <div className="container-wide max-w-5xl">
            <h2 id="outcome-heading" className="text-2xl font-bold md:text-3xl">A measurable outcome, not another writing tool</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              We don't measure words written. We measure the commercial risk you didn't send.
            </p>
            <div className="mt-6 rounded-2xl border-2 border-foreground bg-card p-6 md:p-8">
              <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">The headline measure</p>
              <p className="mt-2 text-2xl font-bold md:text-3xl">Validated Commercial Risk Prevented</p>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Mistakes caught before they left your business — confirmed by your team, not guessed by the system.
              </p>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {MEASURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-xl border border-border bg-card p-5">
                  <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
                  <h3 className="mt-3 font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3 · Risk-tiered scanning */}
        <section aria-labelledby="tier-heading" className="py-12 md:py-14">
          <div className="container-wide max-w-5xl">
            <h2 id="tier-heading" className="text-2xl font-bold md:text-3xl">Deeper checks where the risk is</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Not every email gets the same scan. alfred ai spots the higher-risk ones and looks harder there,
              so routine messages stay fast.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border-2 border-foreground bg-card p-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" aria-hidden />
                  <h3 className="text-lg font-semibold">Higher-risk — deeper scan</h3>
                </div>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {HIGH_RISK.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-3 text-sm">
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /> {label}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-muted-foreground" aria-hidden />
                  <h3 className="text-lg font-semibold">Routine — stays fast</h3>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Everyday updates, meeting notes and quick replies go out without interruption.
                  Your team only hears from alfred ai when it matters.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4 · How it works */}
        <section aria-labelledby="how-heading" className="scroll-mt-24 border-t border-border py-12 md:py-14">
          <div className="container-wide max-w-5xl">
            <h2 id="how-heading" className="text-2xl font-bold md:text-3xl">How a pre-send check runs</h2>
            <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                    <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                  </div>
                  <h3 className="mt-2 font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 5 · Closing */}
        <section className="pb-20">
          <div className="container-wide max-w-3xl rounded-2xl border border-border bg-card p-6 text-center md:p-8">
            <h2 className="text-2xl font-bold">Catch it before it's sent</h2>
            <p className="mt-2 text-muted-foreground">For Demo, Pricing and Customisation</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="min-h-[48px]"><a href={BOOKING_PAGE_URL}>Book a demo</a></Button>
              <Button asChild size="lg" variant="outline" className="min-h-[48px]">
                <Link to="/products/use-cases">See all workflows <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              </Button>
            </div>
            <a href={reportHref} className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" aria-hidden /> Something not working? Report an issue
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
