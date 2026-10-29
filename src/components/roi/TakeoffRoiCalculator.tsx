import { useId, useMemo, useState } from "react";
import { ChevronDown, RotateCcw, CalendarCheck, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { calculateTakeoffRoi, DEFAULT_ROI_INPUTS, formatAud, type RoiInputs } from "@/lib/takeoffRoi";
import { useRegionCurrency } from "@/hooks/useRegionCurrency";

let regionSymbol = "A$";
const fmt = (n: number) => `${n < 0 ? "-" : ""}${regionSymbol}${Math.round(Math.abs(n)).toLocaleString("en-AU")}`;
import { BOOKING_PAGE_URL } from "@/lib/bookingConfig";

type Key = keyof RoiInputs;
interface Field { key: Key; label: string; help: string; min: number; max: number; step: number; prefix?: string; suffix?: string }

const GROUPS: { title: string; fields: Field[] }[] = [
  {
    title: "Your estimating work today",
    fields: [
      { key: "takeoffsPerMonth", label: "Take-offs you do each month", help: "Count every drawing set you measure, won or lost.", min: 1, max: 200, step: 1 },
      { key: "hoursPerTakeoff", label: "Hours one take-off takes by hand", help: "Measuring and counting only — not pricing.", min: 1, max: 80, step: 1, suffix: "h" },
      { key: "timeSavedPct", label: "Time you expect AI to save", help: "Most teams start between 40% and 70%.", min: 0, max: 90, step: 5, suffix: "%" },
      { key: "labourRate", label: "What an estimator hour costs you", help: "Wage plus super, leave and overheads.", min: 30, max: 250, step: 5, prefix: "$" },
    ],
  },
  {
    title: "Winning more work",
    fields: [
      { key: "avgTenderValue", label: "Typical project you tender for", help: "Average contract value of a tender.", min: 50_000, max: 20_000_000, step: 50_000, prefix: "$" },
      { key: "capacityToTendersPct", label: "Saved time you'd put into extra tenders", help: "The rest stays as spare team capacity.", min: 0, max: 100, step: 5, suffix: "%" },
      { key: "winRatePct", label: "How often you win a tender", help: "Your usual win rate.", min: 1, max: 80, step: 1, suffix: "%" },
      { key: "marginPct", label: "What you keep from a won job", help: "Profit after direct job costs.", min: 1, max: 50, step: 1, suffix: "%" },
    ],
  },
  {
    title: "alfred ai investment",
    fields: [
      { key: "monthlySubscription", label: "Monthly subscription", help: "Example figure — your quote may differ.", min: 0, max: 20_000, step: 100, prefix: "$" },
      { key: "implementationFee", label: "One-off setup fee", help: "Spread over the first 12 months.", min: 0, max: 100_000, step: 500, prefix: "$" },
      { key: "monthlyAiCharges", label: "Monthly AI usage (optional)", help: "Extra processing for large sets.", min: 0, max: 10_000, step: 50, prefix: "$" },
      { key: "monthlyOtherCosts", label: "Other monthly costs (optional)", help: "Training time, admin, etc.", min: 0, max: 10_000, step: 50, prefix: "$" },
    ],
  },
];

function NumberField({ f, value, onChange }: { f: Field; value: number; onChange: (n: number) => void }) {
  const id = useId();
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium leading-snug">{f.label}</label>
        <div className="flex shrink-0 items-center rounded-md border border-border bg-background px-2 focus-within:ring-2 focus-within:ring-ring">
          {f.prefix && <span className="text-xs text-muted-foreground">{regionSymbol}</span>}
          <input
            id={id}
            type="number"
            inputMode="decimal"
            min={f.min}
            step={f.step}
            value={Number.isFinite(value) ? value : ""}
            onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
            aria-describedby={`${id}-help`}
            className="h-10 w-24 bg-transparent text-right text-base tabular-nums outline-none"
          />
          {f.suffix && <span className="text-xs text-muted-foreground">{f.suffix}</span>}
        </div>
      </div>
      <Slider
        value={[Math.min(value, f.max)]}
        min={f.min}
        max={f.max}
        step={f.step}
        onValueChange={([v]) => onChange(v)}
        aria-label={f.label}
        className="py-2"
      />
      <p id={`${id}-help`} className="text-xs text-muted-foreground">{f.help}</p>
    </div>
  );
}

