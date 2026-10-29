import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Play, LayoutGrid, Eye, Sparkles, Flame, ArrowRight, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SectionHeading,
  MetricValue,
  StatusPill,
  CompletionMoment,
  DemoEmptyState,
  DemoLoadingState,
} from "@/components/ux";
import type { Demo, DemoCategory } from "@/pages/resources/demosData";

interface ViewCount {
  total_views: number;
  views_30d: number;
  views_7d: number;
}

interface DemosDashboardProps {
  demos: Demo[];
  categories: DemoCategory[];
  viewCounts: Record<string, ViewCount>;
  isLoading?: boolean;
  activeCategory: string;
  onSelectCategory: (categoryId: string) => void;
  onOpenDemo: (demoId: string) => void;
  className?: string;
}

/**
 * DemosDashboard — the "cockpit" landing surface for the interactive demos.
 * Built entirely on the Step 1 foundation primitives:
 *  - MetricValue      → tabular-nums KPI figures (Principles 14–15)
 *  - StatusPill       → icon + label status chips, never colour-only (Principle 18)
 *  - SectionHeading   → hierarchy through size/weight (Principles 2–3)
 *  - CompletionMoment → peak-end reassurance panel (Principles 40/44)
 *  - DemoEmptyState / DemoLoadingState → designed empty & loading states (Principle 10/50)
 *
 * Presentation only — all demo data, routing and view tracking stay in DemosPage.
 * Fallback: on load failure viewCounts is simply empty, so figures render 0
 * rather than dead-ending the page.
 */
function DemosDashboardInner({
  demos,
  categories,
  viewCounts,
  isLoading = false,
  activeCategory,
  onSelectCategory,
  onOpenDemo,
  className,
}: DemosDashboardProps) {
  const stats = useMemo(() => {
    const interactive = demos.filter((d) => d.isInteractive).length;
    const totalViews = demos.reduce(
      (sum, d) => sum + (viewCounts[d.id]?.total_views ?? 0),
      0,
    );
    const activeCats = new Set(demos.map((d) => d.category)).size;
    return { interactive, totalViews, activeCats };
  }, [demos, viewCounts]);

  // Trending: top demos by 7-day views, fall back to total views, then featured.
  const trending = useMemo(() => {
    return [...demos]
      .map((d) => ({
        demo: d,
        recent: viewCounts[d.id]?.views_7d ?? 0,
        total: viewCounts[d.id]?.total_views ?? 0,
      }))
      .sort((a, b) => b.recent - a.recent || b.total - a.total)
      .slice(0, 4);
  }, [demos, viewCounts]);

  // Per-category counts for the quick-nav cockpit grid.
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    demos.forEach((d) => counts.set(d.category, (counts.get(d.category) ?? 0) + 1));
    return categories
      .filter((c) => c.id !== "all")
      .map((c) => ({ ...c, count: counts.get(c.id) ?? 0 }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [demos, categories]);

  const metrics: { label: string; value: number; icon: typeof Play }[] = [
    { label: "Interactive demos", value: demos.length, icon: Play },
    { label: "Hands-on experiences", value: stats.interactive, icon: MousePointerClick },
    { label: "Business categories", value: stats.activeCats, icon: LayoutGrid },
    { label: "Total demo views", value: stats.totalViews, icon: Eye },
  ];

  return (
    <section
      className={cn("py-12 md:py-16 bg-background", className)}
      aria-label="Demo cockpit overview"
    >
      <div className="container-wide">
        <SectionHeading
          eyebrow="Demo Cockpit"
          title="Everything alfred ai can do, at a glance"
          description="Jump straight into a live workflow, follow what's trending, or explore by business function — every demo runs end-to-end in your browser."
        />

        {/* KPI row — tabular-nums figures via MetricValue */}
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                </div>
                <MetricValue value={m.value.toLocaleString()} label={m.label} size="lg" />
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {/* Trending / quick-launch — spans two columns on desktop */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" aria-hidden />
              <h3 className="text-lg font-semibold text-foreground">Trending now</h3>
            </div>

            {isLoading ? (
              <DemoLoadingState rows={4} />
            ) : trending.length === 0 ? (
              <DemoEmptyState
                icon={Sparkles}
                title="No demos to show yet"
                description="New interactive demos are added regularly — check back soon."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {trending.map(({ demo, recent }) => {
                  const Icon = demo.icon;
                  return (
                    <button
                      key={demo.id}
                      onClick={() => onOpenDemo(demo.id)}
                      className="group flex min-h-touch flex-col rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-md active:bg-muted/50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-4.5 w-4.5 text-primary" aria-hidden />
                        </div>
                        <StatusPill
                          status={demo.isInteractive ? "ontrack" : "neutral"}
                          label={demo.isInteractive ? "Interactive" : "Preview"}
                          size="sm"
                        />
                      </div>
                      <h4 className="mt-3 line-clamp-1 font-semibold text-foreground group-hover:text-primary">
                        {demo.title}
                      </h4>
                      <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">
                        {demo.description}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                          <span className="tabular-nums">{recent.toLocaleString()}</span> this week
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          Launch <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Category cockpit quick-nav */}
            <div className="mt-8 mb-4 flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" aria-hidden />
              <h3 className="text-lg font-semibold text-foreground">Explore by function</h3>
            </div>
            {categoryCounts.length === 0 ? (
              <DemoEmptyState icon={LayoutGrid} title="No categories available" />
            ) : (
              <div className="flex flex-wrap gap-2">
                {categoryCounts.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => onSelectCategory(cat.id)}
                      aria-pressed={isActive}
                      className={cn(
                        "inline-flex min-h-touch items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all",
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/50",
                      )}
                    >
                      {cat.label}
                      <span className="tabular-nums rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Peak-end reassurance panel */}
          <div className="lg:col-span-1">
            <CompletionMoment
              title="What these demos prove"
              icon={Sparkles}
              didItems={[
                "alfred ai reads your documents and extracts every field automatically",
                "It works end-to-end — from intake to submission-ready output",
                "Every result recalculates the moment your inputs change",
                "Nothing to install: each workflow runs live, right here",
              ]}
            />
            <div className="mt-4 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Play className="h-4.5 w-4.5 text-primary" aria-hidden />
                <h4 className="font-semibold text-foreground">New to alfred ai?</h4>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Start with a trending demo above — most run in under two minutes and
                need zero setup.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export const DemosDashboard = memo(DemosDashboardInner);
DemosDashboard.displayName = "DemosDashboard";

export default DemosDashboard;
