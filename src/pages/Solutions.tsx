import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight, CalendarCheck, Mail, Ruler, FileCheck2, FileText, ClipboardCheck, Bot,
  ChevronDown, Check, MessagesSquare, Wrench, Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BOOKING_PAGE_URL } from "@/lib/bookingConfig";
import { roles, industries } from "@/data/solutionsData";
import { cn } from "@/lib/utils";

type View = "industries" | "roles";

/** The five workflows — AI Take-Off leads as the flagship. */
const WORKFLOWS = [
  { title: "AI Take-Off", icon: Ruler, href: "/solutions/ai-takeoff", result: "10 days → 10 hours", summary: "Quantities measured from your drawings, every figure linked to its sheet, flags reviewed by your estimator." },
  { title: "Tender Management", icon: FileCheck2, href: "/products/use-cases/automated-tender-bid-completion", summary: "Tender forms completed from your own documents, with compliance scored and a clear go/no-go." },
  { title: "Billing and Invoicing Triage", icon: FileText, href: "/demos/purchase-bill-intake", summary: "Bills and POs sorted, coded and matched, then sent to your accounts system for approval." },
  { title: "Inspection & Technical Reports", icon: ClipboardCheck, href: "/demos/technical-report-agent", summary: "Site notes and photos turned into consistent reports your team checks and signs off." },
  { title: "AI Employees", icon: Bot, href: "/solutions/ai-for-construction/operations", summary: "Done-for-you digital team members handling repeat admin across the systems you already use." },
];

const DELIVERY = [
  { icon: MessagesSquare, title: "Consultation", text: "We map where your time goes and pick the workflow with the biggest return." },
  { icon: Wrench, title: "We build and train it", text: "Customised to your workflow, procedures and contract scope — done for you." },
  { icon: Rocket, title: "Live in weeks", text: "Your team reviews the output; we keep tuning it as your work changes." },
];

