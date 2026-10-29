import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Map, Cpu, LineChart } from "lucide-react";
import CollapsibleSection, { CollapsibleGroup } from "@/components/mobile/CollapsibleSection";
import AgenticExecutionLoop from "@/components/diagrams/AgenticExecutionLoop";

const HowItWorksSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    {
      number: "01",
      icon: Map,
      title: "Map Workflows & Outcomes",
      description:
        "We start by understanding your current operations, identifying where time is lost, and defining the outcomes that matter to your business.",
    },
    {
      number: "02",
      icon: Cpu,
      title: "Deploy AI Where It Matters",
      description:
        "alfred ai engines are deployed strategically — automating high-impact areas while connecting to your existing systems without disruption.",
    },
    {
      number: "03",
      icon: LineChart,
      title: "Measure & Optimise Impact",
      description:
        "Continuous monitoring and optimisation ensure you're always seeing results. Regular impact reviews keep everything aligned with your goals.",
    },
  ];

  return (
    <section ref={ref} className="section-padding bg-background">
      <div className="container-wide">
        <motion.div
          className="max-w-3xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">How It Works</span>
          <h2 className="section-heading">
            From assessment to impact.{" "}
            <span className="text-muted-foreground">In weeks, not months.</span>
          </h2>
          <p className="section-subtitle">
            No system replacement. No 18-month implementation. Just focused deployment 
            where it matters most.
          </p>
        </motion.div>

        {/* Desktop: Timeline with connection line */}
        <div className="relative hidden md:block">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.2 }}
              >
                <div className="card-base p-8 relative z-10">
                  {/* Step Number */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-5xl font-bold text-muted/80">{step.number}</span>
                    <div className="icon-container-md icon-container-primary">
                      <step.icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile: Collapsible accordion */}
        <motion.div
          className="md:hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <CollapsibleGroup>
            {steps.map((step, index) => (
              <CollapsibleSection
                key={index}
                title={step.title}
                icon={step.icon}
                badge={step.number}
                defaultOpen={index === 0}
              >
                <p className="text-muted-foreground text-sm leading-relaxed pl-11">
                  {step.description}
                </p>
              </CollapsibleSection>
            ))}
          </CollapsibleGroup>
        </motion.div>

        {/* Execution Loop - with integrated reassurance message */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="text-center mb-8">
            <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
              The Execution Loop
            </h3>
            <p className="text-muted-foreground">
              Every task follows our proven human-AI collaboration framework
            </p>
          </div>
          <AgenticExecutionLoop variant="compact" />
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
