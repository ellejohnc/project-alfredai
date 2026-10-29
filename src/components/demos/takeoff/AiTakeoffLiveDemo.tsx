import { useEffect, useMemo, useState } from "react";
import { BOOKING_PAGE_URL } from "@/lib/bookingConfig";
import { motion } from "framer-motion";
import {
  Layers, Gauge, ScanLine, Table2, ShieldCheck, Download, Check, CheckCircle2,
  Pencil, HelpCircle, Ban, FileText, ChevronLeft, ChevronRight, Mail, CalendarCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TakeoffBlueprint } from "./TakeoffBlueprint";
import { TRADE_ICONS } from "./TradeSymbols";
import { RUN_DEPTHS, RUN_TIME_BASIS, TRADES, FEATURED_TRADES, type DepthId, type TradeId } from "./takeoffData";

const STEPS = [
  { id: 0, title: "Sample set", icon: FileText },
  { id: 1, title: "Sheets classified", icon: Layers },
  { id: 2, title: "Choose run depth", icon: Gauge },
  { id: 3, title: "Measure on drawing", icon: ScanLine },
  { id: 4, title: "The bill", icon: Table2 },
  { id: 5, title: "Human review", icon: ShieldCheck },
  { id: 6, title: "Export", icon: Download },
];


type Decision = "accept" | "overwrite" | "rfi" | "exclude";

function confTone(c: number) {
  if (c >= 90) return "bg-success/15 text-foreground";
  if (c >= 80) return "bg-muted text-foreground";
  return "bg-warning/20 text-foreground";
}

