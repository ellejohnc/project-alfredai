import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { Layers, ArrowRight } from "lucide-react";
import ForgeCard from "@/components/products/ForgeCard";
import { pillars } from "@/components/products/forgePillars";

const ProductOverviewSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="section-padding mesh-gradient-bg">
      <div className="container-wide">
        <motion.div
          className="max-w-3xl mx-auto text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-muted rounded-full text-xs font-medium text-muted-foreground mb-6 border border-border">
            <Layers className="w-3.5 h-3.5" />
            Our Software and Services
          </div>
          <h2 className="section-heading">
            Five layers.{" "}
            <span className="text-gradient">Your full AI suite.</span>
          </h2>
          <p className="section-subtitle">
            Each layer stands on its own — and together they become the operating system for how your business learns, acts, and stays accountable.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 mt-4 text-foreground hover:text-muted-foreground font-medium transition-colors group"
          >
            Product Overview
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <div className="space-y-5 md:space-y-6">
          {pillars.map((pillar, index) => (
            <ForgeCard key={pillar.id} pillar={pillar} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductOverviewSection;