export function TakeoffRoiCalculator() {
  const { currency, currencySymbol } = useRegionCurrency();
  regionSymbol = currencySymbol;
  const [inputs, setInputs] = useState<RoiInputs>(DEFAULT_ROI_INPUTS);
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [advanced, setAdvanced] = useState(true);
  const set = (k: Key) => (n: number) => setInputs((p) => ({ ...p, [k]: n }));
  const r = useMemo(
    () => calculateTakeoffRoi({ ...inputs, tenderPrepHours: advanced ? inputs.tenderPrepHours ?? 24 : null }, period),
    [inputs, period, advanced],
  );
  const per = period === "year" ? "/yr" : "/mo";
  const tenders = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

  /** The numbers travel with the person, not with the click: they are kept
   *  here so a booking conversation can pick them up. Navigation itself is the
   *  link's job, so the control stays a real link (copyable, middle-clickable). */
  const rememberAssumptions = () => {
    try {
      sessionStorage.setItem("roi_assumptions", JSON.stringify({ inputs, period, results: r }));
    } catch { /* storage unavailable — booking still works */ }
  };

  const PeriodToggle = (
    <div role="radiogroup" aria-label="Show results per" className="inline-flex rounded-lg border border-border p-0.5">
      {(["month", "year"] as const).map((p) => (
        <button key={p} type="button" role="radio" aria-checked={period === p} onClick={() => setPeriod(p)}
          className={cn("min-h-[40px] rounded-md px-4 text-sm font-medium transition-colors",
            period === p ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>
          {p === "month" ? "Monthly" : "Annual"}
        </button>
      ))}
    </div>
  );

  const Summary = (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Extra project value you could tender</p>
      </div>
      <p className="mt-2 text-4xl font-extrabold tabular-nums text-primary md:text-5xl" aria-live="polite">
        {fmt(r.tenderedValue)}<span className="text-lg font-semibold text-muted-foreground">{per}</span>
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {tenders(r.additionalTenders)} extra tenders from {Math.round(r.hoursSaved).toLocaleString("en-AU")} hours saved
      </p>
      {advanced && (
        <p className="mt-1 text-xs text-muted-foreground">
          Assumes a full tender takes {inputs.tenderPrepHours ?? 24} h to prepare.
        </p>
      )}
    </div>
  );

  const kpis: [string, string, string][] = [
    ["Estimating hours saved", `${Math.round(r.hoursSaved).toLocaleString("en-AU")} h`, "Take-offs × hours × time saved"],
    ["Extra tenders you can prepare", tenders(r.additionalTenders), "Hours put into tenders ÷ hours per tender"],
    ["Contract value you could win", fmt(r.wonValue), "Tendered value × win rate — not guaranteed"],
    ["Profit from those wins", fmt(r.contribution), "Won value × what you keep"],
    ["Team time freed up (value)", fmt(r.labourCapacityValue), "Capacity, not cash — unless you cut costs"],
  ];


  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_3fr] lg:items-start">
      {/* Mobile: compact summary first */}
      <div className="lg:hidden space-y-3">
        <div className="flex justify-center">{PeriodToggle}</div>
        {Summary}
      </div>

      {/* Inputs (40%) */}
      <div className="space-y-3">
        {GROUPS.map((g, gi) => (
          <details key={g.title} open={gi === 0} className="group rounded-2xl border border-border bg-card">
            <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl [&::-webkit-details-marker]:hidden">
              <h3 className="font-semibold">{g.title}</h3>
              <ChevronDown aria-hidden className="h-5 w-5 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="space-y-5 px-5 pb-5">
              {g.fields.map((f) => <NumberField key={f.key} f={f} value={inputs[f.key] as number} onChange={set(f.key)} />)}
              {gi === 1 && (
                <div className="border-t border-border pt-4">
                  <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm">
                    <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} className="h-5 w-5 accent-primary" />
                    A full tender takes longer than the take-off
                  </label>
                  {advanced && (
                    <NumberField
                      f={{ key: "tenderPrepHours", label: "Hours to prepare one whole tender", help: "Take-off plus pricing, scope review and submission.", min: 1, max: 200, step: 1, suffix: "h" }}
                      value={inputs.tenderPrepHours ?? 24}
                      onChange={set("tenderPrepHours")}
                    />
                  )}
                </div>
              )}
            </div>
          </details>
        ))}
        <Button variant="ghost" className="min-h-[44px]" onClick={() => { setInputs(DEFAULT_ROI_INPUTS); setAdvanced(true); }}>
          <RotateCcw className="mr-2 h-4 w-4" /> Reset to example figures
        </Button>
      </div>

      {/* Results (60%) */}
      <div className="space-y-4 lg:sticky lg:top-24">
        <div className="hidden lg:flex items-center justify-between">
          <p className="text-sm text-muted-foreground">All amounts in {currency}, estimates only</p>
          {PeriodToggle}
        </div>
        <div className="hidden lg:block">{Summary}</div>

        <dl className="grid grid-cols-2 gap-3">
          {kpis.map(([label, value, how], i) => (
            <div
              key={label}
              className={cn(
                "rounded-xl border border-border bg-card p-4",
                i === kpis.length - 1 && kpis.length % 2 === 1 && "col-span-2",
              )}
            >
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums">{value}</dd>
              <dd className="mt-1 text-[11px] leading-snug text-muted-foreground">{how}</dd>
            </div>
          ))}
        </dl>


        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border-2 border-foreground bg-card p-4 lg:p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Net benefit {period === "year" ? "per year" : "per month"}
            </p>
            <p className={cn("mt-1 text-xl font-extrabold tabular-nums lg:text-3xl", r.netBenefit < 0 && "text-destructive")}>
              {fmt(r.netBenefit)}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Extra profit from wins, plus the value of time you keep as spare capacity.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 lg:p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">alfred ai investment</p>
            <p className="mt-1 text-xl font-extrabold tabular-nums lg:text-3xl">
              {fmt(r.runningCosts + r.implementationCost)}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Running costs + setup spread over 12 months.
            </p>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Net benefit = extra profit from wins + value of time you keep as spare capacity − alfred ai investment. Time put into extra tenders is counted once, through the wins it creates.
        </p>


        <p className="text-xs leading-relaxed text-muted-foreground">
          Estimates, not guarantees. Results depend on real project opportunities, estimator availability, win rates and your capacity to deliver. Cost figures are examples — ask us for your quote.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="min-h-[48px] flex-1">
            <a href={BOOKING_PAGE_URL} onClick={rememberAssumptions}>
              <CalendarCheck className="mr-2 h-4 w-4" /> Book a demo
            </a>
          </Button>
          <Button size="lg" variant="outline" className="min-h-[48px]" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Save as PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TakeoffRoiCalculator;
