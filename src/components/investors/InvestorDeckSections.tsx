import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Gauge,
  MessageSquare,
  Rocket,
  Server,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  marketSizing,
  macroTailwind,
  erpComparison,
  vibeCodingSteps,
  competitorLandscape,
  revenueModel,
  pricingExamples,
  financialModel,
  strategicImperative,
  signedRevenue,
} from "@/data/investorDeck";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-xl p-4 md:p-5 ${className}`}>{children}</div>
  );
}

/** Signed revenue snapshot — the hard numbers from the deck's Traction slide. */
export function SignedRevenueCards() {
  const fmt = (v: number) =>
    v >= 1000 ? `$${v.toLocaleString("en-AU")}` : String(v);
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto mb-6">
      {signedRevenue.map((item, i) => (
        <motion.div key={item.label} {...fadeUp} transition={{ duration: 0.4, delay: i * 0.08 }}>
          <Card className="h-full text-center">
            <div className="text-lg md:text-2xl font-bold text-foreground tabular-nums">
              {item.format === "currency" ? fmt(item.value) : item.value}
            </div>
            <div className="text-[11px] md:text-xs text-muted-foreground mt-1">{item.label}</div>
            {"note" in item && item.note && (
              <div className="text-[10px] text-muted-foreground/70 mt-0.5">{item.note}</div>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

/** TAM / SAM / SOM sizing from the deck's Market Opportunity slide. */
export function MarketSizingSection() {
  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
      {marketSizing.map((tier, i) => (
        <motion.div key={tier.tier} {...fadeUp} transition={{ duration: 0.4, delay: i * 0.1 }}>
          <Card className="h-full">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {tier.tier}
            </span>
            <div className="text-2xl md:text-3xl font-bold text-foreground mt-3">{tier.value}</div>
            <div className="text-xs md:text-sm font-medium text-foreground mt-1">{tier.title}</div>
            <p className="text-[11px] md:text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {tier.description}
            </p>
          </Card>
        </motion.div>
      ))}
      <p className="md:col-span-3 text-[10px] text-muted-foreground/70 text-center">
        Sources: Grand View Research, Fortune Business Insights, Mordor Intelligence (2024–2025 construction
        & professional services software market reports).
      </p>
    </div>
  );
}

/** Data-centre construction boom — the macro tailwind slide. */
export function MacroTailwindSection() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4">
        {macroTailwind.stats.map((stat, i) => (
          <motion.div key={stat.label} {...fadeUp} transition={{ duration: 0.4, delay: i * 0.1 }}>
            <Card className="h-full">
              <div className="text-xl md:text-2xl font-bold text-primary">{stat.value}</div>
              <div className="text-[11px] md:text-xs font-semibold text-foreground uppercase tracking-wide mt-1">
                {stat.label}
              </div>
              <p className="text-[11px] md:text-xs text-muted-foreground mt-1.5 leading-relaxed">
                {stat.detail}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }}>
        <Card className="bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <Server className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                The strategic advantage
              </div>
              <p className="text-xs md:text-sm text-foreground/85 leading-relaxed">
                {macroTailwind.advantage}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

/** Traditional ERP vs alfred ai Agentic ERP. */
export function ErpParadigmSection() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="hidden md:grid grid-cols-[1fr_1fr_1.3fr] gap-3 px-4 mb-2">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Dimension</span>
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium text-center">
          Traditional ERP
        </span>
        <span className="text-[11px] uppercase tracking-wide text-primary font-semibold text-center">
          alfred ai agentic ERP
        </span>
      </div>
      <div className="space-y-2">
        {erpComparison.map((row, i) => (
          <motion.div key={row.dimension} {...fadeUp} transition={{ duration: 0.35, delay: i * 0.05 }}>
            <Card className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.3fr] gap-2 md:gap-3 md:items-center p-3 md:p-4">
              <span className="text-xs md:text-sm font-medium text-foreground">{row.dimension}</span>
              <div className="bg-muted/50 rounded px-2 py-1.5 text-center">
                <span className="text-[11px] md:text-xs text-muted-foreground">× {row.traditional}</span>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded px-2 py-1.5 text-center">
                <span className="text-[11px] md:text-xs text-primary font-medium">✓ {row.alfred}</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/** Vibe Coding — self-service OS customisation. */
export function VibeCodingSection() {
  const icons = [MessageSquare, Cpu, Zap, Rocket];
  return (
    <div className="max-w-4xl mx-auto">
      <p className="text-center text-xs md:text-sm text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed">
        alfred ai's Vibe Coding engine lets operators build, modify, and extend their own agentic workflows using
        natural language. No code. No consultants. No waiting.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {vibeCodingSteps.map((step, i) => {
          const Icon = icons[i] ?? Zap;
          return (
            <motion.div key={step.title} {...fadeUp} transition={{ duration: 0.4, delay: i * 0.1 }}>
              <Card className="h-full relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" aria-hidden />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    STEP {i + 1}
                  </span>
                </div>
                <h3 className="text-xs md:text-sm font-bold text-foreground mb-1">{step.title}</h3>
                <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
                {i < vibeCodingSteps.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 w-4 h-4 text-muted-foreground/40" aria-hidden />
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/** $1B+ invested in construction AI — category landscape. */
export function CompetitorLandscapeSection() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="overflow-x-auto -mx-3 px-3">
        <table className="w-full min-w-[640px] text-left border-separate border-spacing-y-1.5">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-1 font-medium">Company</th>
              <th className="px-3 py-1 font-medium">Origin</th>
              <th className="px-3 py-1 font-medium">Funding</th>
              <th className="px-3 py-1 font-medium">Est. rev</th>
              <th className="px-3 py-1 font-medium">Core offer & ICP</th>
            </tr>
          </thead>
          <tbody>
            {competitorLandscape.map((c) => (
              <tr key={c.company} className="bg-card">
                <td className="px-3 py-2 text-xs font-semibold text-foreground border-y border-l border-border rounded-l-lg">
                  {c.company}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground border-y border-border">{c.origin}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground border-y border-border">{c.funding}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground border-y border-border tabular-nums">
                  {c.revenue}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground border-y border-r border-border rounded-r-lg">
                  {c.offer}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground/70 text-center mt-3">
        Sources: Crunchbase, TechCrunch, PitchBook, and publicly available company data (2024–2025).
      </p>
    </div>
  );
}

/** Setup + retainer + usage meter, priced as a % of client revenue. */
export function RevenueModelSection() {
  const icons = [Target, TrendingUp, Gauge];
  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-5">
        {revenueModel.map((stream, i) => {
          const Icon = icons[i] ?? Target;
          return (
            <motion.div key={stream.title} {...fadeUp} transition={{ duration: 0.4, delay: i * 0.1 }}>
              <Card className="h-full">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Icon className="w-4 h-4 text-primary" aria-hidden />
                </div>
                <h3 className="text-xs md:text-sm font-bold text-foreground">{stream.title}</h3>
                <div className="text-[11px] md:text-xs text-primary font-semibold mt-0.5">{stream.rate}</div>
                <p className="text-[11px] md:text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {stream.description}
                </p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center mb-2">
        Pricing examples by client size
      </h3>
      <div className="overflow-x-auto -mx-3 px-3 mb-5">
        <table className="w-full min-w-[520px] text-left border-separate border-spacing-y-1.5">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-1 font-medium">Client revenue</th>
              <th className="px-3 py-1 font-medium">Setup fee (one-off)</th>
              <th className="px-3 py-1 font-medium">Annual retainer</th>
              <th className="px-3 py-1 font-medium">3-year LTV</th>
            </tr>
          </thead>
          <tbody>
            {pricingExamples.map((row) => (
              <tr key={row.clientRevenue} className="bg-card">
                <td className="px-3 py-2 text-xs font-semibold text-foreground border-y border-l border-border rounded-l-lg tabular-nums">
                  {row.clientRevenue}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground border-y border-border tabular-nums">{row.setup}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground border-y border-border tabular-nums">{row.retainer}</td>
                <td className="px-3 py-2 text-xs text-primary font-medium border-y border-r border-border rounded-r-lg tabular-nums">
                  {row.ltv}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {[
          { value: "65%", label: "Gross margin" },
          { value: "95%", label: "Retention" },
          { value: "$150K+", label: "Avg 3yr LTV" },
        ].map((m) => (
          <div key={m.label} className="bg-muted border border-border rounded-full px-3 py-1.5 flex items-center gap-2">
            <span className="text-xs font-bold text-foreground tabular-nums">{m.value}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Financial model breakdown table 2026–2031. */
export function FinancialModelTable() {
  return (
    <div className="max-w-4xl mx-auto mt-6">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center mb-2">
        Financial model breakdown
      </h3>
      <div className="overflow-x-auto -mx-3 px-3">
        <table className="w-full min-w-[560px] text-left border-separate border-spacing-y-1.5">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-1 font-medium">Year</th>
              <th className="px-3 py-1 font-medium">Clients</th>
              <th className="px-3 py-1 font-medium">Retainer</th>
              <th className="px-3 py-1 font-medium">Setup</th>
              <th className="px-3 py-1 font-medium">Usage</th>
              <th className="px-3 py-1 font-medium">Total rev</th>
            </tr>
          </thead>
          <tbody>
            {financialModel.map((row) => (
              <tr key={row.year} className="bg-card">
                <td className="px-3 py-2 text-xs font-semibold text-foreground border-y border-l border-border rounded-l-lg">
                  {row.year}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground border-y border-border tabular-nums">
                  {row.clients.toLocaleString("en-AU")}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground border-y border-border tabular-nums">{row.retainer}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground border-y border-border tabular-nums">{row.setup}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground border-y border-border tabular-nums">{row.usage}</td>
                <td className="px-3 py-2 text-xs text-primary font-bold border-y border-r border-border rounded-r-lg tabular-nums">
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** The window is open — urgency and execution plan. */
export function StrategicImperativeSection() {
  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">The urgency</h3>
        <div className="space-y-2">
          {strategicImperative.urgency.map((item, i) => (
            <motion.div key={item.title} {...fadeUp} transition={{ duration: 0.35, delay: i * 0.08 }}>
              <Card className="p-3 md:p-4">
                <h4 className="text-xs md:text-sm font-bold text-foreground mb-1">{item.title}</h4>
                <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">The execution</h3>
        <div className="space-y-2">
          {strategicImperative.execution.map((item, i) => (
            <motion.div key={item.title} {...fadeUp} transition={{ duration: 0.35, delay: i * 0.08 }}>
              <Card className="p-3 md:p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" aria-hidden />
                  <div>
                    <h4 className="text-xs md:text-sm font-bold text-foreground mb-1">{item.title}</h4>
                    <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
