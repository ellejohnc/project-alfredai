import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Target, PieChart } from "lucide-react";
import { useRef } from "react";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";

// Figures aligned to the alfred ai pitch deck (Late Seed, Late 2026).
// "recurring" = annual retainer + usage meter; "setup" = one-off implementation.
const projectionData = [
  { year: 2024, yearLabel: "2024", recurring: 0.002, setup: 0.003, total: 0.005, totalLabel: "$5K", label: "Seed" },
  { year: 2025, yearLabel: "2025", recurring: 0.01, setup: 0.09, total: 0.1, totalLabel: "$100K", label: "Growth" },
  { year: 2026, yearLabel: "2026", recurring: 0.38, setup: 0.34, total: 0.72, totalLabel: "$0.72M", label: "Now" },
  { year: 2027, yearLabel: "2027", recurring: 1.65, setup: 1.2, total: 2.85, totalLabel: "$2.85M", label: "Expand" },
  { year: 2028, yearLabel: "2028", recurring: 7.03, setup: 3.0, total: 10.03, totalLabel: "$10.03M", label: "Accelerate" },
  { year: 2029, yearLabel: "2029", recurring: 16.62, setup: 5.6, total: 22.2, totalLabel: "$22.2M", label: "Scale Up" },
  { year: 2030, yearLabel: "2030", recurring: 31.6, setup: 8.4, total: 40.0, totalLabel: "$40M", label: "Momentum" },
  { year: 2031, yearLabel: "2031", recurring: 50.4, setup: 11.2, total: 61.6, totalLabel: "$61.6M", label: "Dominance" },
];

const dataLeft = projectionData.filter(d => d.year <= 2028);
const dataRight = projectionData;

const chartConfig = {
  recurring: {
    label: "Recurring Revenue",
    color: "hsl(var(--primary))",
  },
  setup: {
    label: "Setup Revenue",
    color: "hsl(142, 76%, 36%)",
  },
} satisfies ChartConfig;

const metrics = [
  { 
    label: "Gross Margin", 
    value: 65,
    prefix: "",
    suffix: "%",
    sublabel: "Software-like margins", 
    icon: PieChart,
    progress: 65 
  },
  { 
    label: "2026 Revenue", 
    value: 0.72,
    prefix: "$",
    suffix: "M",
    sublabel: "18 clients signed", 
    icon: DollarSign,
    progress: 100 
  },
  { 
    label: "Retention", 
    value: 95,
    prefix: "",
    suffix: "%",
    sublabel: "Client retention rate", 
    icon: TrendingUp,
    progress: 95 
  },
  { 
    label: "2031 Target", 
    value: 61.6,
    prefix: "$",
    suffix: "M",
    sublabel: "1,008 clients projected", 
    icon: Target,
    progress: 100 
  },
];

// Custom dot component for the chart
const RecurringDot = (props: any) => {
  const { cx, cy } = props;
  if (!cx || !cy) return null;
  
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="hsl(var(--primary))"
      stroke="hsl(var(--background))"
      strokeWidth={2}
    />
  );
};

const SetupDot = (props: any) => {
  const { cx, cy } = props;
  if (!cx || !cy) return null;
  
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="hsl(142, 76%, 36%)"
      stroke="hsl(var(--background))"
      strokeWidth={2}
    />
  );
};