export function AiTakeoffLiveDemo({ initialTrade = "gc", heading = "From Drawings to Decisions" }: { initialTrade?: TradeId; heading?: string }) {
  const [tradeId, setTradeId] = useState<TradeId>(initialTrade);
  const [step, setStep] = useState(0);
  const [uploaded, setUploaded] = useState(0);
  const [depth, setDepth] = useState<DepthId>("standard");
  const [revealed, setRevealed] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const trade = TRADES[tradeId];
  const flagged = trade.items.filter((i) => i.flag);
  const resolved = flagged.filter((i) => decisions[i.id]).length;

  // reset when trade changes
  useEffect(() => {
    setStep(0); setUploaded(0); setRevealed(0); setSelected(null); setDecisions({}); setOverrides({});
  }, [tradeId]);

  // sample-set opening animation — the set is preloaded, nothing is uploaded
  useEffect(() => {
    if (step !== 0 || uploaded >= trade.sheets.length) return;
    const t = setTimeout(() => setUploaded((u) => u + 1), 260);
    return () => clearTimeout(t);
  }, [step, uploaded, trade.sheets.length]);

  // measuring animation
  useEffect(() => {
    if (step !== 3) return;
    if (revealed >= trade.items.length) return;
    const t = setTimeout(() => setRevealed((r) => r + 1), 650);
    return () => clearTimeout(t);
  }, [step, revealed, trade.items.length]);

  const goTo = (s: number) => {
    setStep(s);
    if (s >= 1 && uploaded < trade.sheets.length) setUploaded(trade.sheets.length);
    if (s > 3) setRevealed(trade.items.length);
    if (s === 3 && revealed >= trade.items.length) setRevealed(0);
  };

  const selectedItem = useMemo(() => trade.items.find((i) => i.id === selected) ?? null, [trade, selected]);

  const reportHref = `mailto:hello@alfredai.bot?subject=${encodeURIComponent("AI Take-Off live demo issue")}&body=${encodeURIComponent(`Page: ${typeof window !== "undefined" ? window.location.href : ""}\nTrade: ${trade.label}\nStep: ${STEPS[step].title}\n\nWhat happened (please attach a screenshot):`)}`;

  const next = () => goTo(Math.min(step + 1, STEPS.length - 1));
  const prev = () => goTo(Math.max(step - 1, 0));
  const canNext =
    (step !== 3 || revealed >= trade.items.length) &&
    step < STEPS.length - 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">AI Take-Off · Flagship · Live demo</p>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{heading}</h2>
        <p className="text-sm text-muted-foreground">
          Pick your trade, then tap through each step with a preloaded sample set. This is a guided demo — there's nothing to upload here. Every figure links back to the drawing it came from, and you approve the flagged ones.
        </p>
      </div>

      {/* Trade selector */}
      <div role="tablist" aria-label="Choose your trade" className="grid grid-cols-3 gap-2">
        {FEATURED_TRADES.map((id) => {
          const Icon = TRADE_ICONS[id];
          const active = id === tradeId;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => setTradeId(id)}
              className={cn(
                "flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-center text-xs font-semibold transition-colors touch-manipulation sm:flex-row sm:gap-2 sm:text-sm",
                active ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="leading-tight">{TRADES[id].label}</span>
            </button>
          );
        })}
      </div>

      {/* Result tag */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {trade.result && <span className="rounded-full border border-border bg-card px-3 py-1 font-semibold">{trade.result}</span>}
        <span className="text-muted-foreground">{trade.project}</span>
      </div>

      {/* Steps */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" aria-label="Demo steps">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const active = s.id === step;
          const done = s.id < step;
          return (
            <button
              key={s.id}
              onClick={() => goTo(s.id)}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors touch-manipulation",
                active ? "border-primary bg-primary text-primary-foreground" : done ? "border-border bg-muted text-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              <span className="font-mono text-[10px] opacity-70">{String(s.id + 1).padStart(2, "0")}</span>
              {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              <span className="whitespace-nowrap">{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Stage */}
      <motion.div
        key={`${tradeId}-${step}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6"
      >
        {step === 0 && (
          <div className="space-y-4">
            <StepHead n="01" title="The sample drawing set" text="Plans, sections, elevations, schedules and the specification for the sample project — preloaded for this demo, nothing to upload. Your own drawings come in after your consultation." />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{trade.sheets.length} sheets · illustrative drawings</span>
              {uploaded < trade.sheets.length && <span aria-live="polite">Opening the set…</span>}
            </div>
            <ul className="space-y-2" aria-label="Sample drawing set">
              {trade.sheets.slice(0, uploaded).map((s) => (
                <motion.li key={s.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="font-mono text-xs font-semibold">{s.id}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{s.title}.pdf</span>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <StepHead n="02" title="Every sheet identified" text="Each sheet is classified with its scale and level. The classification decides what each step reads — and what's not needed is said out loud." />
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                  <tr><th className="px-3 py-2">Sheet</th><th className="px-3 py-2">Identified as</th><th className="px-3 py-2">What alfred ai takes from it</th><th className="px-3 py-2">Status</th></tr>
                </thead>
                <tbody>
                  {trade.sheets.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-3 py-2 font-mono text-xs font-semibold">{s.id}</td>
                      <td className="px-3 py-2">{s.type}</td>
                      <td className="px-3 py-2 text-muted-foreground">{s.use}</td>
                      <td className="px-3 py-2">
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", s.needed ? "bg-success/15" : "bg-muted text-muted-foreground")}>
                          {s.needed ? "Read" : "Skipped"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <StepHead n="03" title="Choose how deep to run it" text="Pick the depth before work begins. Deeper runs read more of the set and cite the specification." />
            <div className="grid gap-3 sm:grid-cols-3">
              {RUN_DEPTHS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDepth(d.id)}
                  aria-pressed={depth === d.id}
                  className={cn(
                    "min-h-[44px] rounded-xl border p-4 text-left transition-colors touch-manipulation",
                    depth === d.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted",
                  )}
                >
                  <div className="flex items-center justify-between"><span className="font-semibold">{d.label}</span><span className="font-mono text-xs text-muted-foreground">{d.time}</span></div>
                  <p className="mt-2 text-xs text-muted-foreground">{d.reads}</p>
                  <p className="text-xs text-muted-foreground">{d.spec}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Times shown are for a set of {RUN_TIME_BASIS} sheets — a smaller set runs faster, a larger set longer.
            </p>
            <Button className="min-h-[44px] w-full sm:w-auto" onClick={() => goTo(3)}>
              <ScanLine className="mr-2 h-4 w-4" /> Start the {RUN_DEPTHS.find((d) => d.id === depth)?.label} run
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <StepHead n="04" title="Measured on the drawing" text="Quantities are traced straight off the sheets. Dashed amber marks are flagged for a person to check — never guessed." />
            <TakeoffBlueprint trade={tradeId} items={trade.items} revealed={revealed} selectedId={selected} onSelect={setSelected} sheetLabel={trade.items[0].sheet} />
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-mono">{revealed} / {trade.items.length} items found</span>
              <span className="text-muted-foreground">{trade.items.slice(0, revealed).filter((i) => i.flag).length} flagged for review</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(revealed / trade.items.length) * 100}%` }} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <StepHead n="05" title="The bill, with evidence for every figure" text="Tap a row to see where it came from on the drawing and how it was measured." />
            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[460px] text-sm">
                  <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                    <tr><th className="px-3 py-2">Code</th><th className="px-3 py-2">Item</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Conf.</th></tr>
                  </thead>
                  <tbody>
                    {trade.items.map((it) => (
                      <tr
                        key={it.id}
                        tabIndex={0}
                        onClick={() => setSelected(it.id)}
                        onKeyDown={(e) => e.key === "Enter" && setSelected(it.id)}
                        className={cn("cursor-pointer border-t border-border transition-colors hover:bg-muted/50", selected === it.id && "bg-muted")}
                      >
                        <td className="px-3 py-2.5 font-mono text-xs">{it.code}</td>
                        <td className="px-3 py-2.5">{it.description}{it.flag && <span className="ml-1 text-warning">●</span>}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{it.qty.toLocaleString("en-AU")} {it.unit}</td>
                        <td className="px-3 py-2.5 text-right"><span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", confTone(it.confidence))}>{it.confidence}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-3">
                <TakeoffBlueprint trade={tradeId} items={trade.items} selectedId={selected} onSelect={setSelected} sheetLabel={selectedItem?.sheet ?? trade.items[0].sheet} />
                {selectedItem ? (
                  <div className="rounded-lg border border-border p-3 text-sm">
                    <p className="font-semibold">{selectedItem.code} · {selectedItem.description}</p>
                    <dl className="mt-2 grid grid-cols-[88px_1fr] gap-y-1 text-xs">
                      <dt className="text-muted-foreground">Sheet</dt><dd className="font-mono">{selectedItem.sheet}</dd>
                      <dt className="text-muted-foreground">Method</dt><dd>{selectedItem.method}</dd>
                      <dt className="text-muted-foreground">Confidence</dt><dd>{selectedItem.confidence}%</dd>
                      {selectedItem.flag && (<><dt className="text-muted-foreground">Flag</dt><dd className="text-warning">{selectedItem.flag}</dd></>)}
                    </dl>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Tap a row or a highlighted area to see its evidence.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <StepHead n="06" title="You stay in control" text={`${flagged.length} items need a person. Accept, overwrite, raise an RFI or exclude — nothing is priced until you decide.`} />
            <div className="space-y-3">
              {flagged.map((it) => {
                const d = decisions[it.id];
                return (
                  <div key={it.id} className="rounded-xl border border-border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{it.code} · {it.description}</p>
                        <p className="text-xs text-warning">{it.flag}</p>
                        <p className="text-xs text-muted-foreground">AI figure: {it.qty.toLocaleString("en-AU")} {it.unit} · {it.confidence}% · {it.sheet}</p>
                      </div>
                      {d && <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold capitalize">{d === "rfi" ? "RFI raised" : d === "overwrite" ? `Overwritten: ${overrides[it.id] || it.qty} ${it.unit}` : d === "accept" ? "Accepted" : "Excluded"}</span>}
                    </div>
                    {d === "overwrite" && (
                      <input
                        inputMode="decimal"
                        aria-label={`New quantity for ${it.code}`}
                        defaultValue={overrides[it.id] ?? String(it.qty)}
                        onChange={(e) => setOverrides((o) => ({ ...o, [it.id]: e.target.value }))}
                        className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm sm:w-48"
                      />
                    )}
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {([
                        ["accept", "Accept", CheckCircle2],
                        ["overwrite", "Overwrite", Pencil],
                        ["rfi", "RFI", HelpCircle],
                        ["exclude", "Exclude", Ban],
                      ] as const).map(([k, label, Icon]) => (
                        <button
                          key={k}
                          onClick={() => {
                            setDecisions((s) => ({ ...s, [it.id]: k }));
                            if (k === "rfi") toast.success(`RFI drafted for ${it.code} — question goes to the design team`);
                          }}
                          aria-pressed={d === k}
                          className={cn(
                            "flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition-colors touch-manipulation",
                            d === k ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted",
                          )}
                        >
                          <Icon className="h-4 w-4" /> {label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground">{resolved} of {flagged.length} reviewed</p>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <StepHead n="07" title="Ready for pricing" text="Export in your categories and formats. Revised drawings? Only what changed is re-measured." />
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat value={String(trade.items.length)} label="Line items" />
              <Stat value={String(trade.sheets.filter((s) => s.needed).length)} label="Sheets read" />
              <Stat value={`${resolved}/${flagged.length}`} label="Reviewed" />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {trade.exports.map((e) => (
                <Button key={e} variant="outline" className="min-h-[44px] justify-start" onClick={() => toast.success(`${e} — in the full product this downloads in your own format.`)}>
                  <Download className="mr-2 h-4 w-4" /> {e}
                </Button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg" className="min-h-[48px] flex-1">
                <a href={BOOKING_PAGE_URL}><CalendarCheck className="mr-2 h-4 w-4" /> Book a demo</a>
              </Button>
              <Button
                size="lg" variant="outline" className="min-h-[48px] flex-1"
                onClick={() => setTradeId(FEATURED_TRADES[(FEATURED_TRADES.indexOf(tradeId) + 1) % FEATURED_TRADES.length])}
              >
                Try {TRADES[FEATURED_TRADES[(FEATURED_TRADES.indexOf(tradeId) + 1) % FEATURED_TRADES.length]].label}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground sm:text-center">
              After your online consultation, you can send us your drawings for a full assessment.
            </p>
          </div>
        )}
      </motion.div>

      {/* Prev / next */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" className="min-h-[44px]" onClick={prev} disabled={step === 0}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <span className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
        <Button className="min-h-[44px]" onClick={next} disabled={!canNext}>
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Illustrative drawings and figures. AI-assisted take-off with human review — not a substitute for your estimator's sign-off.
      </p>
      <div className="text-center">
        <a href={reportHref} className="inline-flex min-h-[44px] items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Mail className="h-3.5 w-3.5" /> Something not working? Report an issue
        </a>
      </div>
    </div>
  );
}

function StepHead({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div>
      <span className="font-mono text-xs text-primary">{n}</span>
      <h3 className="text-lg font-semibold sm:text-xl">{title}</h3>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="font-mono text-xl font-bold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

export default AiTakeoffLiveDemo;
