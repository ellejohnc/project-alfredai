import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Workflow } from "lucide-react";
import { useCases } from "@/data/useCases";

const UseCasesTeaserSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="section-padding bg-muted/30 border-y border-border">
      <div className="container-wide">
        <motion.div
          className="max-w-3xl mb-10 md:mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">Use Cases</span>
          <h2 className="section-heading">
            See it run,{" "}
            <span className="text-muted-foreground">step by step.</span>
          </h2>
          <p className="section-subtitle">
            Real workflows mapped end-to-end — showing exactly what the agents handle
            and where your team stays in control.
          </p>
        </motion.div>

        <div className="grid gap-5 md:gap-6 md:grid-cols-3">
          {useCases.map((uc, i) => {
            const Icon = uc.icon;
            return (
              <motion.div
                key={uc.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: Math.min(i * 0.08, 0.3) }}
              >
                <Link
                  to={`/products/use-cases/${uc.slug}`}
                  className="group flex flex-col h-full rounded-2xl border border-border bg-card p-6 shadow-elevation-1 hover:border-foreground/20 hover:shadow-elevation-3 transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-muted border border-border flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{uc.shortTitle}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {uc.summary}
                  </p>
                  <span className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    See how it runs
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link
            to="/products/use-cases"
            className="inline-flex items-center gap-2 text-foreground hover:text-primary font-medium transition-colors group min-h-touch"
          >
            <Workflow className="w-4 h-4" />
            Explore all use cases
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default UseCasesTeaserSection;