export default function RevenueProjectionChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="bg-card border border-border rounded-2xl p-6 md:p-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-1">Revenue Projection</h3>
          <p className="text-sm text-muted-foreground">Path to $10M ARR by 2028 and $60M by 2031</p>
        </div>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-primary" />
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Recurring & AI Token</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5" style={{ backgroundColor: "hsl(142, 76%, 36%)" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "hsl(142, 76%, 36%)" }} />
            <span className="text-sm text-muted-foreground">Setup (Non-Recurring)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Left Chart: 2024-2030 (Near-term) */}
        <div className="bg-muted/30 rounded-xl p-4 md:p-6">
          <p className="text-sm font-semibold text-foreground mb-4">Near-Term (2024–2028)</p>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={dataLeft}
                margin={{ top: 10, right: 15, bottom: 20, left: 15 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="year" type="number" domain={[2024, 2028]}
                  ticks={[2024, 2025, 2026, 2027, 2028]}
                  axisLine={false} tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} dy={10}
                />
                <YAxis 
                  axisLine={false} tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  domain={[0, 12]} ticks={[0, 2, 4, 6, 8, 10, 12]}
                  tickFormatter={(value) => {
                    if (value === 0) return "$0";
                    if (value < 1) return `$${Math.round(value * 1000)}K`;
                    return `$${value}M`;
                  }}
                />
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    const formatValue = (val: number) => val >= 1 ? `$${val}M` : `$${Math.round(val * 1000)}K`;
                    return (
                      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                        <p className="font-semibold text-foreground mb-1">{data.year}</p>
                        <div className="space-y-1">
                          <p className="text-sm text-primary font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            Recurring: {formatValue(data.recurring)}
                          </p>
                          <p className="text-sm font-medium flex items-center gap-2" style={{ color: "hsl(142, 76%, 36%)" }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(142, 76%, 36%)" }} />
                            Setup: {formatValue(data.setup)}
                          </p>
                          <p className="text-xs text-muted-foreground pt-1 border-t border-border">Total: {data.totalLabel}</p>
                        </div>
                      </div>
                    );
                  }}
                />
                <Line type="monotone" dataKey="recurring" stroke="hsl(var(--primary))" strokeWidth={3} dot={<RecurringDot />} activeDot={{ r: 8, fill: "hsl(var(--primary))" }} animationDuration={1200} />
                <Line type="monotone" dataKey="setup" stroke="hsl(142, 76%, 36%)" strokeWidth={3} dot={<SetupDot />} activeDot={{ r: 8, fill: "hsl(142, 76%, 36%)" }} animationDuration={1200} animationBegin={300} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="flex justify-around mt-3 px-2">
            {dataLeft.map((d) => (
              <div key={d.year} className="text-center">
                <p className="text-xs font-semibold text-foreground">{d.totalLabel}</p>
                <p className="text-[10px] text-muted-foreground">{d.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Chart: 2024-2035 (Full Vision) */}
        <div className="bg-muted/30 rounded-xl p-4 md:p-6">
          <p className="text-sm font-semibold text-foreground mb-4">Full Vision (2024–2031)</p>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={dataRight}
                margin={{ top: 10, right: 15, bottom: 20, left: 15 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="year" type="number" domain={[2024, 2031]}
                  ticks={[2024, 2026, 2028, 2030, 2031]}
                  axisLine={false} tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} dy={10}
                />
                <YAxis 
                  axisLine={false} tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  domain={[0, 70]} ticks={[0, 10, 20, 40, 60, 70]}
                  tickFormatter={(value) => {
                    if (value === 0) return "$0";
                    return `$${value}M`;
                  }}
                />
                <ReferenceLine x={2028} stroke="hsl(var(--border))" strokeDasharray="5 5" />
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    const formatValue = (val: number) => val >= 1 ? `$${val}M` : `$${Math.round(val * 1000)}K`;
                    return (
                      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                        <p className="font-semibold text-foreground mb-1">{data.year}</p>
                        <div className="space-y-1">
                          <p className="text-sm text-primary font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            Recurring: {formatValue(data.recurring)}
                          </p>
                          <p className="text-sm font-medium flex items-center gap-2" style={{ color: "hsl(142, 76%, 36%)" }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(142, 76%, 36%)" }} />
                            Setup: {formatValue(data.setup)}
                          </p>
                          <p className="text-xs text-muted-foreground pt-1 border-t border-border">Total: {data.totalLabel}</p>
                        </div>
                      </div>
                    );
                  }}
                />
                <Line type="monotone" dataKey="recurring" stroke="hsl(var(--primary))" strokeWidth={3} dot={<RecurringDot />} activeDot={{ r: 8, fill: "hsl(var(--primary))" }} animationDuration={1200} />
                <Line type="monotone" dataKey="setup" stroke="hsl(142, 76%, 36%)" strokeWidth={3} dot={<SetupDot />} activeDot={{ r: 8, fill: "hsl(142, 76%, 36%)" }} animationDuration={1200} animationBegin={300} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="flex justify-around mt-3 px-2">
            {dataRight.filter((_, i) => i % 2 === 1).map((d) => (
              <div key={d.year} className="text-center">
                <p className="text-xs font-semibold text-foreground">{d.totalLabel}</p>
                <p className="text-[10px] text-muted-foreground">{d.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            viewport={{ once: true }}
            className="relative p-5 rounded-xl bg-muted/50 border border-border overflow-hidden group hover:border-primary/30 transition-colors"
          >
            {/* Progress bar background */}
            <div 
              className="absolute bottom-0 left-0 h-1 bg-primary/20 transition-all duration-500"
              style={{ width: '100%' }}
            />
            <div 
              className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-1000"
              style={{ width: `${metric.progress}%` }}
            />
            
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <metric.icon className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground mb-1">
              <AnimatedNumber 
                value={metric.value} 
                prefix={metric.prefix} 
                suffix={metric.suffix}
                decimals={metric.value % 1 !== 0 ? 1 : 0}
                duration={1800 + i * 200}
              />
            </p>
            <p className="text-xs text-muted-foreground">{metric.sublabel}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
