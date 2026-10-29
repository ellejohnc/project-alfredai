import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  FileText,
  CheckCircle2,
  TrendingUp,
  Link2,
  Sparkles,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TraceKind = "email" | "info" | "decision" | "kpi";

type TraceNode = {
  id: string;
  kind: TraceKind;
  time: string;
  who: string;
  title: string;
  detail: string;
  cites?: string[];
};

const KIND_META: Record<
  TraceKind,
  { label: string; icon: typeof Mail; color: string; ring: string; dot: string }
> = {
  email: {
    label: "Email",
    icon: Mail,
    color: "text-sky-600 dark:text-sky-400",
    ring: "ring-sky-500/30",
    dot: "bg-sky-500",
  },
  info: {
    label: "Info",
    icon: FileText,
    color: "text-violet-600 dark:text-violet-400",
    ring: "ring-violet-500/30",
    dot: "bg-violet-500",
  },
  decision: {
    label: "Decision",
    icon: CheckCircle2,
    color: "text-primary",
    ring: "ring-primary/40",
    dot: "bg-primary",
  },
  kpi: {
    label: "KPI",
    icon: TrendingUp,
    color: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/30",
    dot: "bg-emerald-500",
  },
};

const NODES: TraceNode[] = [
  {
    id: "n1",
    kind: "email",
    time: "Mon · 08:42",
    who: "Client — Meridian Constructions",
    title: "Subject: ESD angle on Harbourside tender",
    detail:
      "Client asks whether we can commit to Green Star Design v1.3 for the Pursue Harbourside proposal.",
  },
  {
    id: "n2",
    kind: "info",
    time: "Mon · 10:15",
    who: "Design Lead — meeting note",
    title: "Precedent: Wharfside ESD case study",
    detail:
      "Auto-ingested from Zoom transcript. References 2 past projects where the same rating was achieved.",
    cites: ["n1"],
  },
  {
    id: "n3",
    kind: "info",
    time: "Mon · 13:04",
    who: "Cost Manager — attachment",
    title: "Cost delta model: +2.8% on structure",
    detail:
      "Extracted from Excel workbook. Sensitivity analysis mapped to the two precedent jobs.",
    cites: ["n2"],
  },
  {
    id: "n4",
    kind: "decision",
    time: "Tue · 09:20",
    who: "Executive — approved",
    title: "Pursue Harbourside · with ESD angle",
    detail:
      "Approved by 3 leads. Every line traces back to the email, the precedent, and the cost model.",
    cites: ["n1", "n2", "n3"],
  },
  {
    id: "n5",
    kind: "kpi",
    time: "Wk 4 · live",
    who: "Outcome — measured",
    title: "Win-rate lift on ESD-tagged tenders: +18%",
    detail:
      "Rolled up into the pipeline KPI board. Click any point and Omega replays the decision chain.",
    cites: ["n4"],
  },
];