const Solutions = () => {
  const [params] = useSearchParams();
  const [view, setView] = useState<View>(params.get("role") ? "roles" : "industries");
  const [open, setOpen] = useState<string | null>(params.get("role") || params.get("industry"));

  useEffect(() => {
    const id = params.get("role") || params.get("industry");
    if (!id) return;
    setView(params.get("role") ? "roles" : "industries");
    setOpen(id);
    const t = setTimeout(() => document.getElementById(`s-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
    return () => clearTimeout(t);
  }, [params]);

  const reportHref = `mailto:hello@alfredai.bot?subject=${encodeURIComponent("Solutions page issue")}&body=${encodeURIComponent(`Page: ${typeof window !== "undefined" ? window.location.href : "/solutions"}\n\nPlease attach a screenshot.`)}`;

  const items = view === "industries"
    ? industries.map((i) => ({ id: i.id, icon: i.icon, title: i.title, metric: i.impactMetric, sub: i.qualifier, a: ["Challenges", i.challenges] as const, b: ["What AI handles", i.useCases] as const }))
    : roles.map((r) => ({ id: r.id, icon: r.icon, title: r.title, metric: r.impactMetric, sub: r.teamSize, a: ["Pain points", r.painPoints] as const, b: ["Example workflow", r.workflowSteps] as const }));

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="AI Solutions for Construction & Contracting"
        description="Done-for-you AI agents for builders, fabricators and contractors: AI Take-Off, tenders, billing triage, technical reports and AI Employees. Book a demo."
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "Solutions", url: "/solutions" }]}
      />
      <Header />

      <main>
        {/* Hero */}
        <section className="pb-12 pt-24 md:pb-16 md:pt-32">
          <div className="container-wide max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">Solutions · Data intelligence for construction</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-6xl">AI that fits how you build</h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Five workflows, customised to your trade and your team. We build and train them for you — you review the results.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="min-h-[48px]">
                <a href={BOOKING_PAGE_URL}><CalendarCheck className="mr-2 h-4 w-4" /> Book a demo</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-h-[48px]">
                <Link to="/solutions/ai-takeoff">Start with AI Take-Off <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Workflows */}
        <section aria-labelledby="wf-heading" className="border-y border-border bg-muted/30 py-12 md:py-14">
          <div className="container-wide">
            <h2 id="wf-heading" className="text-2xl font-bold md:text-3xl">Five workflows we run for you</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {WORKFLOWS.map((w, i) => {
                const Icon = w.icon;
                const flagship = i === 0;
                return (
                  <Link
                    key={w.title}
                    to={w.href}
                    className={cn(
                      "group flex flex-col rounded-2xl bg-card p-6 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      flagship ? "border-2 border-foreground lg:row-span-2" : "border border-border",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
                      <h3 className="text-lg font-semibold">{w.title}</h3>
                    </div>
                    {flagship && <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-primary">Flagship AI agent</p>}
                    {w.result && <p className="mt-3 font-mono text-2xl font-bold">{w.result}</p>}
                    <p className="mt-2 text-sm text-muted-foreground">{w.summary}</p>
                    <span className="mt-auto inline-flex min-h-[44px] items-center gap-1 pt-4 text-sm font-semibold">
                      {flagship ? "See AI Take-Off" : "Learn more"} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* By industry / role */}
        <section aria-labelledby="fit-heading" className="py-12 md:py-14">
          <div className="container-wide max-w-5xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h2 id="fit-heading" className="text-2xl font-bold md:text-3xl">Find yours</h2>
              <div role="tablist" className="inline-flex self-start rounded-full border border-border p-1">
                {(["industries", "roles"] as View[]).map((v) => (
                  <button
                    key={v}
                    role="tab"
                    aria-selected={view === v}
                    onClick={() => { setView(v); setOpen(null); }}
                    className={cn(
                      "min-h-[44px] rounded-full px-5 text-sm font-medium transition-colors",
                      view === v ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    By {v === "industries" ? "industry" : "role"}
                  </button>
                ))}
              </div>
            </div>

            <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
              {items.map((it) => {
                const Icon = it.icon;
                const isOpen = open === it.id;
                return (
                  <li key={it.id} id={`s-${it.id}`} className="scroll-mt-24">
                    <button
                      onClick={() => setOpen(isOpen ? null : it.id)}
                      aria-expanded={isOpen}
                      className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left md:px-6"
                    >
                      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="flex-1">
                        <span className="block font-semibold">{it.title}</span>
                        <span className="block text-xs text-muted-foreground">{it.sub}</span>
                      </span>
                      <span className="hidden font-mono text-sm font-semibold sm:block">{it.metric}</span>
                      <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden />
                    </button>
                    {isOpen && (
                      <div className="grid gap-6 px-4 pb-6 md:grid-cols-2 md:px-6">
                        <p className="font-mono text-sm font-semibold sm:hidden">{it.metric}</p>
                        {[it.a, it.b].map(([label, list]) => (
                          <div key={label}>
                            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                            <ul className="mt-2 space-y-1.5">
                              {list.map((x) => (
                                <li key={x} className="flex gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />{x}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                        <a href={BOOKING_PAGE_URL} className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold md:col-span-2">
                          Book a demo for {it.title} <ArrowRight className="h-4 w-4" aria-hidden />
                        </a>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Delivery */}
        <section aria-labelledby="dl-heading" className="border-t border-border py-12 md:py-14">
          <div className="container-wide max-w-5xl">
            <h2 id="dl-heading" className="text-2xl font-bold md:text-3xl">Done for you, not DIY</h2>
            <ol className="mt-6 grid gap-3 sm:grid-cols-3">
              {DELIVERY.map((d, i) => {
                const Icon = d.icon;
                return (
                  <li key={d.title} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                    </div>
                    <h3 className="mt-2 font-semibold">{d.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{d.text}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Closing */}
        <section className="pb-20">
          <div className="container-wide max-w-3xl rounded-2xl border border-border bg-card p-6 text-center md:p-8">
            <h2 className="text-2xl font-bold">See it on your work</h2>
            <p className="mt-2 text-muted-foreground">For Demo, Pricing and Customisation</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="min-h-[48px]"><a href={BOOKING_PAGE_URL}>Book a demo</a></Button>
              <Button asChild size="lg" variant="outline" className="min-h-[48px]"><Link to="/products/use-cases">See all workflows</Link></Button>
            </div>
            <a href={reportHref} className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3.5 w-3.5" /> Something not working? Report an issue</a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Solutions;
