import { motion } from "framer-motion";
import { 
  Layers, 
  RefreshCcw, 
  CreditCard, 
  Mic, 
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface PricingComponent {
  id: string;
  title: string;
  subtitle: string;
  range: string;
  description: string;
  highlights: string[];
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const pricingComponents: PricingComponent[] = [
  {
    id: "setup",
    title: "Setup & Implementation",
    subtitle: "Agentic Workflow Deployment",
    range: "$5,000 - $12,000 per workflow",
    description: "Building your AI workforce from the ground up",
    highlights: [
      "AI agent design & configuration",
      "Tool & system integrations",
      "Team training & onboarding",
      "Go-live support & optimization"
    ],
    icon: Layers,
    accentColor: "text-primary",
  },
  {
    id: "monthly",
    title: "Monthly Retainer",
    subtitle: "Agentic Operations",
    range: "$250 - $3,500/month",
    description: "Keeping your AI workforce at peak performance",
    highlights: [
      "Unlimited AI executions",
      "Priority support & monitoring",
      "Continuous optimization",
      "Regular performance reviews"
    ],
    icon: RefreshCcw,
    accentColor: "text-secondary",
  },
  {
    id: "usage",
    title: "Usage Credits",
    subtitle: "Pay-As-You-Use",
    range: "$0.01 - $0.40 per action",
    description: "External communications at scale",
    highlights: [
      "Voice AI: from $0.18/min",
      "SMS: $0.03/message",
      "Email: $1 per 100 emails",
      "Tokens: from $0.88 per 10k"
    ],
    icon: CreditCard,
    accentColor: "text-amber-500",
  },
  {
    id: "voice",
    title: "Voice AI Agent",
    subtitle: "Conversational AI",
    range: "$99 - $3,900/month",
    description: "24/7 phone conversations handled by AI",
    highlights: [
      "Natural language understanding",
      "24/7 availability",
      "CRM & system integration",
      "Setup: $2,500/workflow"
    ],
    icon: Mic,
    accentColor: "text-purple-500",
  },
];

export function PricingComponentsGrid() {
  const isMobile = useIsMobile();

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20 mb-4">
            <Layers className="w-3 h-3" />
            Pricing Breakdown
          </span>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            What's Included in Your Investment
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Transparent pricing with no hidden fees. Every component designed 
            to maximize your operational efficiency.
          </p>
        </motion.div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {pricingComponents.map((component, idx) => {
            const Icon = component.icon;
            return (
              <motion.div
                key={component.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "group p-6 rounded-xl border transition-all duration-300",
                  "bg-background hover:shadow-lg hover:border-primary/30",
                  "relative overflow-hidden"
                )}
              >
                {/* Background Gradient on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                  {/* Icon & Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                      "bg-muted group-hover:bg-primary/10 transition-colors"
                    )}>
                      <Icon className={cn("w-6 h-6", component.accentColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground mb-0.5">
                        {component.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {component.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border/50">
                    <p className={cn("text-lg font-bold", component.accentColor)}>
                      {component.range}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {component.description}
                    </p>
                  </div>

                  {/* Highlights */}
                  <ul className="space-y-2">
                    {component.highlights.map((highlight, hidx) => (
                      <li 
                        key={hidx}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle className={cn("w-4 h-4 flex-shrink-0", component.accentColor)} />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground mb-4">
            <strong className="text-foreground">Volume discounts</strong> available 
            for 3+ workflows. <strong className="text-foreground">Enterprise pricing</strong> for 
            251+ team members.
          </p>
          <a
            href="#pricing-chatbot"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Calculate your investment above
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