export default function OmegaTraceTimeline() {
  const [active, setActive] = useState<string>("n4");
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;
    const idx = NODES.findIndex((n) => n.id === active);
    const t = setTimeout(() => {
      setActive(NODES[(idx + 1) % NODES.length].id);
    }, 2600);
    return () => clearTimeout(t);
  }, [active, autoplay]);

  const activeNode = NODES.find((n) => n.id === active)!;
  const activeIdx = NODES.findIndex((n) => n.id === active);
  const traceIds = new Set<string>([active]);
  // walk the citation chain backwards
  const walk = (id: string) => {
    const n = NODES.find((x) => x.id === id);
    n?.cites?.forEach((c) => {
      if (!traceIds.has(c)) {
        traceIds.add(c);
        walk(c);
      }
    });
  };
  walk(active);

  return (
    <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
      {/* header strip */}
      <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
            Live trace · Pursue Harbourside
          </span>
        </div>
        <button
          onClick={() => setAutoplay((v) => !v)}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition"
        >
          <Sparkles className="w-3 h-3" />
          {autoplay ? "Auto-tracing" : "Paused — click nodes"}
        </button>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-0">
        {/* TIMELINE RAIL */}
        <div className="relative p-5 md:p-8 border-b lg:border-b-0 lg:border-r border-border">
          {/* legend */}
          <div className="flex flex-wrap items-center gap-3 mb-6 text-[11px] font-medium">
            {(Object.keys(KIND_META) as TraceKind[]).map((k) => {
              const m = KIND_META[k];
              const Icon = m.icon;
              return (
                <span
                  key={k}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-1"
                >
                  <Icon className={cn("w-3 h-3", m.color)} />
                  <span className="text-foreground/80">{m.label}</span>
                </span>
              );
            })}
          </div>

          <div className="relative">
            {/* vertical rail */}
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />
            {/* animated fill */}
            <motion.div
              className="absolute left-[19px] top-2 w-px bg-gradient-to-b from-primary via-primary/70 to-primary/0"
              initial={{ height: 0 }}
              animate={{
                height: `${((activeIdx + 1) / NODES.length) * 100}%`,
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />

            <ul className="space-y-3">
              {NODES.map((n, i) => {
                const m = KIND_META[n.kind];
                const Icon = m.icon;
                const isActive = n.id === active;
                const inTrace = traceIds.has(n.id);
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => {
                        setAutoplay(false);
                        setActive(n.id);
                      }}
                      className={cn(
                        "group w-full text-left flex items-start gap-3 rounded-xl p-3 transition-all",
                        isActive
                          ? "bg-primary/5 ring-1 ring-primary/30"
                          : inTrace
                            ? "bg-muted/50"
                            : "hover:bg-muted/40",
                      )}
                    >
                      {/* node dot */}
                      <span
                        className={cn(
                          "relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-background bg-card ring-2 transition-all",
                          isActive ? m.ring : "ring-border",
                          isActive && "scale-110",
                        )}
                      >
                        <Icon className={cn("w-4 h-4", m.color)} />
                        {isActive && (
                          <motion.span
                            layoutId="trace-pulse"
                            className={cn(
                              "absolute inset-0 rounded-full",
                              m.dot,
                              "opacity-20",
                            )}
                            transition={{ type: "spring", stiffness: 260, damping: 24 }}
                          />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{n.time}</span>
                          <span className="text-border">·</span>
                          <span className="truncate">{n.who}</span>
                        </div>
                        <p
                          className={cn(
                            "text-sm font-semibold mt-0.5 leading-snug",
                            isActive ? "text-foreground" : "text-foreground/90",
                          )}
                        >
                          {n.title}
                        </p>
                        {n.cites && n.cites.length > 0 && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Link2 className="w-3 h-3" />
                            cites {n.cites.length} upstream
                            {n.cites.length > 1 ? " sources" : " source"}
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* DETAIL PANEL */}
        <div className="relative p-5 md:p-8 bg-gradient-to-br from-muted/40 via-background to-background">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeNode.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
                {(() => {
                  const Icon = KIND_META[activeNode.kind].icon;
                  return (
                    <>
                      <Icon
                        className={cn(
                          "w-3 h-3",
                          KIND_META[activeNode.kind].color,
                        )}
                      />
                      <span className="text-foreground/80">
                        {KIND_META[activeNode.kind].label} · {activeNode.time}
                      </span>
                    </>
                  );
                })()}
              </div>

              <h3 className="mt-3 text-lg md:text-xl font-bold text-foreground leading-snug">
                {activeNode.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">{activeNode.who}</p>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                {activeNode.detail}
              </p>

              {/* citation chain */}
              <div className="mt-6 rounded-xl border border-border bg-background/70 p-4">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  <Link2 className="w-3 h-3 text-primary" />
                  Traceable chain
                </div>
                <ol className="space-y-2">
                  {NODES.filter((n) => traceIds.has(n.id))
                    .sort(
                      (a, b) =>
                        NODES.findIndex((x) => x.id === a.id) -
                        NODES.findIndex((x) => x.id === b.id),
                    )
                    .map((n, i, arr) => {
                      const m = KIND_META[n.kind];
                      const Icon = m.icon;
                      return (
                        <li
                          key={n.id}
                          className="flex items-center gap-2 text-xs"
                        >
                          <Icon className={cn("w-3.5 h-3.5 shrink-0", m.color)} />
                          <span className="text-foreground/90 truncate">
                            {n.title}
                          </span>
                          {i < arr.length - 1 && (
                            <span className="text-border">→</span>
                          )}
                        </li>
                      );
                    })}
                </ol>
                <p className="mt-3 text-[11px] text-muted-foreground italic">
                  Ask "why?" on any node — Omega replays the full path in seconds.
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
