import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Workflow, Eye, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import CollapsibleSection, { CollapsibleGroup } from "@/components/mobile/CollapsibleSection";

const WhatIsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const capabilities = [
    {
      icon: Workflow,
      title: "Cut Coordination Time",
      description: "Replace back-office chasing and sub coordination with AI-driven workflows that keep projects moving automatically.",
    },
    {
      icon: Eye,
      title: "Real Site Visibility",
      description: "Give project managers real visibility into site progress, trade accountability, and project risk — not just spreadsheets.",
    },
    {
      icon: TrendingUp,
      title: "Scale Without Hiring",
      description: "Take on more projects without more office staff. Do more with the team you have.",
    },
  ];

  return (
    <section ref={ref} className="section-padding mesh-gradient-bg">
      <div className="container-wide">
        <motion.div
          className="max-w-3xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">What alfred ai Does</span>
          <h2 className="section-heading">
            One AI layer.{" "}
            <span className="text-gradient">Every jobsite connected.</span>
          </h2>
          <p className="section-subtitle">
            We provide AI-powered project coordination that connects your office, field, and subs — so nothing falls through the cracks.
          </p>
          <Link 
            to="/explained/what-is-alfred" 
            className="inline-flex items-center gap-2 mt-4 text-foreground hover:text-muted-foreground font-medium transition-colors group"
          >
            alfred ai Explained
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Desktop: 3-Column Grid */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-8">
          {capabilities.map((capability, index) => (
            <motion.div
              key={index}
              className="card-base card-hover p-8 text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              <div className="icon-container-md icon-container-primary mx-auto mb-6 animate-float-slow">
                <capability.icon className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{capability.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {capability.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Mobile: Collapsible Sections */}
        <motion.div
          className="md:hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <CollapsibleGroup>
            {capabilities.map((capability, index) => (
              <CollapsibleSection
                key={index}
                title={capability.title}
                icon={capability.icon}
                defaultOpen={index === 0}
              >
                <p className="text-muted-foreground text-sm leading-relaxed pl-11">
                  {capability.description}
                </p>
              </CollapsibleSection>
            ))}
          </CollapsibleGroup>
        </motion.div>

        {/* How it works callout */}
        <motion.div
          className="mt-12 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="card-base p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">
              How it works
            </p>
            <p className="text-foreground">
              alfred ai connects to your existing tech stack — estimation, tender, procurement, project management,
              scheduling and accounting software. Our team delivers it as a done-for-you service, with Alfred's AI
              orchestration layer learning your workflows, understanding your projects and executing tasks — saving
              days of time per week, per workflow, per staff member. No system replacement mandatory.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhatIsSection;
