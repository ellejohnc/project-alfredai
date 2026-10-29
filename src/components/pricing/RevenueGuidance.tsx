import { motion } from "framer-motion";
import { TrendingUp, Target, ArrowRight, Sparkles } from "lucide-react";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { cn } from "@/lib/utils";

const investmentBenchmarks = [
  {
    revenueRange: "$1M - $5M",
    recommendedInvestment: "$10K - $30K",
    description: "Starter automation package",
    workflows: "2-4 workflows",
  },
  {
    revenueRange: "$5M - $20M",
    recommendedInvestment: "$30K - $80K",
    description: "Growth transformation",
    workflows: "4-8 workflows",
  },
  {
    revenueRange: "$20M - $100M",
    recommendedInvestment: "$80K - $200K",
    description: "Scale operations",
    workflows: "8-15 workflows",
  },
  {
    revenueRange: "$100M+",
    recommendedInvestment: "$200K+",
    description: "Enterprise intelligence",
    workflows: "15+ workflows",
  },
];

export function RevenueGuidance() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-muted/30 to-background">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 mb-4">
            <Target className="w-3 h-3" />
            Investment Guidance
          </span>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Optimal AI Investment by Revenue
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Best-in-class companies invest <strong>0.5% - 1.5%</strong> of annual revenue in AI transformation 
            to achieve full operational efficiency.
          </p>
        </motion.div>

        {/* Investment Benchmark Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {investmentBenchmarks.map((benchmark, idx) => (
            <motion.div
              key={benchmark.revenueRange}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "p-6 rounded-xl border transition-all duration-300",
                "bg-background hover:shadow-lg hover:border-primary/30",
                idx === 1 && "border-primary/50 shadow-lg relative"
              )}
            >
              {idx === 1 && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                  Most Popular
                </span>
              )}
              <div className="space-y-3">
                <p className="text-lg font-bold text-primary">{benchmark.revenueRange}</p>
                <div className="h-px bg-border" />
                <div>
                  <p className="text-2xl font-bold">{benchmark.recommendedInvestment}</p>
                  <p className="text-xs text-muted-foreground">Recommended investment</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{benchmark.description}</p>
                  <p className="text-xs text-muted-foreground">{benchmark.workflows}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Key Insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-primary/20"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-semibold mb-2">
                The Compounding Returns of Agentic AI
              </h3>
              <p className="text-muted-foreground">
                Unlike traditional software, your AI workforce becomes <strong>more valuable over time</strong>.
                As agents learn your business patterns, efficiency compounds—delivering{" "}
                <span className="text-primary font-semibold">10-20% additional value</span> each quarter 
                through adaptive learning and optimization.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <TrendingUp className="w-5 h-5" />
              <span>Quarterly gains</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
