import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Presentation,
  PlayCircle,
  FileBadge,
  GitCompareArrows,
  Layers,
  ShieldCheck,
  Calculator,
  Clock,
  ArrowRight,
  ExternalLink,
  Check,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SectionHeading } from "@/components/portal/ResourceCard";
import { SALES_ASSETS, SalesAsset, SalesBlock } from "@/lib/salesKitContent";

const ICONS: Record<SalesAsset["icon"], LucideIcon> = {
  FileText,
  Presentation,
  PlayCircle,
  FileBadge,
  GitCompareArrows,
  Layers,
  ShieldCheck,
  Calculator,
};

const USEFUL_LINKS = [
  { label: "alfred ai blog — latest articles", href: "https://new.alfredai.bot/blog", external: true },
  { label: "alfred ai ebooks — guides and playbooks", href: "https://new.alfredai.bot/resources/ebooks", external: true },
  { label: "Machine Learning AI Takeoff demo — video 1", href: "https://youtu.be/8Mj_BtWWBT8", external: true },
  { label: "Machine Learning AI Takeoff demo — video 2", href: "https://youtu.be/VMBNhVE4Av4", external: true },
  { label: "Interactive demos", href: "https://new.alfredai.bot/resources/demos", external: true },
  { label: "alfred ai products and services", href: "https://new.alfredai.bot/products", external: true },
];

const PRODUCTS = [
  { name: "Axiom", text: "custom AI learning — models trained on your client's data, processes and decisions that sharpen as the business runs." },
  { name: "Butler", text: "AI agents that serve the team — handling the repetitive and coordinating the complex without adding headcount." },
  { name: "Watch", text: "Mission Control for owners — forward-looking signals, risks and opportunities so leadership acts early." },
  { name: "Omega", text: "your organisation's brain — it holds everything the business knows, generates the right SOP for the job, and directs the Butler agents to execute with human approval." },
  { name: "AOS", text: "the agentic operating system tying it all together, syncing to MYOB or Xero and the cloud drive." },
];

function Block({ block }: { block: SalesBlock }) {
  switch (block.type) {
    case "h2":
      return (
        <h2 className="mt-6 font-portal-display text-lg font-semibold text-partner-navy first:mt-0">
          {block.text}
        </h2>
      );
    case "p":
      return <p className="mt-2 text-sm leading-relaxed text-slate-600">{block.text}</p>;
    case "list":
      return (
        <ul className="mt-3 space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-600">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-partner-teal" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "ordered":
      return (
        <ol className="mt-3 space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-600">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-partner-teal/15 text-xs font-semibold text-partner-teal">
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote className="mt-3 whitespace-pre-wrap rounded-lg border-l-4 border-partner-teal bg-slate-50 p-4 text-sm leading-relaxed text-partner-navy">
          {block.text}
        </blockquote>
      );
    case "qa":
      return (
        <div className="mt-4">
          <p className="text-sm font-semibold text-partner-navy">{block.q}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{block.a}</p>
        </div>
      );
    case "stat":
      return (
        <div className="mt-3 flex items-baseline gap-3 rounded-lg bg-partner-navy/5 px-4 py-3">
          <span className="font-portal-display text-xl font-bold text-partner-pink">{block.value}</span>
          <span className="text-sm leading-snug text-slate-600">{block.label}</span>
        </div>
      );
    case "note":
      return (
        <p className="mt-4 rounded-lg bg-partner-navy/5 p-3 text-sm leading-relaxed text-partner-navy">
          {block.text}
        </p>
      );
    default:
      return null;
  }
}

const VIEWED_KEY = "saleskit_viewed_assets";

function loadViewed(): string[] {
  try {
    const raw = localStorage.getItem(VIEWED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export default function SalesKit() {
  const [active, setActive] = useState<SalesAsset | null>(null);
  const [viewed, setViewed] = useState<string[]>([]);

  useEffect(() => {
    setViewed(loadViewed());
  }, []);

  const openAsset = useCallback((asset: SalesAsset) => {
    setActive(asset);
    setViewed((prev) => {
      if (prev.includes(asset.id)) return prev;
      const next = [...prev, asset.id];
      try {
        localStorage.setItem(VIEWED_KEY, JSON.stringify(next));
      } catch {
        /* ignore storage errors — viewing still works */
      }
      return next;
    });
  }, []);


  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-portal-display text-2xl font-bold text-partner-navy">Sales Kit</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every asset below is built from the live alfred ai website — read it on screen, or talk to it on a call. Nothing to download.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SALES_ASSETS.map((asset) => {
          const Icon = ICONS[asset.icon];
          const isViewed = viewed.includes(asset.id);
          return (
            <Card
              key={asset.id}
              className={`flex flex-col gap-3 rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
                isViewed ? "border-partner-teal/40" : "border-slate-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-partner-teal/15 text-partner-teal">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-portal-display text-base font-semibold text-partner-navy">
                      {asset.title}
                    </h3>
                    {isViewed && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-partner-teal/15 px-2 py-0.5 text-xs font-medium text-partner-teal">
                        <Check className="h-3 w-3" />
                        Viewed
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    {asset.readMinutes} min read
                  </p>
                </div>
              </div>
              <p className="flex-1 text-sm leading-relaxed text-slate-600">{asset.summary}</p>
              <div>
                <Button
                  variant={isViewed ? "outline" : "cta"}
                  onClick={() => openAsset(asset)}
                  className="min-h-[44px] w-full touch-manipulation sm:w-auto"
                >
                  {isViewed ? "View again" : "View asset"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>

          );
        })}
      </div>

      <div className="space-y-4">
        <SectionHeading>Useful links</SectionHeading>
        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            {USEFUL_LINKS.map((link) =>
              link.external ? (
                <a
                  key={link.href + link.label}
                  href={link.href}
                  target={link.href.startsWith("mailto") ? undefined : "_blank"}
                  rel={link.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
                  className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-partner-navy transition-colors hover:bg-slate-100"
                >
                  <span>{link.label}</span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
                </a>
              ) : (
                <Link
                  key={link.href + link.label}
                  to={link.href}
                  className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-partner-navy transition-colors hover:bg-slate-100"
                >
                  <span>{link.label}</span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
                </Link>
              )
            )}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <SectionHeading>Five products in plain English</SectionHeading>
        <Card className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          {PRODUCTS.map((p) => (
            <div key={p.name} className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
              <span className="w-20 shrink-0 font-portal-display font-semibold text-partner-pink">
                {p.name}
              </span>
              <span className="text-sm leading-relaxed text-slate-600">{p.text}</span>
            </div>
          ))}
        </Card>
      </div>

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
          {active && (
            <>
              <DialogHeader className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 py-4 text-left backdrop-blur sm:px-6">
                <DialogTitle className="font-portal-display text-xl font-bold text-partner-navy">
                  {active.title}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  {active.readMinutes} min read
                </DialogDescription>
              </DialogHeader>
              <div className="px-5 py-5 sm:px-6">
                {active.blocks.map((block, i) => (
                  <Block key={i} block={block} />
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
