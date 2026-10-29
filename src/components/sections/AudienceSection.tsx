import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

const AudienceSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [activeTab, setActiveTab] = useState<"role" | "industry">("role");

  const roles = [
    { title: "Founder / CEO", description: "Strategic execution assurance and board-ready visibility" },
    { title: "CFO", description: "Clear ROI metrics and headcount efficiency tracking" },
    { title: "Operations Lead", description: "Workflow automation, accountability, and risk management" },
  ];

  const industries = [
    { title: "Professional Services", description: "Consulting, legal, accounting firms • $10M–$300M revenue • 20–500 staff" },
    { title: "Property & Real Estate", description: "Property management, development • $10M–$300M revenue • 20–500 staff" },
    { title: "Construction & Trades", description: "Builders, contractors, trades • $10M–$300M revenue • 20–500 staff" },
    { title: "Insurance & Risk", description: "Brokers, underwriters, claims • $10M–$300M revenue • 20–500 staff" },
  ];

  const activeData = activeTab === "role" ? roles : industries;

  return (
    <section ref={ref} className="section-padding bg-background-alt">
      <div className="container-wide">
        <motion.div
          className="max-w-3xl mx-auto text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">Who It's For</span>
          <h2 className="section-heading">
            Built for mid-market firms.{" "}
            <span className="text-muted-foreground">Where execution matters.</span>
          </h2>
          <p className="section-subtitle">
            $10M–$300M revenue. 20–500 staff. Leadership that needs execution visibility, 
            accountability, and scale — without adding headcount.
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <motion.div
          className="flex justify-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="inline-flex p-1 bg-muted rounded-lg">
            <button
              onClick={() => setActiveTab("role")}
              className={cn(
                "px-6 py-2.5 text-sm font-medium rounded-md transition-all",
                activeTab === "role"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              By Role
            </button>
            <button
              onClick={() => setActiveTab("industry")}
              className={cn(
                "px-6 py-2.5 text-sm font-medium rounded-md transition-all",
                activeTab === "industry"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              By Industry
            </button>
          </div>
        </motion.div>

        {/* Grid */}
        <motion.div
          className={cn(
            "grid gap-4",
            activeTab === "role" ? "grid-cols-1 sm:grid-cols-3 max-w-4xl mx-auto" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          )}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {activeData.map((item, index) => (
            <motion.div
              key={item.title}
              className="p-6 bg-background-pure border border-border rounded-xl hover:border-primary/30 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default AudienceSection;
