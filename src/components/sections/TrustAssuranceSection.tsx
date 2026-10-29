import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ShieldCheck, ScrollText, Users, Lock } from "lucide-react";

const pillars = [
  {
    icon: ShieldCheck,
    title: "Governed by design",
    description:
      "Models are trained and deployed within private, governed boundaries. Your data is never used to train models outside your business.",
  },
  {
    icon: Lock,
    title: "Data residency & access control",
    description:
      "Role-based permissions across every layer, with your data kept where it belongs and controlled by you.",
  },
  {
    icon: ScrollText,
    title: "Full audit trail",
    description:
      "Every detection, approval, change, and action is logged through AOS for compliance and accountability.",
  },
  {
    icon: Users,
    title: "Done-for-you support",
    description:
      "We train, deliver, and support the models and workflows — with a real team behind your deployment, not a self-serve tool.",
  },
];

const TrustAssuranceSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="section-padding bg-background">
      <div className="container-wide">
        <motion.div
          className="max-w-3xl mb-12 md:mb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">Security & assurance</span>
          <h2 className="section-heading">
            Enterprise control,{" "}
            <span className="text-muted-foreground">built in.</span>
          </h2>
          <p className="section-subtitle">
            Adopting AI shouldn't mean giving up control. Governance, accountability,
            and support are part of the suite — not an afterthought.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              className="rounded-2xl border border-border bg-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: Math.min(index * 0.08, 0.3) }}
            >
              <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center mb-4">
                <pillar.icon className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">{pillar.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustAssuranceSection;
