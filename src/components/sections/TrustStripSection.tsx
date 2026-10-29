import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

const TrustStripSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const stats = [
    { value: 70, suffix: "%", label: "Admin Reduction" },
    { value: 80, suffix: "%", label: "Faster Implementation", prefix: "Up to " },
    { value: 3, suffix: "x", label: "ROI Within 90 Days" },
  ];

  const logos = [
    "Enterprise Client",
    "Global Corp",
    "Tech Leader",
    "Industry Giant",
    "Market Leader",
  ];

  return (
    <section ref={ref} className="section-padding-sm bg-background-alt border-y border-border">
      <div className="container-wide">
        {/* Stats */}
        <motion.div
          className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-semibold text-foreground mb-1">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} prefix={stat.prefix} className="tabular-nums" />
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Logo Strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="text-center text-xs uppercase tracking-wider text-muted-foreground mb-6">
            Used by professionals in these organisations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {logos.map((logo, index) => (
              <motion.div
                key={index}
                className={`h-8 px-6 flex items-center justify-center bg-muted/50 rounded-md ${
                  index === 0 ? 'animate-float' : 
                  index === 1 ? 'animate-float-delay-1' : 
                  index === 2 ? 'animate-float-delay-2' : 
                  index === 3 ? 'animate-float-delay-3' : 
                  'animate-float'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
              >
                <span className="text-sm font-medium text-muted-foreground/60">
                  {logo}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustStripSection;
