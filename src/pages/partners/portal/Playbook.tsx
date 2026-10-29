import { useState } from "react";
import {
  MessageSquare,
  Target,
  ShieldQuestion,
  HelpCircle,
  Send,
  Mic,
  DollarSign,
  Clock,
  ArrowRight,
  ExternalLink,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PLAYBOOK_SECTIONS, PlaybookBlock, PlaybookSection } from "@/lib/partnerPlaybookContent";

const ICONS: Record<PlaybookSection["icon"], LucideIcon> = {
  MessageSquare,
  Target,
  ShieldQuestion,
  HelpCircle,
  Send,
  Mic,
  DollarSign,
};

function Block({ block }: { block: PlaybookBlock }) {
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
    case "cta":
      return (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-partner-teal/15 text-partner-teal">
              <Smartphone className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-portal-display text-base font-semibold text-partner-navy">
                {block.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{block.text}</p>
            </div>
          </div>
          <a
            href={block.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-[44px] touch-manipulation items-center justify-center rounded-lg bg-partner-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-partner-navy/90 active:bg-partner-navy/80"
          >
            {block.label}
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
          {block.note && (
            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">
              {block.note}
            </p>
          )}
        </div>
      );
    default:
      return null;
  }
}

export default function Playbook() {
  const [active, setActive] = useState<PlaybookSection | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-portal-display text-2xl font-bold text-partner-navy">Playbook</h1>
        <p className="mt-1 text-sm text-slate-500">How to find, pitch and win the right clients.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PLAYBOOK_SECTIONS.map((section) => {
          const Icon = ICONS[section.icon];
          return (
            <Card
              key={section.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-partner-teal/15 text-partner-teal">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-portal-display text-base font-semibold text-partner-navy">
                    {section.title}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    {section.readMinutes} min read
                  </p>
                </div>
              </div>
              <p className="flex-1 text-sm leading-relaxed text-slate-600">{section.summary}</p>
              <div>
                <Button
                  variant="cta"
                  onClick={() => setActive(section)}
                  className="min-h-[44px] w-full touch-manipulation sm:w-auto"
                >
                  Read playbook
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          );
        })}
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
