import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  FileStack,
  Boxes,
  Cpu,
  Bot,
  Eye,
  LayoutGrid,
  Check,
  X,
  Minus,
  ArrowRight,
  ArrowDown,
} from "lucide-react";
import { Engine6 } from "@/components/icons/Engine6";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

/* ------------------------------------------------------------------ */
/* System architecture diagram                                         */
/* ------------------------------------------------------------------ */

const inputs = [
  "Tenders & drawings",
  "Contracts & variations",
  "SOPs & policies",
  "Project & risk records",
  "Emails & meeting notes",
  "Pricing & commercial logic",
];

const outputs = [
  { icon: Bot, name: "Butler agents" },
  { icon: Eye, name: "Watch dashboards" },
  { icon: LayoutGrid, name: "AOS" },
];

const engineStages = [
  { icon: FileStack, label: "Capture", desc: "Pulls in your scattered knowledge" },
  { icon: Boxes, label: "Structure", desc: "Organises it into a usable layer" },
  { icon: Cpu, label: "Ground", desc: "Anchors AI in your real context" },
];

function SystemDiagram() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container-wide">
        <motion.div {...fadeUp} className="max-w-2xl mb-12 md:mb-16">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-px w-6 bg-primary/60" />
            System overview
          </span>
          <h2 className="text-2xl md:text-[2rem] md:leading-[1.15] font-bold text-foreground tracking-tight mt-3 mb-3">
            How Axiom fits into your stack
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Scattered business knowledge flows into the Axiom engine, which structures and grounds it, then powers
            every AI tool that runs your operations.
          </p>
        </motion.div>

        {/* Three-stage flow: In → Engine → Out */}
        <div className="grid lg:grid-cols-[1fr_auto_1.25fr_auto_1fr] items-stretch gap-4 lg:gap-3">
          {/* Inputs */}
          <motion.div
            {...fadeUp}
            className="relative flex flex-col rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm"
          >
            <div className="flex items-center gap-2.5 mb-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <FileStack className="w-4 h-4 text-muted-foreground" />
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">
                1
              </span>
            </div>
            <div className="mt-3 mb-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
                Your knowledge
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Scattered across your business</p>
            </div>
            <ul className="space-y-2">
              {inputs.map((i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-xs font-medium text-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                  {i}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Connector: flows in */}
          <div className="flex lg:flex-col items-center justify-center gap-2 py-1 lg:py-0">
            <div className="hidden lg:block h-px w-full min-w-[28px] bg-gradient-to-r from-border to-primary/50" />
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm">
              <ArrowRight className="hidden lg:block w-4 h-4" />
              <ArrowDown className="lg:hidden w-4 h-4" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground whitespace-nowrap">
              Flows in
            </span>
          </div>

          {/* Engine — light, on-brand */}
          <motion.div
            {...fadeUp}
            className="relative flex flex-col rounded-2xl border-2 border-primary/30 bg-card p-5 md:p-6 shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.25)] ring-1 ring-primary/5"
          >
            <div className="pointer-events-none absolute inset-x-0 -top-12 h-32 bg-primary/10 blur-3xl" />
            <div className="relative flex flex-col items-center text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                Core engine
              </span>
              <Engine6 className="w-14 h-14 text-primary mt-4 mb-3" />
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-1.5">Axiom engine</h3>
              <p className="text-sm text-muted-foreground mb-6">Structures &amp; grounds your context</p>
            </div>
            <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
              {engineStages.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="flex flex-col items-center text-center gap-2"
                  >
                    <Icon className="w-7 h-7 text-primary" />
                    <span className="text-sm font-bold text-foreground">{s.label}</span>
                    <span className="text-xs leading-snug text-muted-foreground max-w-[160px]">{s.desc}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Connector: powers */}
          <div className="flex lg:flex-col items-center justify-center gap-2 py-1 lg:py-0">
            <div className="hidden lg:block h-px w-full min-w-[28px] bg-gradient-to-r from-primary/50 to-border" />
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm">
              <ArrowRight className="hidden lg:block w-4 h-4" />
              <ArrowDown className="lg:hidden w-4 h-4" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground whitespace-nowrap">
              Powers
            </span>
          </div>

          {/* Outputs */}
          <motion.div
            {...fadeUp}
            className="relative flex flex-col rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm"
          >
            <div className="flex items-center gap-2.5 mb-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Cpu className="w-4 h-4 text-muted-foreground" />
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">
                3
              </span>
            </div>
            <div className="mt-3 mb-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
                AI that works
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Running your operations</p>
            </div>
            <ul className="space-y-2">
              {outputs.map((o) => {
                const Icon = o.icon;
                return (
                  <li
                    key={o.name}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-3 text-xs font-medium text-foreground"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 shrink-0">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                    </span>
                    {o.name}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Comparison table                                                    */
/* ------------------------------------------------------------------ */

type Cell = "yes" | "no" | "partial";

const comparisonRows: { feature: string; generic: Cell; rag: Cell; axiom: Cell }[] = [
  { feature: "Answers general questions", generic: "yes", rag: "yes", axiom: "yes" },
  { feature: "Reads your documents", generic: "no", rag: "yes", axiom: "yes" },
  { feature: "Understands your pricing & risk logic", generic: "no", rag: "partial", axiom: "yes" },
  { feature: "Knows your SOPs & approval rules", generic: "no", rag: "partial", axiom: "yes" },
  { feature: "Applies your commercial judgement", generic: "no", rag: "no", axiom: "yes" },
  { feature: "Powers agents, dashboards & automation", generic: "no", rag: "no", axiom: "yes" },
  { feature: "Tested against real project scenarios", generic: "no", rag: "no", axiom: "yes" },
  { feature: "Maintained as your business changes", generic: "no", rag: "no", axiom: "yes" },
];

function CellMark({ value }: { value: Cell }) {
  if (value === "yes")
    return (
      <span className="inline-flex w-6 h-6 rounded-full bg-primary/15 items-center justify-center">
        <Check className="w-3.5 h-3.5 text-primary" />
      </span>
    );
  if (value === "partial")
    return (
      <span className="inline-flex w-6 h-6 rounded-full bg-muted items-center justify-center">
        <Minus className="w-3.5 h-3.5 text-muted-foreground" />
      </span>
    );
  return (
    <span className="inline-flex w-6 h-6 rounded-full bg-muted items-center justify-center">
      <X className="w-3.5 h-3.5 text-muted-foreground/60" />
    </span>
  );
}

function ComparisonTable() {
  return (
    <section className="py-14 md:py-20 bg-muted/30 border-y border-border">
      <div className="container-wide">
        <motion.div {...fadeUp} className="max-w-2xl mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            Generic AI vs document chatbots vs Axiom
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Uploading PDFs into a chatbot is a start. Axiom goes further — structuring knowledge, modelling judgement,
            and grounding every output in how your business actually operates.
          </p>
        </motion.div>

        <motion.div {...fadeUp} className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Capability
                </th>
                <th className="p-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Generic AI
                </th>
                <th className="p-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Doc chatbot
                </th>
                <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-foreground bg-primary/5">
                  Axiom
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.feature} className="border-b border-border last:border-0">
                  <td className="p-4 text-sm font-medium text-foreground">{row.feature}</td>
                  <td className="p-4 text-center">
                    <CellMark value={row.generic} />
                  </td>
                  <td className="p-4 text-center">
                    <CellMark value={row.rag} />
                  </td>
                  <td className="p-4 text-center bg-primary/5">
                    <CellMark value={row.axiom} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Impact graphs                                                       */
/* ------------------------------------------------------------------ */

const accuracyData = [
  { name: "Generic AI", value: 41 },
  { name: "Doc chatbot", value: 63 },
  { name: "Axiom", value: 94 },
];

const adoptionData = [
  { month: "Month 1", value: 22 },
  { month: "Month 2", value: 48 },
  { month: "Month 3", value: 67 },
  { month: "Month 4", value: 81 },
  { month: "Month 5", value: 89 },
  { month: "Month 6", value: 95 },
];

const chartTooltip = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.75rem",
    fontSize: "12px",
    color: "hsl(var(--foreground))",
  },
  labelStyle: { color: "hsl(var(--muted-foreground))" },
};

function ImpactGraphs() {
  return (
    <section className="py-14 md:py-20 bg-background">
      <div className="container-wide">
        <motion.div {...fadeUp} className="max-w-2xl mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            The measurable impact
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Illustrative benchmarks from grounding AI in business-specific context versus running it generically.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-5 md:gap-6">
          {/* Bar chart */}
          <motion.div {...fadeUp} className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-base font-bold text-foreground mb-1">Answer accuracy on real tasks</h3>
            <p className="text-xs text-muted-foreground mb-5">% of outputs accepted without rework</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={accuracyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    unit="%"
                  />
                  <Tooltip cursor={{ fill: "hsl(var(--muted))" }} formatter={(v) => [`${v}%`, "Accepted"]} {...chartTooltip} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Line chart */}
          <motion.div {...fadeUp} className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-base font-bold text-foreground mb-1">Team adoption after rollout</h3>
            <p className="text-xs text-muted-foreground mb-5">% of staff using AI in daily workflows</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={adoptionData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    unit="%"
                  />
                  <Tooltip formatter={(v) => [`${v}%`, "Adoption"]} {...chartTooltip} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default function AxiomVisuals() {
  return (
    <>
      <SystemDiagram />
      <ComparisonTable />
      <ImpactGraphs />
    </>
  );
}
